"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import Footer from "@/components/layout/Footer";

// ── Candidate onboarding ─────────────────────────────────────────
function CandidateOnboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", headline: "", location: "",
    field: "", experience_years: "0", skills: [] as string[],
  });
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills.includes(s)) {
      setForm((f) => ({ ...f, skills: [...f.skills, s] }));
    }
    setSkillInput("");
  };

  const removeSkill = (s: string) =>
    setForm((f) => ({ ...f, skills: f.skills.filter((x) => x !== s) }));

  const save = async () => {
    setSaving(true);
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, experience_years: Number(form.experience_years) }),
    });
    onDone();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Progress */}
      <div className="flex gap-2 mb-2">
        {[1, 2].map((n) => (
          <div
            key={n}
            className={`h-1 flex-1 rounded-full transition-all ${
              n <= step ? "bg-[#ffc000]" : "bg-[#424242]/10"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <>
          <h2 className="text-[18px] font-black text-[#424242]">Tell us about yourself</h2>
          {[
            { label: "Full name", key: "name", placeholder: "Alex Johnson" },
            { label: "Headline", key: "headline", placeholder: "Frontend Engineer at Acme Co." },
            { label: "Location", key: "location", placeholder: "Kuala Lumpur, Malaysia" },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[#424242]/50 mb-1.5">
                {label}
              </label>
              <input
                value={(form as any)[key]}
                onChange={(e) => update(key, e.target.value)}
                placeholder={placeholder}
                className="w-full border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] transition-colors"
              />
            </div>
          ))}
          <button
            onClick={() => setStep(2)}
            disabled={!form.name}
            className="w-full bg-[#ffc000] text-[#424242] text-[14px] font-black py-3 rounded-xl disabled:opacity-40 hover:bg-[#e6ac00] transition-all"
          >
            Next →
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="text-[18px] font-black text-[#424242]">Your background</h2>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#424242]/50 mb-1.5">
              Field / Industry
            </label>
            <input
              value={form.field}
              onChange={(e) => update("field", e.target.value)}
              placeholder="Software Engineering, Product, Design…"
              className="w-full border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#424242]/50 mb-1.5">
              Years of experience
            </label>
            <select
              value={form.experience_years}
              onChange={(e) => update("experience_years", e.target.value)}
              className="w-full border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] bg-white"
            >
              {["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10+"].map((v) => (
                <option key={v} value={v}>{v === "0" ? "< 1 year (student)" : `${v} years`}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#424242]/50 mb-1.5">
              Skills (press Enter to add)
            </label>
            <div className="flex gap-2 mb-3">
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                placeholder="React, Python, Leadership…"
                className="flex-1 border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] transition-colors"
              />
              <button
                onClick={addSkill}
                className="bg-[#424242] text-white px-4 py-2.5 rounded-xl text-[13px] font-bold hover:bg-[#333] transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.skills.map((s) => (
                <span
                  key={s}
                  className="flex items-center gap-1.5 bg-[#ffc000]/15 text-[#424242] text-[11px] font-bold px-3 py-1 rounded-full"
                >
                  {s}
                  <button onClick={() => removeSkill(s)} className="text-[#424242]/40 hover:text-[#424242] text-[10px]">✕</button>
                </span>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 border border-[#424242]/15 text-[#424242] text-[14px] font-bold py-3 rounded-xl hover:border-[#424242]/30 transition-all"
            >
              ← Back
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 bg-[#ffc000] text-[#424242] text-[14px] font-black py-3 rounded-xl disabled:opacity-40 hover:bg-[#e6ac00] transition-all"
            >
              {saving ? "Saving…" : "Go to dashboard →"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Employer onboarding ──────────────────────────────────────────
function EmployerOnboarding({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ company_name: "", industry: "", location: "" });
  const [saving, setSaving] = useState(false);
  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    onDone();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-[18px] font-black text-[#424242]">Set up your company</h2>
      {[
      { label: "Company name",              key: "company_name", placeholder: "Acme Corp" },
        { label: "Industry",                  key: "industry",     placeholder: "FinTech, SaaS, E-commerce…" },
        { label: "Office location address",   key: "location",     placeholder: "123 Main St, Kuala Lumpur, Malaysia" },
      ].map(({ label, key, placeholder }) => (
        <div key={key}>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-[#424242]/50 mb-1.5">
            {label}
          </label>
          <input
            value={(form as any)[key]}
            onChange={(e) => update(key, e.target.value)}
            placeholder={placeholder}
            className="w-full border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] transition-colors"
          />
        </div>
      ))}
      <button
        onClick={save}
        disabled={saving || !form.company_name}
        className="w-full bg-[#ffc000] text-[#424242] text-[14px] font-black py-3 rounded-xl disabled:opacity-40 hover:bg-[#e6ac00] transition-all"
      >
        {saving ? "Saving…" : "Start browsing talent →"}
      </button>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  if (!user) {
    // Redirect handled client-side
    if (typeof window !== "undefined") router.push("/auth/signin");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="text-2xl font-black text-[#424242] mb-10">
        Career<span className="text-[#ffc000]">OS.</span>
      </Link>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.07)] p-8">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#ffc000] mb-2">
          {user.role === "candidate" ? "Candidate onboarding" : "Employer onboarding"}
        </p>

        {user.role === "candidate" ? (
          <CandidateOnboarding onDone={() => router.push("/dashboard")} />
        ) : (
          <EmployerOnboarding onDone={() => router.push("/dashboard")} />
        )}
      </div>
      </div>
      <Footer />
    </div>
  );
}
