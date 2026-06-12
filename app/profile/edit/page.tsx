"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore, useHasHydrated } from "@/stores/authStore";
import AppNavbar from "@/components/layout/AppNavbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/components/ui/Toast";

const inputCls =
  "w-full border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] transition-colors bg-white";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-bold uppercase tracking-widest text-[#424242]/50 mb-1.5">
      {children}
    </label>
  );
}

export default function EditProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    name: "",
    headline: "",
    location: "",
    field: "",
    experience_years: "0",
    skills: [] as string[],
  });
  const [skillInput, setSkillInput] = useState("");

  const hydrated = useHasHydrated();

  // Pre-fill with current profile data
  useEffect(() => {
    if (!hydrated) return;
    if (!user) { router.push("/auth/signin"); return; }
    if (user.role !== "candidate") { router.push("/dashboard"); return; }

    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((p) => {
        if (p) {
          setForm({
            name: p.name ?? "",
            headline: p.headline ?? "",
            location: p.location ?? "",
            field: p.field ?? "",
            experience_years: String(p.experience_years ?? "0"),
            skills: Array.isArray(p.skills) ? p.skills : [],
          });
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [hydrated, user, router]);


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
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      showToast("Profile updated ✓", "success");
      router.push("/dashboard");
    } catch {
      showToast("Failed to save. Try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!hydrated || !user || loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex flex-col">
        <AppNavbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#424242]/20 border-t-[#ffc000] rounded-full animate-spin" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex flex-col">
      <AppNavbar />

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {/* Back link */}
        <div className="w-full max-w-md mb-6">
          <Link
            href="/dashboard"
            className="text-[12px] font-bold text-[#424242]/40 hover:text-[#424242] transition-colors flex items-center gap-1"
          >
            ← Back to dashboard
          </Link>
        </div>

        <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.07)] p-8 space-y-6 animate-fade-in">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#ffc000] mb-1">
              Edit profile
            </p>
            <h1 className="text-[22px] font-black text-[#424242]">
              {step === 1 ? "Your details" : "Background & skills"}
            </h1>
          </div>

          {/* Step progress */}
          <div className="flex gap-2">
            {[1, 2].map((n) => (
              <div
                key={n}
                className={`h-1 flex-1 rounded-full transition-all ${
                  n <= step ? "bg-[#ffc000]" : "bg-[#424242]/10"
                }`}
              />
            ))}
          </div>

          {/* ── Step 1: Personal info ─────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              {[
                { label: "Full name",  key: "name",      placeholder: "Alex Johnson" },
                { label: "Headline",   key: "headline",  placeholder: "Frontend Engineer at Acme Co." },
                { label: "Location",   key: "location",  placeholder: "Kuala Lumpur, Malaysia" },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <Label>{label}</Label>
                  <input
                    value={(form as any)[key]}
                    onChange={(e) => update(key, e.target.value)}
                    placeholder={placeholder}
                    className={inputCls}
                  />
                </div>
              ))}

              <button
                onClick={() => setStep(2)}
                disabled={!form.name.trim()}
                className="w-full bg-[#ffc000] text-[#424242] text-[14px] font-black py-3 rounded-xl disabled:opacity-40 hover:bg-[#e6ac00] transition-all"
              >
                Next →
              </button>
            </div>
          )}

          {/* ── Step 2: Background & skills ──────────────────────── */}
          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <Label>Field / Industry</Label>
                <input
                  value={form.field}
                  onChange={(e) => update("field", e.target.value)}
                  placeholder="Software Engineering, Product, Design…"
                  className={inputCls}
                />
              </div>

              <div>
                <Label>Years of experience</Label>
                <select
                  value={form.experience_years}
                  onChange={(e) => update("experience_years", e.target.value)}
                  className={inputCls}
                >
                  {["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10+"].map((v) => (
                    <option key={v} value={v}>
                      {v === "0" ? "< 1 year (student)" : `${v} years`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Skills (press Enter to add)</Label>
                <div className="flex gap-2 mb-3">
                  <input
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                    placeholder="React, Python, Leadership…"
                    className={`flex-1 border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] transition-colors`}
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
                      <button
                        onClick={() => removeSkill(s)}
                        className="text-[#424242]/40 hover:text-[#424242] text-[10px]"
                        aria-label={`Remove ${s}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
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
                  {saving ? "Saving…" : "Save changes →"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
