"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

const CATEGORIES = ["Technical", "Leadership", "Communication", "Creative", "Other"];

export default function LogActivityPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [form, setForm] = useState({
    raw_log: "",
    category: "Technical",
    entry_date: new Date().toISOString().split("T")[0],
  });

  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<{ entry: string; skills: string[] } | null>(null);
  const [editedEntry, setEditedEntry] = useState("");
  const [saving, setSaving] = useState(false);

  // Redirect outside of render to avoid setState-during-render error
  useEffect(() => {
    if (!user) router.push("/auth/signin");
  }, [user, router]);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const generate = async () => {
    if (!form.raw_log.trim()) return;
    setGenerating(true);
    setPreview(null);
    try {
      const res = await fetch("/api/ai/generate-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate entry");
      }

      // Ensure skills is always an array even if AI returns undefined
      const safeData = { entry: data.entry ?? "", skills: Array.isArray(data.skills) ? data.skills : [] };
      setPreview(safeData);
      setEditedEntry(safeData.entry);
    } catch (err: any) {
      alert(`AI generation failed: ${err.message || "Try again."}`);
    } finally {
      setGenerating(false);
    }
  };

  const save = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      await fetch("/api/portfolio/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_log: form.raw_log,
          polished_entry: editedEntry,
          category: form.category,
          entry_date: form.entry_date,
          skills: preview.skills,
        }),
      });
      router.push("/portfolio/manage");
    } catch {
      alert("Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <nav className="sticky top-0 z-40 bg-[#f7f7f7]/90 backdrop-blur border-b border-[#424242]/8 px-6 py-3.5 flex justify-between items-center">
        <Link href="/dashboard" className="text-xl font-black tracking-tight text-[#424242]">
          Career<span className="text-[#ffc000]">OS.</span>
        </Link>
        <Link href="/dashboard" className="text-[12px] font-bold text-[#424242]/50 hover:text-[#424242] transition-colors">
          ← Dashboard
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-[26px] font-black text-[#424242] mb-1">Log an activity</h1>
        <p className="text-[13px] text-[#424242]/45 mb-8">
          Describe what you did in plain language. AI will turn it into a portfolio entry.
        </p>

        <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-7 space-y-6">
          {/* What I did */}
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-[#424242]/50 mb-2">
              What did you do? *
            </label>
            <textarea
              value={form.raw_log}
              onChange={(e) => update("raw_log", e.target.value)}
              rows={5}
              placeholder="e.g. I led the migration of our payment service from REST to GraphQL. Worked with 3 engineers and reduced API response time by 40%. Presented the results to the CTO."
              className="w-full border border-[#424242]/15 rounded-xl px-4 py-3 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] transition-colors resize-none leading-relaxed"
            />
            <p className="text-[10px] text-[#424242]/30 mt-1">Be specific. Numbers and outcomes make better portfolio entries.</p>
          </div>

          {/* Category + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-[#424242]/50 mb-2">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                className="w-full border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] bg-white"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-[#424242]/50 mb-2">
                Date
              </label>
              <input
                type="date"
                value={form.entry_date}
                onChange={(e) => update("entry_date", e.target.value)}
                className="w-full border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000]"
              />
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={generate}
            disabled={generating || !form.raw_log.trim()}
            className="w-full bg-[#424242] text-white text-[14px] font-black py-3.5 rounded-xl hover:bg-[#333] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generating portfolio entry…
              </>
            ) : (
              "✨ Generate portfolio entry"
            )}
          </button>
        </div>

        {/* Preview */}
        {preview && (
          <div className="mt-6 bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-7 space-y-5 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ffc000]" />
              <h2 className="text-[12px] font-black uppercase tracking-widest text-[#424242]/50">
                AI-generated entry — edit freely
              </h2>
            </div>

            <textarea
              value={editedEntry}
              onChange={(e) => setEditedEntry(e.target.value)}
              rows={4}
              className="w-full border border-[#ffc000]/40 bg-[#ffc000]/5 rounded-xl px-4 py-3 text-[14px] text-[#424242] outline-none focus:border-[#ffc000] transition-colors resize-none leading-relaxed font-medium"
            />

            {preview.skills.length > 0 && (
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-[#424242]/40 mb-2">Skills extracted</p>
                <div className="flex flex-wrap gap-2">
                  {preview.skills.map((s) => (
                    <span key={s} className="bg-[#424242] text-white text-[11px] font-bold px-3 py-1 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={generate}
                disabled={generating}
                className="flex-1 border border-[#424242]/15 text-[#424242] text-[13px] font-bold py-2.5 rounded-xl hover:border-[#424242]/30 transition-all"
              >
                ↻ Regenerate
              </button>
              <button
                onClick={save}
                disabled={saving || !editedEntry.trim()}
                className="flex-1 bg-[#ffc000] text-[#424242] text-[13px] font-black py-2.5 rounded-xl hover:bg-[#e6ac00] transition-all disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save to portfolio →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
