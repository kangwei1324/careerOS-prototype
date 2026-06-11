import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const MODEL = "gemini-2.5-flash-lite";

// ── Helpers ──────────────────────────────────────────────────────
async function generate(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  // gemini-2.5-flash-lite returns thinking tokens as parts with `thought: true`.
  // The SDK's response.text getter SKIPS thought parts and returns undefined
  // if the only text came from thought parts, OR if parts[0] is a thought part
  // and no non-thought text follows.
  //
  // We must manually scan candidates[0].content.parts and find the FIRST
  // part that has `text` AND does NOT have `thought: true`.
  const parts: any[] =
    (response as any).candidates?.[0]?.content?.parts ?? [];

  const textPart = parts.find(
    (p: any) => typeof p.text === "string" && p.thought !== true
  );

  const text = textPart?.text ?? response.text ?? "";

  if (!text) {
    // Log the full structure so we can debug future failures
    console.error("[gemini] empty text. Full candidate parts:", JSON.stringify(parts, null, 2).slice(0, 500));
  } else {
    console.log("[gemini] raw response (first 300 chars):", text.slice(0, 300));
  }

  return text.trim();
}

// ── Portfolio entry narrative ────────────────────────────────────
export async function generatePortfolioEntry(
  rawLog: string,
  category: string,
  date: string
): Promise<{ entry: string; skills: string[] }> {
  const prompt = `You are a professional career portfolio writer. A candidate has logged the following work activity:

Activity: ${rawLog}
Category: ${category}
Date: ${date}

Task 1 — Write a polished, professional 2-3 sentence portfolio entry in the candidate's voice. It should:
- Start with an action verb
- Quantify impact where possible (if not provided, use strong qualitative language)
- Sound authentic, not corporate-bland
- Be concise and punchy

Task 2 — Extract a JSON array of skills demonstrated. Be specific (e.g. "React", "stakeholder communication", "system design" — not just "coding").

Respond ONLY in this exact JSON format, no markdown:
{
  "entry": "...",
  "skills": ["skill1", "skill2", "skill3"]
}`;

  const raw = await generate(prompt);
  console.log("[gemini/generatePortfolioEntry] raw:", raw);
  try {
    // Strip all markdown code fence variants: ```json, ```JSON, ``` etc.
    const cleaned = raw
      .replace(/^```[a-zA-Z]*\s*/m, "") // opening fence
      .replace(/```\s*$/m, "")           // closing fence
      .trim();
    const parsed = JSON.parse(cleaned);
    return {
      entry: parsed.entry ?? "",
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
    };
  } catch (e) {
    console.error("[gemini/generatePortfolioEntry] JSON parse failed:", e, "raw was:", raw);
    // If JSON parse fails entirely, return the raw text as the entry
    return { entry: raw, skills: [] };
  }
}

// ── Smart classification + generation ────────────────────────────────
export interface ClassifiedEntry {
  section: "work_experience" | "education" | "honours_awards" | "activity_log";
  entry: string;
  skills: string[];
  structured: {
    title?: string;
    company?: string;
    institution?: string;
    degree?: string;
    issuer?: string;
    start_date?: string;
    end_date?: string | null;
    award_date?: string;
    category?: string;
  };
}

