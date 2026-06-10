"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, useHasHydrated } from "@/stores/authStore";
import AppNavbar from "@/components/layout/AppNavbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/components/ui/Toast";

// ── Types ─────────────────────────────────────────────────────────────────────

type SectionKey = "auto" | "work_experience" | "education" | "honours_awards" | "activity_log";
type SavedSection = Exclude<SectionKey, "auto">;

// ── Constants ─────────────────────────────────────────────────────────────────

const SECTION_OPTIONS: { value: SectionKey; label: string; icon: string }[] = [
  { value: "auto",            label: "Auto — AI decides",   icon: "🤖" },
  { value: "work_experience", label: "Work Experience",      icon: "💼" },
  { value: "education",       label: "Education",            icon: "🎓" },
  { value: "honours_awards",  label: "Honours & Awards",     icon: "🏆" },
  { value: "activity_log",    label: "Activity Log",         icon: "📝" },
];

const SECTION_BADGES: Record<SavedSection, { label: string; icon: string; className: string }> = {
  work_experience: { label: "Work Experience",  icon: "💼", className: "bg-blue-100 text-blue-700" },
  education:       { label: "Education",        icon: "🎓", className: "bg-purple-100 text-purple-700" },
  honours_awards:  { label: "Honours & Awards", icon: "🏆", className: "bg-yellow-100 text-yellow-700" },
  activity_log:    { label: "Activity Log",     icon: "📝", className: "bg-[#424242]/8 text-[#424242]/60" },
};

const ACTIVITY_CATEGORIES = ["Technical", "Leadership", "Communication", "Creative", "Other"];

const today = new Date().toISOString().split("T")[0];

// ── Shared UI helpers ─────────────────────────────────────────────────────────

const inputCls =
  "border border-[#424242]/15 rounded-xl px-3 py-2 text-[13px] text-[#424242] outline-none focus:border-[#ffc000]/70 focus:ring-2 focus:ring-[#ffc000]/10 transition-all bg-white w-full";

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-[11px] font-black uppercase tracking-widest text-[#424242]/50 mb-1.5 block">
      {children}
      {required && <span className="text-[#ffc000] ml-0.5">*</span>}
    </label>
  );
}

// ── Structured field editors (per section) ────────────────────────────────────

