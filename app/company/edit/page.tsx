"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthStore, useHasHydrated } from "@/stores/authStore";
import AppNavbar from "@/components/layout/AppNavbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/components/ui/Toast";
import { MALAYSIA_LOCATIONS, INDUSTRIES } from "@/lib/referenceData";

const inputCls =
  "w-full border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] transition-colors bg-white";

function Label({ children, required }: { children: React.ReactNode, required?: boolean }) {
  return (
    <label className="block text-[11px] font-bold uppercase tracking-widest text-[#424242]/50 mb-1.5">
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

export default function EditCompanyProfilePage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);

  const [form, setForm] = useState({
    company_name: "",
    industry: "",
    state: "",
    city: "",
    description: "",
    company_description: "",
    website: "",
    linkedin: "",
    twitter: "",
  });

  const hydrated = useHasHydrated();

  // Pre-fill with current profile data
  useEffect(() => {
    if (!hydrated) return;
    if (!user) { router.push("/auth/signin"); return; }
    if (user.role !== "employer") { router.push("/dashboard"); return; }

    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((p) => {
        if (p) {
          let state = "";
          let city = "";
          if (p.location && p.location.includes(", ")) {
            const parts = p.location.split(", ");
            city = parts[0];
            state = parts[1];
          } else if (p.location) {
            city = p.location;
          }

          setForm({
            company_name: p.company_name ?? "",
            industry: p.industry ?? "",
            state,
            city,
            description: p.description ?? "",
            company_description: p.company_description ?? "",
            website: p.socials?.website ?? "",
            linkedin: p.socials?.linkedin ?? "",
            twitter: p.socials?.twitter ?? "",
          });
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [hydrated, user, router]);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.company_name || !form.industry) {
      showToast("Company Name and Industry are required.", "error");
      return;
    }

    setSaving(true);
    const locationVal = form.city && form.state ? `${form.city}, ${form.state}` : (form.city || form.state || "");
    
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: form.company_name,
          industry: form.industry,
          location: locationVal,
          description: form.description,
          company_description: form.company_description,
          socials: {
            website: form.website,
            linkedin: form.linkedin,
            twitter: form.twitter,
          },
        }),
      });

      if (!res.ok) throw new Error();
      showToast("Company profile updated ✓", "success");
      router.push(`/company/${user?.username}`);
    } catch {
      showToast("Failed to save. Try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredIndustries = INDUSTRIES.filter((ind) =>
    ind.toLowerCase().includes(form.industry.toLowerCase())
  );

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
        <div className="w-full max-w-2xl mb-6">
          <Link
            href={`/company/${user.username}`}
            className="text-[12px] font-bold text-[#424242]/40 hover:text-[#424242] transition-colors flex items-center gap-1"
          >
            ← Back to company profile
          </Link>
        </div>

        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.07)] p-8 space-y-6 animate-fade-in">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#ffc000] mb-1">
              Edit profile
            </p>
            <h1 className="text-[22px] font-black text-[#424242]">
              Company details
            </h1>
          </div>

          <div className="space-y-5 animate-fade-in">
            {/* Company Name */}
            <div>
              <Label required>Company Name</Label>
              <input
                value={form.company_name}
                onChange={(e) => update("company_name", e.target.value)}
                placeholder="Acme Corp"
                className={inputCls}
              />
            </div>

            {/* Industry Combobox */}
            <div className="relative">
              <Label required>Industry</Label>
              <input
                value={form.industry}
                onChange={(e) => update("industry", e.target.value)}
                onFocus={() => setShowIndustryDropdown(true)}
                onBlur={() => setTimeout(() => setShowIndustryDropdown(false), 200)}
                placeholder="Search and select industry..."
                className={inputCls}
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
                <Label>Office State</Label>
                <select
                  value={form.state}
                  onChange={(e) => {
                    update("state", e.target.value);
                    update("city", "");
                  }}
                  className={inputCls}
                >
                  <option value="">Select State</option>
                  {Object.keys(MALAYSIA_LOCATIONS).map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Office City / Town</Label>
                <select
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  disabled={!form.state}
                  className={inputCls + " disabled:opacity-50"}
                >
                  <option value="">Select City</option>
                  {form.state &&
                    MALAYSIA_LOCATIONS[form.state]?.map((ct) => (
                      <option key={ct} value={ct}>{ct}</option>
                    ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <Label>Company Description</Label>
              <textarea
                value={form.company_description}
                onChange={(e) => update("company_description", e.target.value)}
                rows={4}
                placeholder="Describe your company..."
                className="w-full rounded-xl px-4 py-2.5 text-[13px] text-[#424242]/70 leading-relaxed resize-none outline-none border border-[#424242]/15 focus:border-[#ffc000] transition-colors bg-white"
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
                  <Label>{label}</Label>
                  <input
                    value={(form as any)[key]}
                    onChange={(e) => update(key, e.target.value)}
                    placeholder={placeholder}
                    className={inputCls}
                  />
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-[#424242]/8">
              <button
                type="button"
                onClick={() => router.push(`/company/${user.username}`)}
                className="flex-1 border border-[#424242]/15 text-[#424242] text-[13px] font-bold py-2.5 rounded-xl hover:border-[#424242]/30 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={saving || !form.company_name || !form.industry}
                className="flex-1 bg-[#ffc000] text-[#424242] text-[13px] font-black py-2.5 rounded-xl hover:bg-[#e6ac00] disabled:opacity-40 transition-all"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