export async function classifyAndGenerateEntry(
  rawLog: string,
  date: string,
  sectionHint: "auto" | "work_experience" | "education" | "honours_awards" | "activity_log"
): Promise<ClassifiedEntry> {
  const isAuto = sectionHint === "auto";

  const structuredGuide: Record<string, string> = {
    work_experience: `"title" (job title), "company", "start_date" (YYYY-MM), "end_date" (YYYY-MM or null if ongoing)`,
    education: `"institution", "degree", "start_date" (YYYY-MM), "end_date" (YYYY-MM or null if ongoing)`,
    honours_awards: `"title" (award name), "issuer" (organisation), "award_date" (YYYY-MM)`,
    activity_log: `"category" (one of: Technical, Leadership, Communication, Creative, Other)`,
  };

  const prompt = isAuto
    ? `You are a career portfolio AI. Read this activity log and do 4 things:

1. Classify it into exactly one section:
   - "work_experience": job tasks, work projects, internships, freelance, job roles
   - "education": degrees, courses, certifications, workshops, academic achievements
   - "honours_awards": awards won, competitions placed, scholarships, official recognition
   - "activity_log": everything else — personal projects, volunteering, extracurriculars

2. Extract section-specific structured fields. Infer dates from context; fall back to reference date.
   Dates MUST be YYYY-MM format.

3. Write a polished 2-3 sentence professional portfolio narrative starting with an action verb.

4. Extract specific skills demonstrated (e.g. "React", "stakeholder management", "data analysis").

Activity log: """${rawLog}"""
Reference date: ${date}

Respond ONLY in valid JSON with no markdown fences:
{
  "section": "work_experience"|"education"|"honours_awards"|"activity_log",
  "entry": "polished narrative",
  "skills": ["skill1", "skill2"],
  "structured": {
    "title": "(work_experience/honours_awards only)",
    "company": "(work_experience only)",
    "institution": "(education only)",
    "degree": "(education only)",
    "issuer": "(honours_awards only)",
    "start_date": "YYYY-MM (work_experience/education only)",
    "end_date": "YYYY-MM or null (work_experience/education only)",
    "award_date": "YYYY-MM (honours_awards only)",
    "category": "Technical|Leadership|Communication|Creative|Other (activity_log only)"
  }
}`
    : `You are a career portfolio AI. The user logged this activity and wants it saved as ${sectionHint.replace(/_/g, " ")}.

Activity log: """${rawLog}"""
Reference date: ${date}

Extract these structured fields: ${structuredGuide[sectionHint]}
Dates must be YYYY-MM format. Infer from context or use reference date.

Also write a polished 2-3 sentence portfolio narrative starting with an action verb, and extract specific skills.

Respond ONLY in valid JSON with no markdown fences:
{
  "section": "${sectionHint}",
  "entry": "polished narrative",
  "skills": ["skill1", "skill2"],
  "structured": { ... }
}`;

  const raw = await generate(prompt);
  console.log("[gemini/classifyAndGenerateEntry] raw:", raw.slice(0, 300));
  try {
    const cleaned = raw
      .replace(/^```[a-zA-Z]*\s*/m, "")
      .replace(/```\s*$/m, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    return {
      section: parsed.section ?? (isAuto ? "activity_log" : sectionHint),
      entry: parsed.entry ?? "",
      skills: Array.isArray(parsed.skills) ? parsed.skills : [],
      structured: parsed.structured ?? {},
    };
  } catch (e) {
    console.error("[gemini/classifyAndGenerateEntry] parse failed:", e, "raw:", raw);
    return {
      section: isAuto ? "activity_log" : (sectionHint as ClassifiedEntry["section"]),
      entry: raw,
      skills: [],
      structured: {},
    };
  }
}

// ── Bio generation ───────────────────────────────────────────────
export async function generateBio(
  name: string,
  entries: Array<{ polished_entry: string; category: string }>
): Promise<string> {
  const entriesSummary = entries
    .slice(0, 10)
    .map((e) => `[${e.category}] ${e.polished_entry}`)
    .join("\n");

  const prompt = `You are writing a professional bio for ${name} based on their work portfolio entries below.

Portfolio entries:
${entriesSummary}

Write a 2-3 sentence professional bio that:
- Captures their core strengths and focus areas
- Sounds human and specific, not generic
- Is written in third person
- Does NOT use the phrase "passionate about" or "dedicated to"

Respond with ONLY the bio text, no quotes, no labels.`;

  return generate(prompt);
}

// ── Career path explorer ─────────────────────────────────────────
export interface CareerPath {
  name: string;
  timeline: string;
  description: string;
  tradeoffs: string;
  timeToGet: string;
}

export async function generateCareerPaths(input: {
  currentRole: string;
  field: string;
  yearsExperience: number;
  skills: string[];
  optimiseFor: string;
}): Promise<CareerPath[]> {
  const prompt = `You are a career advisor with access to real labour market data. A person has provided their profile:

Current role/status: ${input.currentRole}
Field: ${input.field}
Years of experience: ${input.yearsExperience}
Key skills: ${input.skills.join(", ")}
Optimising for: ${input.optimiseFor}

Generate 4 realistic career trajectory options for this person. These are NOT predictions — they are realistic patterns based on where people with similar profiles have gone.

For each path, provide:
- name: Short label (e.g. "Senior IC Track", "Management Track", "Startup Founder", "Specialist Pivot")
- timeline: Key milestones at 1yr / 3yr / 5yr marks
- description: 2 sentences describing the path
- tradeoffs: 1-2 sentences on what they gain AND what they give up
- timeToGet: Realistic estimate to reach the "established" phase of this path

Important: Each path must be honest about uncertainty and trade-offs. Avoid hype.

Respond ONLY in this exact JSON format, no markdown:
[
  {
    "name": "...",
    "timeline": "...",
    "description": "...",
    "tradeoffs": "...",
    "timeToGet": "..."
  }
]`;

  const raw = await generate(prompt);
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned) as CareerPath[];
  } catch {
    return [];
  }
}