function StructuredFields({
  section,
  structured,
  onChange,
}: {
  section: SavedSection;
  structured: Record<string, string>;
  onChange: (s: Record<string, string>) => void;
}) {
  const set = (k: string, v: string) => onChange({ ...structured, [k]: v });

  if (section === "work_experience") {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel required>Job Title</FieldLabel>
            <input className={inputCls} value={structured.title || ""} onChange={(e) => set("title", e.target.value)} placeholder="Software Engineer" />
          </div>
          <div>
            <FieldLabel required>Company</FieldLabel>
            <input className={inputCls} value={structured.company || ""} onChange={(e) => set("company", e.target.value)} placeholder="TalentBank" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel required>Start Date</FieldLabel>
            <input type="month" className={inputCls} value={structured.start_date || ""} onChange={(e) => set("start_date", e.target.value)} />
          </div>
          <div>
            <FieldLabel>End Date (blank = present)</FieldLabel>
            <input type="month" className={inputCls} value={structured.end_date || ""} onChange={(e) => set("end_date", e.target.value)} />
          </div>
        </div>
      </div>
    );
  }

  if (section === "education") {
    return (
      <div className="space-y-3">
        <div>
          <FieldLabel required>Institution</FieldLabel>
          <input className={inputCls} value={structured.institution || ""} onChange={(e) => set("institution", e.target.value)} placeholder="University of Nottingham Malaysia" />
        </div>
        <div>
          <FieldLabel required>Degree / Qualification</FieldLabel>
          <input className={inputCls} value={structured.degree || ""} onChange={(e) => set("degree", e.target.value)} placeholder="BSc Computer Science with AI" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel required>Start Date</FieldLabel>
            <input type="month" className={inputCls} value={structured.start_date || ""} onChange={(e) => set("start_date", e.target.value)} />
          </div>
          <div>
            <FieldLabel>End Date (blank = present)</FieldLabel>
            <input type="month" className={inputCls} value={structured.end_date || ""} onChange={(e) => set("end_date", e.target.value)} />
          </div>
        </div>
      </div>
    );
  }

  if (section === "honours_awards") {
    return (
      <div className="space-y-3">
        <div>
          <FieldLabel required>Award / Title</FieldLabel>
          <input className={inputCls} value={structured.title || ""} onChange={(e) => set("title", e.target.value)} placeholder="NottHack 2026 – 1st Runner Up" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Issuing Organisation</FieldLabel>
            <input className={inputCls} value={structured.issuer || ""} onChange={(e) => set("issuer", e.target.value)} placeholder="CS Society UoN" />
          </div>
          <div>
            <FieldLabel required>Date</FieldLabel>
            <input type="month" className={inputCls} value={structured.award_date || ""} onChange={(e) => set("award_date", e.target.value)} />
          </div>
        </div>
      </div>
    );
  }

  // activity_log
  return (
    <div>
      <FieldLabel>Category</FieldLabel>
      <select className={inputCls} value={structured.category || "Other"} onChange={(e) => set("category", e.target.value)}>
        {ACTIVITY_CATEGORIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LogActivityPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { showToast } = useToast();

  // Input form
  const [sectionMode, setSectionMode] = useState<SectionKey>("auto");
  const [rawLog, setRawLog] = useState("");
  const [date, setDate] = useState(today);

  // Process state
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Preview / edit state (populated after AI response)
  const [showPreview, setShowPreview] = useState(false);
  const [editSection, setEditSection] = useState<SavedSection>("activity_log");
  const [editEntry, setEditEntry] = useState("");
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [editStructured, setEditStructured] = useState<Record<string, string>>({});

  const hydrated = useHasHydrated();

  useEffect(() => {
    if (hydrated && !user) router.push("/auth/signin");
    else if (hydrated && user && user.role !== "candidate") router.push("/dashboard");
  }, [hydrated, user, router]);

  const generate = async () => {
    if (!rawLog.trim()) return;
    setGenerating(true);
    setShowPreview(false);
    try {
      const res = await fetch("/api/ai/generate-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_log: rawLog, section: sectionMode, date }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setEditSection(data.section || "activity_log");
      setEditEntry(data.entry || "");
      setEditSkills(Array.isArray(data.skills) ? data.skills : []);
      setEditStructured(data.structured || {});
      setShowPreview(true);
    } catch (err: any) {
      showToast(`AI generation failed: ${err.message || "Try again."}`, "error");
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const monthDate = date.slice(0, 7);
      let endpoint = "";
      let body: Record<string, unknown> = {};

      switch (editSection) {
        case "work_experience":
          endpoint = "/api/portfolio/work-experience";
          body = {
            title: editStructured.title?.trim() || "Untitled Role",
            company: editStructured.company?.trim() || "Unknown",
            start_date: editStructured.start_date || monthDate,
            end_date: editStructured.end_date || null,
            description: editEntry,
          };
          break;
        case "education":
          endpoint = "/api/portfolio/education";
          body = {
            institution: editStructured.institution?.trim() || "Unknown",
            degree: editStructured.degree?.trim() || "Unknown",
            start_date: editStructured.start_date || monthDate,
            end_date: editStructured.end_date || null,
          };
          break;
        case "honours_awards":
          endpoint = "/api/portfolio/honours";
          body = {
            title: editStructured.title?.trim() || "Untitled",
            issuer: editStructured.issuer?.trim() || "",
            award_date: editStructured.award_date || monthDate,
          };
          break;
        default:
          endpoint = "/api/portfolio/entries";
          body = {
            raw_log: rawLog,
            polished_entry: editEntry,
            category: editStructured.category || "Other",
            entry_date: date,
            skills: editSkills,
          };
          break;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");
      showToast("Entry saved to portfolio ✓", "success");
      router.push(`/portfolio/${user?.username}`);
    } catch {
      showToast("Failed to save. Try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!hydrated || !user) return null;

  const badge = SECTION_BADGES[editSection];

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <AppNavbar />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-[26px] font-black text-[#424242] mb-1">Log an activity</h1>
        <p className="text-[13px] text-[#424242]/50 mb-8">
          Describe what you did — AI will classify it and build the right portfolio entry.
        </p>

        {/* ── Input card ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-7 space-y-6">
          {/* Raw log */}
          <div>
            <FieldLabel required>What did you do?</FieldLabel>
            <textarea
              id="raw_log"
              value={rawLog}
              onChange={(e) => setRawLog(e.target.value)}
              rows={5}
              placeholder="e.g. I led the migration of our payment service from REST to GraphQL. Worked with 3 engineers and reduced API response time by 40%. Presented results to the CTO."
              className="w-full border border-[#424242]/15 rounded-xl px-4 py-3 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] transition-colors resize-none leading-relaxed"
            />
            <p className="text-[10px] text-[#424242]/40 mt-1">
              Be specific — numbers and outcomes make better portfolio entries.
            </p>
          </div>

          {/* Section + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel>Section</FieldLabel>
              <select
                value={sectionMode}
                onChange={(e) => setSectionMode(e.target.value as SectionKey)}
                className="w-full border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] bg-white"
              >
                {SECTION_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.icon} {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Date</FieldLabel>
              <input
                type="date"
                value={date}
                max={today}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000]"
              />
            </div>
          </div>

          {/* Generate button */}
          <button
            id="log-generate-btn"
            onClick={generate}
            disabled={generating || !rawLog.trim()}
            className="w-full bg-[#424242] text-white text-[14px] font-black py-3.5 rounded-xl hover:bg-[#333] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
                Analysing &amp; generating…
              </>
            ) : (
              "✨ Analyse & Generate"
            )}
          </button>
        </div>

        {/* ── Preview card ─────────────────────────────────────────────── */}
        {showPreview && (
          <div className="mt-6 bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-7 space-y-5 animate-fade-in">
            {/* Section badge + change override */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${badge.className}`}>
                  {badge.icon} {badge.label}
                </span>
                {sectionMode === "auto" && (
                  <span className="text-[10px] text-[#424242]/35">AI classified</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#424242]/40">Move to:</span>
                <select
                  value={editSection}
                  onChange={(e) => {
                    setEditSection(e.target.value as SavedSection);
                    // Reset structured so new fields start empty (AI data may not match new section)
                    setEditStructured({});
                  }}
                  className="border border-[#424242]/15 rounded-lg px-2 py-1.5 text-[12px] text-[#424242] outline-none focus:border-[#ffc000] bg-white"
                >
                  {SECTION_OPTIONS.filter((o) => o.value !== "auto").map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.icon} {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Structured fields for the detected/chosen section */}
            <div className="border border-[#424242]/8 rounded-xl p-4 bg-[#f7f7f7] space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-[#424242]/40 mb-3">
                Entry details — review &amp; edit
              </p>
              <StructuredFields
                section={editSection}
                structured={editStructured}
                onChange={setEditStructured}
              />
            </div>

            {/* Polished narrative */}
            <div>
              <FieldLabel>AI-generated narrative — edit freely</FieldLabel>
              <textarea
                value={editEntry}
                onChange={(e) => setEditEntry(e.target.value)}
                rows={4}
                aria-label="Edit AI-generated portfolio entry"
                className="w-full border border-[#ffc000]/40 bg-[#ffc000]/5 rounded-xl px-4 py-3 text-[14px] text-[#424242] outline-none focus:border-[#ffc000] transition-colors resize-none leading-relaxed font-medium"
              />
            </div>

            {/* Skills */}
            {editSkills.length > 0 && (
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-[#424242]/40 mb-2">
                  Skills extracted
                </p>
                <div className="flex flex-wrap gap-2">
                  {editSkills.map((s) => (
                    <span key={s} className="bg-[#ffc000]/15 text-[#424242] text-[11px] font-bold px-3 py-1.5 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={generate}
                disabled={generating}
                className="flex-1 border border-[#424242]/15 text-[#424242] text-[13px] font-bold py-2.5 rounded-xl hover:border-[#424242]/30 transition-all disabled:opacity-40"
              >
                ↻ Regenerate
              </button>
              <button
                id="log-save-btn"
                onClick={save}
                disabled={saving || !editEntry.trim()}
                className="flex-1 bg-[#ffc000] text-[#424242] text-[13px] font-black py-2.5 rounded-xl hover:bg-[#e6ac00] transition-all disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save to portfolio →"}
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
