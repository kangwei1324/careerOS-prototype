"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";

interface CareerPath {
  name: string;
  timeline: string;
  description: string;
  tradeoffs: string;
  timeToGet: string;
}

const OPTIMISE_OPTIONS = [
  { value: "salary", label: "💰 Salary ceiling" },
  { value: "impact", label: "🌍 Impact & mission" },
  { value: "flexibility", label: "🕐 Work-life flexibility" },
  { value: "seniority", label: "🏆 Seniority & leadership" },
  { value: "learning", label: "🧠 Learning & growth" },
];

export default function ExplorePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [form, setForm] = useState({
    currentRole: "",
    field: "",
    yearsExperience: "0",
    skills: [] as string[],
    optimiseFor: "growth",
  });
  const [skillInput, setSkillInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [paths, setPaths] = useState<CareerPath[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  if (!user) { router.push("/auth/signin"); return null; }

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) setForm((f) => ({ ...f, skills: [...f.skills, s] }));
    setSkillInput("");
  };

  const removeSkill = (s: string) =>
    setForm((f) => ({ ...f, skills: f.skills.filter((x) => x !== s) }));

  const generate = async () => {
    if (!form.currentRole || !form.field) return;
    setLoading(true);
    setPaths([]);
    setSelected(null);
    try {
      const res = await fetch("/api/ai/career-paths", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, yearsExperience: Number(form.yearsExperience) }),
      });
      const data = await res.json();
      setPaths(data.paths ?? []);
    } catch {
      alert("Generation failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

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

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-[28px] font-black text-[#424242] mb-1">Career path explorer</h1>
          <p className="text-[13px] text-[#424242]/45 leading-relaxed max-w-xl">
            See where people with your background realistically end up. Not predictions — patterns. With honest trade-offs.
          </p>
        </div>

        {/* Input form */}
        <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-7 mb-8">
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-[#424242]/50 mb-1.5">
                Current role / status *
              </label>
              <input
                value={form.currentRole}
                onChange={(e) => update("currentRole", e.target.value)}
                placeholder="Junior Frontend Engineer, CS Student…"
                className="w-full border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-[#424242]/50 mb-1.5">
                Field / industry *
              </label>
              <input
                value={form.field}
                onChange={(e) => update("field", e.target.value)}
                placeholder="Software Engineering, Product, Design…"
                className="w-full border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-[#424242]/50 mb-1.5">
                Years of experience
              </label>
              <select
                value={form.yearsExperience}
                onChange={(e) => update("yearsExperience", e.target.value)}
                className="w-full border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] bg-white"
              >
                {["0", "1", "2", "3", "5", "7", "10"].map((v) => (
                  <option key={v} value={v}>{v === "0" ? "< 1 year" : `${v} years`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-[#424242]/50 mb-1.5">
                Optimising for
              </label>
              <select
                value={form.optimiseFor}
                onChange={(e) => update("optimiseFor", e.target.value)}
                className="w-full border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] bg-white"
              >
                {OPTIMISE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Skills */}
          <div className="mt-5">
            <label className="block text-[11px] font-black uppercase tracking-widest text-[#424242]/50 mb-1.5">
              Key skills (optional)
            </label>
            <div className="flex gap-2 mb-3">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                placeholder="React, Leadership, Python…"
                className="flex-1 border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] transition-colors"
              />
              <button onClick={addSkill} className="bg-[#424242] text-white px-4 rounded-xl text-[13px] font-bold hover:bg-[#333] transition-colors">
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.skills.map((s) => (
                <span key={s} className="flex items-center gap-1.5 bg-[#ffc000]/15 text-[#424242] text-[11px] font-bold px-3 py-1 rounded-full">
                  {s}
                  <button onClick={() => removeSkill(s)} className="text-[#424242]/40 hover:text-[#424242] text-[10px]">✕</button>
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={generate}
            disabled={loading || !form.currentRole || !form.field}
            className="w-full mt-6 bg-[#424242] text-white text-[14px] font-black py-3.5 rounded-xl hover:bg-[#333] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Exploring your paths…
              </>
            ) : (
              "🧭 Explore career paths"
            )}
          </button>
        </div>

        {/* Paths */}
        {paths.length > 0 && (
          <div className="animate-slide-up">
            {/* Disclaimer */}
            <div className="bg-[#ffc000]/10 border border-[#ffc000]/25 rounded-xl px-5 py-3 mb-6 flex gap-3 items-start">
              <span className="text-lg mt-0.5">⚠️</span>
              <p className="text-[12px] text-[#424242]/70 leading-relaxed">
                <strong>These are patterns, not predictions.</strong> They reflect where people with similar backgrounds have gone — not where you will go. Your path depends on factors unique to you.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {paths.map((path, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(selected === i ? null : i)}
                  className={`text-left bg-white rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.05)] p-5 border-2 transition-all hover:shadow-[0_4px_24px_rgba(0,0,0,0.09)] ${
                    selected === i ? "border-[#ffc000]" : "border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 rounded-full bg-[#ffc000] text-[#424242] text-[11px] font-black flex items-center justify-center">
                      {i + 1}
                    </span>
                    <h3 className="text-[14px] font-black text-[#424242]">{path.name}</h3>
                  </div>
                  <p className="text-[12px] text-[#424242]/65 leading-relaxed mb-3">{path.description}</p>
                  <div className="text-[11px] text-[#424242]/40 bg-[#424242]/4 rounded-lg px-3 py-2 mb-3">
                    ⏱ {path.timeToGet}
                  </div>

                  {selected === i && (
                    <div className="mt-3 pt-3 border-t border-[#424242]/8 space-y-3 animate-fade-in">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#424242]/40 mb-1">Timeline</p>
                        <p className="text-[12px] text-[#424242]/65 leading-relaxed">{path.timeline}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#424242]/40 mb-1">Trade-offs</p>
                        <p className="text-[12px] text-[#424242]/65 leading-relaxed">{path.tradeoffs}</p>
                      </div>
                    </div>
                  )}

                  <p className="text-[10px] text-[#ffc000] font-bold mt-3">
                    {selected === i ? "↑ Show less" : "↓ See trade-offs"}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
