import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const MODEL = "gemini-2.5-flash-lite";

// ── Helper ───────────────────────────────────────────────────────
async function generate(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  // @google/genai v2: response.text is a getter, but can be undefined
  // if the model response is blocked or structured differently.
  // Fall back through the candidates array to be safe.
  const text =
    response.text ??
    (response as any).candidates?.[0]?.content?.parts?.[0]?.text ??
    "";

  console.log("[gemini] raw response (first 300 chars):", text.slice(0, 300));
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

export interface SuggestionResult {
  id: number;
  reason: string;
}

export async function suggestCandidates(
  description: string,
  candidates: Array<{ id: number; name: string; headline: string; field: string; skills: string[]; bio: string; portfolio_summary: string }>
): Promise<SuggestionResult[]> {
  if (candidates.length === 0) return [];
  const prompt = `You are an expert technical recruiter and talent matching assistant for CareerOS.
An employer has provided the following requirements for what they are looking for in candidates:
"${description}"

Here is a list of candidate profiles currently in the platform, including their name, headline, skills, and a summary of their recent portfolio accomplishments:
${JSON.stringify(candidates, null, 2)}

Identify up to 3 candidates who best match the employer's requirements.
For each selected candidate, write a concise, professional 1-sentence justification (under "reason") explaining why they are a strong fit based on their specific skills or portfolio entries.

Respond ONLY with a valid JSON array of objects matching this exact format, with no markdown formatting:
[
  {
    "id": <candidate_id>,
    "reason": "..."
  }
]`;

  const raw = await generate(prompt);
  try {
    const cleaned = raw
      .replace(/^```[a-zA-Z]*\s*/m, "")
      .replace(/```\s*$/m, "")
      .trim();
    return JSON.parse(cleaned) as SuggestionResult[];
  } catch (e) {
    console.error("[gemini/suggestCandidates] parse failed:", e, "raw was:", raw);
    return [];
  }
}
