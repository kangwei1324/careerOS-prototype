"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import AppNavbar from "@/components/layout/AppNavbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/components/ui/Toast";
import { MALAYSIA_LOCATIONS, INDUSTRIES } from "@/lib/referenceData";

interface Profile {
  company_name: string;
  industry: string;
  location: string;
  description: string;
  company_description: string;
  socials: {
    website?: string;
    linkedin?: string;
    twitter?: string;
  };
}

export default function CompanyProfileClient({
  employerId,
  username,
  profile: initialProfile,
}: {
  employerId: number;
  username: string;
  profile: Profile;
}) {
  const user = useAuthStore((s) => s.user);
  const { showToast } = useToast();

  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Inline company description editing
  const [isDescEditing, setIsDescEditing] = useState(false);
  const [descDraft, setDescDraft] = useState(initialProfile.company_description || "");
  const [savingDesc, setSavingDesc] = useState(false);

  const [form, setForm] = useState({
    company_name: initialProfile.company_name,
    industry: initialProfile.industry,
    state: "",
    city: "",
    website: initialProfile.socials?.website || "",
    linkedin: initialProfile.socials?.linkedin || "",
    twitter: initialProfile.socials?.twitter || "",
  });

  const [showIndustryDropdown, setShowIndustryDropdown] = useState(false);

  const isOwner = user?.username === username;

  // Sync state & city from location string
  useEffect(() => {
    if (profile.location && profile.location.includes(", ")) {
      const parts = profile.location.split(", ");
      setForm((f) => ({ ...f, city: parts[0], state: parts[1] }));
    } else if (profile.location) {
      setForm((f) => ({ ...f, city: profile.location, state: "" }));
    }
  }, [profile.location]);

  const updateForm = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
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
          description: profile.description,
          company_description: profile.company_description,
          socials: {
            website: form.website,
            linkedin: form.linkedin,
            twitter: form.twitter,
          },
        }),
      });

      if (res.ok) {
        setProfile({
          company_name: form.company_name,
          industry: form.industry,
          location: locationVal,
          description: profile.description,
          company_description: profile.company_description,
          socials: {
            website: form.website,
            linkedin: form.linkedin,
            twitter: form.twitter,
          },
        });
        setIsEditing(false);
        showToast("Company profile updated successfully ✓", "success");
      } else {
        throw new Error();
      }
    } catch {
      showToast("Failed to save changes. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Save only the company_description field inline
  const handleDescSave = async () => {
    setSavingDesc(true);
    try {
      const locationVal = form.city && form.state ? `${form.city}, ${form.state}` : (form.city || form.state || "");
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: profile.company_name,
          industry: profile.industry,
          location: locationVal,
          description: profile.description,
          company_description: descDraft,
          socials: profile.socials,
        }),
      });

      if (res.ok) {
        setProfile((prev) => ({ ...prev, company_description: descDraft }));
        setIsDescEditing(false);
        showToast("Description updated successfully ✓", "success");
      } else {
        throw new Error();
      }
    } catch {
      showToast("Failed to save description. Please try again.", "error");
    } finally {
      setSavingDesc(false);
    }
  };

  const handleCancel = () => {
    // Revert form values to current profile state
    let state = "";
    let city = "";
    if (profile.location && profile.location.includes(", ")) {
      const parts = profile.location.split(", ");
      city = parts[0];
      state = parts[1];
    } else if (profile.location) {
      city = profile.location;
    }

    setForm({
      company_name: profile.company_name,
      industry: profile.industry,
      state,
      city,
      website: profile.socials?.website || "",
      linkedin: profile.socials?.linkedin || "",
      twitter: profile.socials?.twitter || "",
    });
    setIsEditing(false);
  };

  const filteredIndustries = INDUSTRIES.filter((ind) =>
    ind.toLowerCase().includes(form.industry.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex flex-col">
      <AppNavbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        <div className="bg-white rounded-2xl shadow-[var(--card-shadow)] p-7 space-y-6">
          
          {/* Header row */}
          <div className="flex justify-between items-center border-b border-[#424242]/8 pb-4">
            <h1 className="text-[20px] font-black text-[#424242]">Company Profile</h1>
            {isOwner && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-[#ffc000] text-[#424242] text-[12px] font-black px-4 py-2 rounded-full hover:bg-[#e6ac00] transition-all"
              >
                ✏️ Edit Profile
              </button>
            )}
          </div>

          {!isEditing ? (
            // ── View Mode ────────────────────────────────────────────────
            <div className="space-y-6 animate-fade-in">
              <div className="flex gap-4 items-start">
                <div
                  className="w-16 h-16 rounded-2xl bg-[#424242] flex items-center justify-center text-white text-[24px] font-black flex-shrink-0"
                  aria-hidden="true"
                >
                  {profile.company_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-[20px] font-black text-[#424242]">{profile.company_name}</h2>
                  <div className="flex flex-wrap gap-3 mt-2 text-[12px] text-[#424242]/50">
                    {profile.industry && <span>🏭 {profile.industry}</span>}
                    {profile.location && <span>📍 {profile.location}</span>}
                  </div>
                </div>
              </div>

              {/* Social Links */}
              {profile.socials && (profile.socials.website || profile.socials.linkedin || profile.socials.twitter) && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-[#424242]/8">
                  {profile.socials.website && (
                    <a
                      href={profile.socials.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#424242]/75 hover:text-[#424242] text-[11px] font-semibold flex items-center gap-1 bg-[#424242]/5 hover:bg-[#424242]/10 px-3 py-1.5 rounded-full transition-all"
                    >
                      🔗 Website
                    </a>
                  )}
                  {profile.socials.linkedin && (
                    <a
                      href={profile.socials.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#424242]/75 hover:text-[#424242] text-[11px] font-semibold flex items-center gap-1 bg-[#424242]/5 hover:bg-[#424242]/10 px-3 py-1.5 rounded-full transition-all"
                    >
                      💼 LinkedIn
                    </a>
                  )}
                  {profile.socials.twitter && (
                    <a
                      href={profile.socials.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#424242]/75 hover:text-[#424242] text-[11px] font-semibold flex items-center gap-1 bg-[#424242]/5 hover:bg-[#424242]/10 px-3 py-1.5 rounded-full transition-all"
                    >
                      🐦 Twitter
                    </a>
                  )}
                </div>
              )}

              {/* Description — inline editable */}
              <div className="pt-4 border-t border-[#424242]/8">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-[#424242]/40">
                    Company Description
                  </h3>
                  {isOwner && !isDescEditing && (
                    <button
                      onClick={() => {
                        setDescDraft(profile.company_description || "");
                        setIsDescEditing(true);
                      }}
                      className="text-[11px] font-bold text-[#424242]/50 hover:text-[#424242] flex items-center gap-1 transition-colors"
                    >
                      ✏️ Edit
                    </button>
                  )}
                </div>
                <textarea
                  value={isDescEditing ? descDraft : (profile.company_description || "")}
                  onChange={(e) => setDescDraft(e.target.value)}
                  readOnly={!isDescEditing}
                  rows={4}
                  placeholder="Describe your company..."
                  className={`w-full rounded-xl px-4 py-2.5 text-[13px] text-[#424242]/70 leading-relaxed resize-none outline-none transition-all ${
                    isDescEditing
                      ? "bg-white border border-[#ffc000] focus:border-[#e6ac00]"
                      : "bg-[#f7f7f7] border border-transparent cursor-default"
                  }`}
                />
                {isDescEditing && (
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDescDraft(profile.company_description || "");
                        setIsDescEditing(false);
                      }}
                      className="text-[12px] font-bold text-[#424242]/50 hover:text-[#424242] px-4 py-2 rounded-full transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDescSave}
                      disabled={savingDesc}
                      className="bg-[#ffc000] text-[#424242] text-[12px] font-black px-5 py-2 rounded-full hover:bg-[#e6ac00] disabled:opacity-40 transition-all"
                    >
                      {savingDesc ? "Saving..." : "Save"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // ── Edit Mode ────────────────────────────────────────────────
            <div className="space-y-5 animate-fade-in">
              {/* Company Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#424242]/50 mb-1.5">
                  Company Name *
                </label>
                <input
                  value={form.company_name}
                  onChange={(e) => updateForm("company_name", e.target.value)}
                  placeholder="Acme Corp"
                  className="w-full border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] transition-colors"
                />
              </div>

              {/* Industry Combobox */}
              <div className="relative">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-[#424242]/50 mb-1.5">
                  Industry *
                </label>
                <input
                  value={form.industry}
                  onChange={(e) => updateForm("industry", e.target.value)}
                  onFocus={() => setShowIndustryDropdown(true)}
                  onBlur={() => setTimeout(() => setShowIndustryDropdown(false), 200)}
                  placeholder="Search and select industry..."
                  className="w-full border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] transition-colors"
                />
                {showIndustryDropdown && filteredIndustries.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-[#424242]/15 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {filteredIndustries.map((ind) => (
                      <button
                        key={ind}
                        type="button"
                        onMouseDown={() => updateForm("industry", ind)}
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
                      updateForm("state", e.target.value);
                      updateForm("city", "");
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
                    onChange={(e) => updateForm("city", e.target.value)}
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
                      onChange={(e) => updateForm(key, e.target.value)}
                      placeholder={placeholder}
                      className="w-full border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] transition-colors"
                    />
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 border border-[#424242]/15 text-[#424242] text-[13px] font-bold py-2.5 rounded-xl hover:border-[#424242]/30 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-[#ffc000] text-[#424242] text-[13px] font-black py-2.5 rounded-xl hover:bg-[#e6ac00] disabled:opacity-40 transition-all"
                >
                  {saving ? "Saving..." : "Save Changes"}
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
