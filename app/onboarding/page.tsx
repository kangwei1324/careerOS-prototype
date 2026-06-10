"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore, useHasHydrated } from "@/stores/authStore";
import Footer from "@/components/layout/Footer";
import { MALAYSIA_LOCATIONS, FIELDS_AND_SKILLS, INDUSTRIES } from "@/lib/referenceData";

// ── Candidate onboarding ─────────────────────────────────────────
function CandidateOnboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    headline: "",
    state: "",
    city: "",
    field: "",
    experience_years: "0",
    skills: [] as string[],
    website: "",
    linkedin: "",
    github: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [saving, setSaving] = useState(false);

  // Load existing profile details
  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.name) {
          let state = "";
          let city = "";
          if (data.location && data.location.includes(", ")) {
            const parts = data.location.split(", ");
            city = parts[0];
            state = parts[1];
          } else if (data.location) {
            city = data.location;
          }

          setForm({
            name: data.name || "",
            headline: data.headline || "",
            state: state || "",
            city: city || "",
            field: data.field || "",
            experience_years: String(data.experience_years || 0),
            skills: data.skills || [],
            website: data.socials?.website || "",
            linkedin: data.socials?.linkedin || "",
            github: data.socials?.github || "",
          });
        }
      })
      .catch(() => null);
  }, []);

  const update = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const addSkill = (skillName?: string) => {
    const s = (skillName || skillInput).trim();
    if (s && !form.skills.includes(s)) {
      setForm((f) => ({ ...f, skills: [...f.skills, s] }));
    }
    if (!skillName) setSkillInput("");
  };

  const removeSkill = (s: string) =>
    setForm((f) => ({ ...f, skills: f.skills.filter((x) => x !== s) }));

  const save = async () => {
    setSaving(true);
    const location = form.city && form.state ? `${form.city}, ${form.state}` : (form.city || form.state || "");
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        headline: form.headline,
        location,
        field: form.field,
        experience_years: Number(form.experience_years),
        skills: form.skills,
        socials: {
          website: form.website,
          linkedin: form.linkedin,
          github: form.github,
        }
      }),
    });
    onDone();
  };

  const suggestedSkills = form.field ? FIELDS_AND_SKILLS[form.field] || [] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Progress */}
      <div className="flex gap-2 mb-2">
        {[1, 2, 3].map((n) => (
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
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#424242]/50 mb-1.5">
              Full name *
            </label>
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Alex Johnson"
              className="w-full border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#424242]/50 mb-1.5">
              Headline
            </label>
            <input
              value={form.headline}
              onChange={(e) => update("headline", e.target.value)}
              placeholder="Frontend Engineer at Acme Co."
              className="w-full border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[#424242]/50 mb-1.5">
                State in Malaysia
              </label>
              <select
                value={form.state}
                onChange={(e) => {
                  update("state", e.target.value);
                  update("city", ""); // reset city on state change
                }}
                className="w-full border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] bg-white"
              >
                <option value="">Select State</option>
                {Object.keys(MALAYSIA_LOCATIONS).map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-widest text-[#424242]/50 mb-1.5">
                City / Town
              </label>
              <select
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                disabled={!form.state}
                className="w-full border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] bg-white disabled:opacity-50"
              >
                <option value="">Select City</option>
                {form.state &&
                  MALAYSIA_LOCATIONS[form.state]?.map((ct) => (
                    <option key={ct} value={ct}>{ct}</option>
                  ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!form.name}
            className="w-full bg-[#ffc000] text-[#424242] text-[14px] font-black py-3 rounded-xl disabled:opacity-40 hover:bg-[#e6ac00] transition-all"
          >
            Next: Background →
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="text-[18px] font-black text-[#424242]">Your background</h2>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#424242]/50 mb-1.5">
              Field / Domain *
            </label>
            <select
              value={form.field}
              onChange={(e) => {
                update("field", e.target.value);
                // Optionally clear skills that don't match or keep them
              }}
              className="w-full border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] bg-white"
            >
              <option value="">Select Field</option>
              {Object.keys(FIELDS_AND_SKILLS).map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
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
                <option key={v} value={v}>
                  {v === "0" ? "< 1 year (student/entry)" : `${v} years`}
                </option>
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
                placeholder="React, Negotiation, Excel…"
                className="flex-1 border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] transition-colors"
              />
              <button
                onClick={() => addSkill()}
                className="bg-[#424242] text-white px-4 py-2.5 rounded-xl text-[13px] font-bold hover:bg-[#333] transition-colors"
              >
                Add
              </button>
            </div>

            {/* Predefined skill suggestions */}
            {suggestedSkills.length > 0 && (
              <div className="mb-4 bg-[#f7f7f7] p-3 rounded-xl border border-[#424242]/8">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#424242]/40 mb-2">
                  Suggestions for {form.field}
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                  {suggestedSkills.map((sk) => {
                    const isSelected = form.skills.includes(sk);
                    return (
                      <button
                        key={sk}
                        onClick={() => (isSelected ? removeSkill(sk) : addSkill(sk))}
                        className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all ${
                          isSelected
                            ? "bg-[#ffc000] text-[#424242]"
                            : "bg-white text-[#424242]/60 border border-[#424242]/10 hover:border-[#424242]/20"
                        }`}
                      >
                        {isSelected ? `✓ ${sk}` : `+ ${sk}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected Skills */}
            <div className="flex flex-wrap gap-2">
              {form.skills.map((s) => (
                <span
                  key={s}
                  className="flex items-center gap-1.5 bg-[#424242] text-white text-[11px] font-bold px-3 py-1 rounded-full"
                >
                  {s}
                  <button
                    onClick={() => removeSkill(s)}
                    className="text-white/60 hover:text-white text-[10px]"
                  >
                    ✕
                  </button>
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
              onClick={() => setStep(3)}
              disabled={!form.field}
              className="flex-1 bg-[#ffc000] text-[#424242] text-[14px] font-black py-3 rounded-xl disabled:opacity-40 hover:bg-[#e6ac00] transition-all"
            >
              Next: Socials →
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h2 className="text-[18px] font-black text-[#424242]">Online presence</h2>
          <p className="text-[12px] text-[#424242]/50">
            Include links to showcase your profiles and build trust with employers.
          </p>

          {[
            { label: "Personal Website", key: "website", placeholder: "https://alexjohnson.dev" },
            { label: "LinkedIn URL", key: "linkedin", placeholder: "https://linkedin.com/in/alexj" },
            { label: "GitHub URL", key: "github", placeholder: "https://github.com/alexj" },
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

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
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
  const [form, setForm] = useState({
    company_name: "",
    industry: "",
    state: "",
    city: "",
    company_description: "",
    website: "",
    linkedin: "",
    twitter: "",
  });
  const [saving, setSaving] = useState(false);
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);

  // Load existing profile details
  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((data) => {
        if (data && data.company_name) {
          let state = "";
          let city = "";
          if (data.location && data.location.includes(", ")) {
            const parts = data.location.split(", ");
            city = parts[0];
            state = parts[1];
          } else if (data.location) {
            city = data.location;
          }

          setForm({
            company_name: data.company_name || "",
            industry: data.industry || "",
            state: state || "",
            city: city || "",
            company_description: data.company_description || "",
            website: data.socials?.website || "",
            linkedin: data.socials?.linkedin || "",
            twitter: data.socials?.twitter || "",
          });
        }
      })
      .catch(() => null);
  }, []);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    const location = form.city && form.state ? `${form.city}, ${form.state}` : (form.city || form.state || "");
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company_name: form.company_name,
        industry: form.industry,
        location,
        description: "",
        company_description: form.company_description,
        socials: {
          website: form.website,
          linkedin: form.linkedin,
          twitter: form.twitter,
        }
      }),
    });
    onDone();
  };

  const filteredIndustries = INDUSTRIES.filter((ind) =>
    ind.toLowerCase().includes(form.industry.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-[18px] font-black text-[#424242]">Set up your company</h2>

      {/* Company Name */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-widest text-[#424242]/50 mb-1.5">
          Company name *
        </label>
        <input
          value={form.company_name}
          onChange={(e) => update("company_name", e.target.value)}
          placeholder="Acme Corp"
          className="w-full border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] transition-colors"
        />
      </div>

      {/* Industry Searchable Dropdown */}
      <div className="relative">
        <label className="block text-[11px] font-bold uppercase tracking-widest text-[#424242]/50 mb-1.5">
          Industry *
        </label>
        <input
          value={form.industry}
          onChange={(e) => update("industry", e.target.value)}
          onFocus={() => setShowIndustryDropdown(true)}
          onBlur={() => setTimeout(() => setShowIndustryDropdown(false), 200)} // delay to allow click
          placeholder="Search and select industry..."
          className="w-full border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] transition-colors"
        />
        {showIndustryDropdown && filteredIndustries.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-[#424242]/15 rounded-xl shadow-lg max-h-48 overflow-y-auto">
            {filteredIndustries.map((ind) => (
              <button
                key={ind}
                type="button"
                onMouseDown={() => update("industry", ind)}
                className="w-full text-left px-4 py-2 text-[12px] text-[#424242] hover:bg-[#ffc000]/10 transition-colors"
              >
                {ind}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Location (State & City) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-[#424242]/50 mb-1.5">
            Office State
          </label>
          <select
            value={form.state}
            onChange={(e) => {
              update("state", e.target.value);
              update("city", "");
            }}
            className="w-full border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] bg-white"
          >
            <option value="">Select State</option>
            {Object.keys(MALAYSIA_LOCATIONS).map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-widest text-[#424242]/50 mb-1.5">
            Office City / Town
          </label>
          <select
            value={form.city}
            onChange={(e) => update("city", e.target.value)}
            disabled={!form.state}
            className="w-full border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] bg-white disabled:opacity-50"
          >
            <option value="">Select City</option>
            {form.state &&
              MALAYSIA_LOCATIONS[form.state]?.map((ct) => (
                <option key={ct} value={ct}>{ct}</option>
              ))}
          </select>
        </div>
      </div>

      {/* Company Description */}
      <div>
        <label className="block text-[11px] font-bold uppercase tracking-widest text-[#424242]/50 mb-1.5">
          Company Description / Mission
        </label>
        <textarea
          value={form.company_description}
          onChange={(e) => update("company_description", e.target.value)}
          rows={3}
          placeholder="Briefly describe what your company does..."
          className="w-full border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] transition-colors resize-none leading-relaxed"
        />
      </div>

      {/* Social Links */}
      <div className="border-t border-[#424242]/8 pt-4 space-y-4">
        <h3 className="text-[12px] font-black uppercase tracking-widest text-[#424242]/40">Company links</h3>
        {[
          { label: "Company Website", key: "website", placeholder: "https://acme.co" },
          { label: "LinkedIn Page", key: "linkedin", placeholder: "https://linkedin.com/company/acme" },
          { label: "Twitter / X Profile", key: "twitter", placeholder: "https://x.com/acme" },
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
      </div>

      <button
        onClick={save}
        disabled={saving || !form.company_name || !form.industry}
        className="w-full bg-[#ffc000] text-[#424242] text-[14px] font-black py-3 rounded-xl disabled:opacity-40 hover:bg-[#e6ac00] transition-all"
      >
        {saving ? "Saving…" : "Save company profile →"}
      </button>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const hydrated = useHasHydrated();

  if (!hydrated) return null;

  if (!user) {
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
            {user.role === "candidate" ? "Candidate profile setup" : "Employer profile setup"}
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
