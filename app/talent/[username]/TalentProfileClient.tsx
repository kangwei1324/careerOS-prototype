"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import AppNavbar from "@/components/layout/AppNavbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/components/ui/Toast";
import { CATEGORY_COLOURS, type EntryMedia, type PortfolioEntry, type WorkExperience, type Education, type HonourAward } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Lightbox } from "@/components/ui/Lightbox";
import {
  WorkExperienceSection,
  EducationSection,
  HonoursSection,
} from "@/components/portfolio/ResumeSections";

interface Profile {
  name: string;
  headline: string;
  location: string;
  field: string;
  bio: string;
  skills: string[];
  socials?: {
    website?: string;
    linkedin?: string;
    github?: string;
  };
}

// ── Resume Preview Modal (Read Only) ────────────────────────────────────────
function ResumePreviewModal({
  profile,
  entries,
  allSkills,
  workExperience,
  education,
  honours,
  onClose,
}: {
  profile: Profile;
  entries: PortfolioEntry[];
  allSkills: string[];
  workExperience: WorkExperience[];
  education: Education[];
  honours: HonourAward[];
  onClose: () => void;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const profileSkillsArr: string[] = Array.isArray(profile.skills) ? profile.skills : [];
  const mergedSkills = [...profileSkillsArr, ...allSkills.filter(s => !profileSkillsArr.includes(s))];

  // ── PDF generation ─────────────────────────────
  const fmt = (d: string) => {
    const [y, m] = d.split("-");
    if (!m) return y;
    return new Date(Number(y), Number(m) - 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };
  const dr = (start: string, end: string | null) => `${fmt(start)} – ${end ? fmt(end) : "Present"}`;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const sub = (t: string) =>
    `<h2 style="font-size:10.5px;font-weight:900;text-transform:uppercase;letter-spacing:0.12em;border-bottom:1px solid #111;margin:0 0 6px 0;padding-bottom:2px;">${esc(t)}</h2>`;

  const handlePrint = () => {
    const workHtml = workExperience.map(w => {
      const bullets = w.description
        ? w.description.split(/\n|\u2022/).map(l => l.trim()).filter(Boolean)
            .map(l => `<li style="font-size:11.5px;color:#333;margin-bottom:2px;">${esc(l)}</li>`).join("")
        : "";
      return `<div style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <strong style="font-size:12.5px;">${esc(w.title)}</strong>
          <span style="font-size:10.5px;color:#555;flex-shrink:0;margin-left:8px;">${dr(w.start_date, w.end_date)}</span>
        </div>
        <div style="font-size:11.5px;font-style:italic;color:#555;">${esc(w.company)}</div>
        ${bullets ? `<ul style="margin:4px 0 0 12px;padding:0;">${bullets}</ul>` : ""}
      </div>`;
    }).join("");

    const eduHtml = education.map(e => `
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">
        <div>
          <strong style="font-size:12.5px;">${esc(e.institution)}</strong>
          <div style="font-size:11.5px;font-style:italic;color:#555;">${esc(e.degree)}</div>
        </div>
        <span style="font-size:10.5px;color:#555;flex-shrink:0;margin-left:8px;">${dr(e.start_date, e.end_date)}</span>
      </div>`).join("");

    const honoursHtml = honours.map(h => `
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;">
        <div>
          <strong style="font-size:12px;">${esc(h.title)}</strong>
          ${h.issuer ? `<span style="font-size:11.5px;color:#555;"> – ${esc(h.issuer)}</span>` : ""}
        </div>
        ${h.award_date ? `<span style="font-size:10.5px;color:#555;flex-shrink:0;margin-left:8px;">${fmt(h.award_date)}</span>` : ""}
      </div>`).join("");

    const entriesHtml = entries.map(entry => `
      <div style="margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <strong style="font-size:11.5px;text-transform:uppercase;letter-spacing:0.05em;color:#444;">${esc(entry.category)}</strong>
          <span style="font-size:10.5px;color:#666;flex-shrink:0;margin-left:8px;">${esc(formatDate(entry.entry_date))}</span>
        </div>
        <p style="font-size:11.5px;color:#333;margin:2px 0 0 0;line-height:1.5;">${esc(entry.polished_entry)}</p>
        ${entry.skills.length > 0 ? `<p style="font-size:10.5px;color:#666;margin:2px 0 0 0;"><em>Skills:</em> ${esc(entry.skills.join(", "))}</p>` : ""}
      </div>`).join("");

    const contactParts = [profile.location, profile.field, profile.headline].filter(Boolean).map((s) => esc(s as string));
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>${esc(profile.name)} – CV</title>
<style>* { box-sizing:border-box;margin:0;padding:0; } body { font-family:Arial,Helvetica,sans-serif;font-size:12.5px;color:#111;padding:36px 48px;line-height:1.45; } @media print { body { padding:24px 36px; } }</style>
</head><body>
<div style="text-align:center;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:14px;">
  <h1 style="font-size:24px;font-weight:900;text-transform:uppercase;letter-spacing:-0.02em;">${esc(profile.name)}</h1>
  <div style="font-size:11px;color:#555;margin-top:4px;">${contactParts.join(" &bull; ")}</div>
</div>
${profile.bio ? `<div style="margin-bottom:14px;">${sub("Summary")}<p style="font-size:11.5px;color:#444;line-height:1.55;">${esc(profile.bio)}</p></div>` : ""}
${workExperience.length > 0 ? `<div style="margin-bottom:14px;">${sub("Work Experience")}${workHtml}</div>` : ""}
${education.length > 0 ? `<div style="margin-bottom:14px;">${sub("Education")}${eduHtml}</div>` : ""}
${mergedSkills.length > 0 ? `<div style="margin-bottom:14px;">${sub("Skills")}<p style="font-size:11.5px;color:#333;">${mergedSkills.map(esc).join(" &bull; ")}</p></div>` : ""}
${honours.length > 0 ? `<div style="margin-bottom:14px;">${sub("Honours &amp; Awards")}${honoursHtml}</div>` : ""}
${entries.length > 0 ? `<div>${sub("Projects &amp; Activities")}${entriesHtml}</div>` : ""}
</body></html>`;

    const win = window.open("", "_blank", "width=860,height=1100");
    if (!win) { alert("Please allow pop-ups to download the CV PDF."); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[100] bg-black/60 flex items-start justify-center overflow-y-auto py-8 px-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="bg-white w-full max-w-[720px] shadow-2xl rounded-sm relative">
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50 rounded-t-sm">
            <span className="text-[13px] font-bold text-gray-600">CV Viewer <span className="text-[11px] font-normal text-gray-400">— read only</span></span>
            <div className="flex items-center gap-2">
              <button onClick={handlePrint} className="flex items-center gap-1.5 bg-[#ffc000] text-[#424242] text-[12px] font-bold px-4 py-1.5 rounded-full hover:bg-[#e3ab00] transition-all cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download PDF
              </button>
              <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-700 text-[20px] leading-none transition-colors px-1">×</button>
            </div>
          </div>

          <div className="px-10 py-8 font-[Arial,Helvetica,sans-serif] text-[#111] text-[13px] leading-[1.45]">
            <div className="text-center border-b-2 border-[#111] pb-3 mb-4">
              <h1 className="text-[26px] font-black tracking-tight uppercase">
                {profile.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 mt-1 text-[11.5px] text-gray-600">
                {profile.location && <span className="text-gray-600">{profile.location}</span>}
                {profile.location && (profile.field || profile.headline) && <span className="text-gray-400 select-none">•</span>}
                {profile.field && <span className="text-gray-600">{profile.field}</span>}
                {profile.field && profile.headline && <span className="text-gray-400 select-none">•</span>}
                {profile.headline && <span className="text-gray-600">{profile.headline}</span>}
              </div>
            </div>

            {profile.bio && (
              <div className="mb-4">
                <h2 className="text-[11px] font-black uppercase tracking-[0.12em] border-b border-[#111] mb-1.5">Summary</h2>
                <div className="text-[12px] leading-relaxed text-gray-700 min-h-[1em]">{profile.bio}</div>
              </div>
            )}

            {workExperience.length > 0 && (
              <div className="mb-4">
                <h2 className="text-[11px] font-black uppercase tracking-[0.12em] border-b border-[#111] mb-2">Work Experience</h2>
                <div className="space-y-3">
                  {workExperience.map((w) => (
                    <div key={w.id}>
                      <div className="flex justify-between items-baseline">
                        <span className="font-black text-[13px]">{w.title}</span>
                        <span className="text-[11px] text-gray-500 flex-shrink-0 ml-2">{dr(w.start_date, w.end_date)}</span>
                      </div>
                      <div className="text-[12px] font-bold text-gray-600 italic">{w.company}</div>
                      {w.description && <div className="text-[12px] text-gray-700 mt-1 leading-relaxed min-h-[1em] whitespace-pre-wrap">{w.description}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {education.length > 0 && (
              <div className="mb-4">
                <h2 className="text-[11px] font-black uppercase tracking-[0.12em] border-b border-[#111] mb-2">Education</h2>
                <div className="space-y-2">
                  {education.map((e) => (
                    <div key={e.id} className="flex justify-between items-baseline">
                      <div>
                        <div className="font-black text-[13px]">{e.institution}</div>
                        <div className="text-[12px] text-gray-600 italic">{e.degree}</div>
                      </div>
                      <span className="text-[11px] text-gray-500 flex-shrink-0 ml-2">{dr(e.start_date, e.end_date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mergedSkills.length > 0 && (
              <div className="mb-4">
                <h2 className="text-[11px] font-black uppercase tracking-[0.12em] border-b border-[#111] mb-2">Skills</h2>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {mergedSkills.map(s => (
                    <span key={s} className="flex items-center gap-1 bg-gray-100 text-gray-700 text-[11px] font-bold px-2.5 py-1 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {honours.length > 0 && (
              <div className="mb-4">
                <h2 className="text-[11px] font-black uppercase tracking-[0.12em] border-b border-[#111] mb-2">Honours &amp; Awards</h2>
                <div className="space-y-1.5">
                  {honours.map((h) => (
                    <div key={h.id} className="flex justify-between items-baseline">
                      <div>
                        <span className="font-black text-[12.5px]">{h.title}</span>
                        {h.issuer && (
                          <><span className="text-gray-500 text-[12px]"> – </span><span className="text-[12px] text-gray-600">{h.issuer}</span></>
                        )}
                      </div>
                      {h.award_date && <span className="text-[11px] text-gray-500 flex-shrink-0 ml-2">{fmt(h.award_date)}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {entries.length > 0 && (
              <div>
                <h2 className="text-[11px] font-black uppercase tracking-[0.12em] border-b border-[#111] mb-2">Projects &amp; Activities</h2>
                <div className="space-y-2.5">
                  {entries.map((entry) => (
                    <div key={entry.id}>
                      <div className="flex justify-between items-baseline">
                        <span className="font-black text-[12px] uppercase tracking-wide text-gray-700">{entry.category}</span>
                        <span className="text-[11px] text-gray-500 flex-shrink-0 ml-2">{formatDate(entry.entry_date)}</span>
                      </div>
                      <div className="text-[12px] text-gray-700 leading-relaxed mt-0.5 min-h-[1em] whitespace-pre-wrap">{entry.polished_entry}</div>
                      {entry.skills.length > 0 && (
                        <p className="text-[11px] text-gray-500 mt-0.5"><em>Skills:</em> {entry.skills.join(", ")}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function TalentProfileClient({
  candidateId,
  username,
  profile,
  entries,
  workExperience,
  education,
  honours,
  interestCount,
  initialInterested,
}: {
  candidateId: number;
  username: string;
  profile: Profile;
  entries: PortfolioEntry[];
  workExperience: WorkExperience[];
  education: Education[];
  honours: HonourAward[];
  interestCount: number;
  initialInterested: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const { showToast } = useToast();
  const [interested, setInterested] = useState(initialInterested);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(interestCount);

  // Offer modal state
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isConfirmingOffer, setIsConfirmingOffer] = useState(false);

  // Resume Preview state
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [offerForm, setOfferForm] = useState({
    offerType: "Interview",
    field: "",
    roleName: "",
    minSalary: "",
    maxSalary: ""
  });

  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmingOffer) {
      setIsConfirmingOffer(true);
      return;
    }

    setIsSubmittingOffer(true);
    try {
      const res = await fetch("/api/employer/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          offerType: offerForm.offerType,
          field: offerForm.field,
          roleName: offerForm.roleName,
          minSalary: offerForm.minSalary ? parseInt(offerForm.minSalary) : null,
          maxSalary: offerForm.maxSalary ? parseInt(offerForm.maxSalary) : null,
        }),
      });

      if (res.ok) {
        showToast("Offer application submitted successfully ✓", "success");
        setIsOfferModalOpen(false);
        setIsConfirmingOffer(false);
        setOfferForm({ offerType: "Interview", field: "", roleName: "", minSalary: "", maxSalary: "" });
      } else {
        throw new Error();
      }
    } catch (err) {
      showToast("Failed to submit offer. Please try again.", "error");
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  // Lightbox state
  const [lightbox, setLightbox] = useState<{ media: EntryMedia[]; startIndex: number } | null>(null);
  const openLightbox = (media: EntryMedia[], startIndex: number) => setLightbox({ media, startIndex });

  // Split entries into pinned (belong under a section) vs. standalone
  const pinnedEntries = entries.filter((e) => e.pinned_type && e.pinned_id);
  const unpinnedEntries = entries.filter((e) => !e.pinned_type || !e.pinned_id);

  const allSkills = Array.from(new Set(entries.flatMap((e) => e.skills)));

  const toggleInterest = async () => {
    if (!user || user.role !== "employer") return;
    setLoading(true);
    try {
      if (interested) {
        // Undo interest (DELETE)
        const res = await fetch("/api/interest", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateId }),
        });
        if (res.ok) {
          setCount((c) => Math.max(0, c - 1));
          setInterested(false);
          showToast("Interest removed from candidate shortlist.", "success");
        } else {
          throw new Error();
        }
      } else {
        // Express interest (POST)
        const res = await fetch("/api/interest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateId }),
        });
        const data = await res.json();
        if (data.inserted) setCount((c) => c + 1);
        setInterested(true);
        showToast("Candidate added to your shortlist ✓", "success");
      }
    } catch {
      showToast("Failed to update interest. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <AppNavbar />

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-8 animate-fade-in">
        {/* Profile Card */}
        <div className="bg-[#424242] rounded-2xl p-6 text-white shadow-xl">
          <p className="text-[#ffc000] text-[11px] font-black uppercase tracking-widest mb-4">Signal summary</p>
          <div className="flex justify-between items-start gap-4">
            <div className="flex items-start gap-5">
              <div
                className="w-16 h-16 flex-shrink-0 rounded-2xl bg-white/10 flex items-center justify-center text-[28px] font-black"
                aria-hidden="true"
              >
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-[20px] font-black leading-tight">{profile.name}</h1>
                {profile.headline && <p className="text-white/55 text-[13px] mt-1 leading-snug">{profile.headline}</p>}
                <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-white/40">
                  {profile.location && <span>📍 {profile.location}</span>}
                  {profile.field && <span>💼 {profile.field}</span>}
                </div>
              </div>
            </div>

            {user?.role === "employer" && (
              <button
                onClick={() => setShowResumePreview(true)}
                className="bg-white/10 hover:bg-white/20 text-white text-[12px] font-bold px-4 py-2 rounded-full transition-all whitespace-nowrap flex-shrink-0 mt-1"
              >
                View CV →
              </button>
            )}
          </div>

          {/* Social Badges */}
          {profile.socials && (profile.socials.website || profile.socials.linkedin || profile.socials.github) && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
              {profile.socials.website && (
                <a
                  href={profile.socials.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/75 hover:text-white text-[11px] font-semibold flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-all"
                >
                  <span>🔗</span> Website
                </a>
              )}
              {profile.socials.linkedin && (
                <a
                  href={profile.socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/75 hover:text-white text-[11px] font-semibold flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-all"
                >
                  <span>💼</span> LinkedIn
                </a>
              )}
              {profile.socials.github && (
                <a
                  href={profile.socials.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/75 hover:text-white text-[11px] font-semibold flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-all"
                >
                  <span>🐙</span> GitHub
                </a>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
            {[
              { label: "Portfolio entries", value: entries.length },
              { label: "Skills extracted", value: allSkills.length },
              { label: "Employer signals", value: count },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/8 rounded-xl p-3 text-center">
                <div className="text-[22px] font-black">{value}</div>
                <div className="text-[10px] text-white/40 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Key skills */}
          {profile.skills.length > 0 && (
            <div className="mt-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Key skills</p>
              <div className="flex flex-wrap gap-2">
                {profile.skills.slice(0, 6).map((s) => (
                  <span key={s} className="bg-[#ffc000]/20 text-[#ffc000] text-[11px] font-bold px-3 py-1 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Shortlist Toggle Button */}
          {user?.role === "employer" && (
            <button
              onClick={toggleInterest}
              disabled={loading}
              className={`w-full mt-5 text-[14px] font-black py-3 rounded-xl transition-all active:scale-95 ${interested
                  ? "bg-white/20 hover:bg-white/30 text-white"
                  : "bg-[#ffc000] text-[#424242] hover:bg-[#e6ac00]"
                }`}
            >
              {interested ? "⭐ Shortlisted (Click to remove)" : loading ? "Updating..." : "Shortlist candidate →"}
            </button>
          )}

          {/* Offer Application Button */}
          {user?.role === "employer" && (
            <button
              onClick={() => setIsOfferModalOpen(true)}
              className="w-full mt-3 text-[14px] font-black py-3 rounded-xl transition-all active:scale-95 bg-[#ffc000] text-[#424242] hover:bg-[#e6ac00]"
            >
              Offer application →
            </button>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="bg-white rounded-xl shadow-[var(--card-shadow)] p-5">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-[#424242]/40 mb-3 border-b border-[#424242]/8 pb-2">
              About
            </h2>
            <p className="text-[13px] text-[#424242]/70 leading-relaxed italic">{profile.bio}</p>
          </div>
        )}

        {/* Skills from entries */}
        {allSkills.length > 0 && (
          <div className="bg-white rounded-xl shadow-[var(--card-shadow)] p-5">
            <h2 className="text-[11px] font-black uppercase tracking-widest text-[#424242]/40 mb-4 border-b border-[#424242]/8 pb-2">
              Skills from portfolio
            </h2>
            <div className="flex flex-wrap gap-2">
              {allSkills.map((s) => (
                <span key={s} className="bg-[#ffc000]/15 text-[#424242] text-[11px] font-bold px-3 py-1.5 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Work Experience */}
        <WorkExperienceSection
          items={workExperience}
          isOwner={false}
          onAdd={() => { }}
          onEdit={() => { }}
          onDelete={() => { }}
          pinnedEntries={pinnedEntries}
          onOpenLightbox={openLightbox}
        />

        {/* Education */}
        <EducationSection
          items={education}
          isOwner={false}
          onAdd={() => { }}
          onEdit={() => { }}
          onDelete={() => { }}
          pinnedEntries={pinnedEntries}
          onOpenLightbox={openLightbox}
        />

        {/* Honours & Awards */}
        <HonoursSection
          items={honours}
          isOwner={false}
          onAdd={() => { }}
          onEdit={() => { }}
          onDelete={() => { }}
          pinnedEntries={pinnedEntries}
          onOpenLightbox={openLightbox}
        />

        {/* Activity Log — unpinned entries only */}
        {unpinnedEntries.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4 border-b border-[#424242]/10 pb-2">
              <h2 className="text-[15px] font-black text-[#424242]">Activity Log</h2>
              <span className="text-[12px] text-[#424242]/40">{unpinnedEntries.length} {unpinnedEntries.length === 1 ? "entry" : "entries"}</span>
            </div>

            <div className="space-y-4">
              {unpinnedEntries.map((entry) => (
                <div key={entry.id} className="bg-white rounded-xl shadow-[var(--card-shadow)] p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${CATEGORY_COLOURS[entry.category] ?? CATEGORY_COLOURS.Other}`}>
                      {entry.category}
                    </span>
                    <span className="text-[10px] text-[#424242]/40">{formatDate(entry.entry_date)}</span>
                  </div>
                  <p className="text-[13px] text-[#424242]/70 leading-relaxed">{entry.polished_entry}</p>

                  {/* Image strip */}
                  {entry.media && entry.media.length > 0 && (
                    <div className="flex gap-2.5 mt-4 overflow-x-auto pb-1 -mx-1 px-1">
                      {entry.media.map((m, i) => (
                        <button
                          key={i}
                          onClick={() => openLightbox(entry.media, i)}
                          className="flex-shrink-0 w-40 rounded-xl overflow-hidden border border-[#424242]/10 hover:border-[#ffc000]/50 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ffc000] group"
                          aria-label={m.caption || `View image ${i + 1} fullscreen`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={m.url}
                            alt={m.caption || "proof image"}
                            className="w-40 h-28 object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                          {m.caption && (
                            <p className="text-[10px] text-[#424242]/50 px-2.5 py-1.5 truncate text-left">{m.caption}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Proof links */}
                  {entry.links && entry.links.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {entry.links.map((l, i) => (
                        <a
                          key={i}
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#424242]/60 bg-[#424242]/6 hover:bg-[#ffc000]/20 hover:text-[#424242] px-3 py-1.5 rounded-full transition-all border border-[#424242]/10"
                        >
                          🔗 {l.label}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Skills */}
                  {entry.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {entry.skills.map((s) => (
                        <span key={s} className="bg-[#424242]/8 text-[#424242]/55 text-[10px] font-bold px-2.5 py-1 rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />

      {lightbox && (
        <Lightbox
          media={lightbox.media}
          startIndex={lightbox.startIndex}
          onClose={() => setLightbox(null)}
        />
      )}

      {/* Offer Modal */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-[#424242]/10">
              <h2 className="text-[18px] font-black text-[#424242]">Offer Application</h2>
            </div>

            <div className="p-5 overflow-y-auto flex-1">
              <form id="offerForm" onSubmit={handleOfferSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#424242]/60 mb-2">Type of Offer</label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setOfferForm({ ...offerForm, offerType: "Interview" })}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-[14px] transition-all border ${offerForm.offerType === "Interview"
                          ? "bg-[#ffc000] border-[#ffc000] text-[#424242]"
                          : "bg-[#f7f7f7] border-[#424242]/10 text-[#424242]/60 hover:bg-[#424242]/5"
                        }`}
                    >
                      Interview
                    </button>
                    <button
                      type="button"
                      onClick={() => setOfferForm({ ...offerForm, offerType: "Position" })}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-[14px] transition-all border ${offerForm.offerType === "Position"
                          ? "bg-[#ffc000] border-[#ffc000] text-[#424242]"
                          : "bg-[#f7f7f7] border-[#424242]/10 text-[#424242]/60 hover:bg-[#424242]/5"
                        }`}
                    >
                      Position
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#424242]/60 mb-1">Field</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Engineering"
                    value={offerForm.field}
                    onChange={(e) => setOfferForm({ ...offerForm, field: e.target.value })}
                    className="w-full bg-[#f7f7f7] border border-[#424242]/10 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#ffc000] focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#424242]/60 mb-1">Role Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Frontend Developer"
                    value={offerForm.roleName}
                    onChange={(e) => setOfferForm({ ...offerForm, roleName: e.target.value })}
                    className="w-full bg-[#f7f7f7] border border-[#424242]/10 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#ffc000] focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-[#424242]/60 mb-1">Offering Salary Range</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      placeholder="Min"
                      value={offerForm.minSalary}
                      onChange={(e) => setOfferForm({ ...offerForm, minSalary: e.target.value })}
                      className="w-full bg-[#f7f7f7] border border-[#424242]/10 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#ffc000] focus:border-transparent transition-all"
                    />
                    <span className="text-[#424242]/40 font-bold">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={offerForm.maxSalary}
                      onChange={(e) => setOfferForm({ ...offerForm, maxSalary: e.target.value })}
                      className="w-full bg-[#f7f7f7] border border-[#424242]/10 rounded-xl px-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#ffc000] focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </form>
            </div>

            <div className="p-5 border-t border-[#424242]/10 flex flex-col gap-3">
              {isConfirmingOffer && (
                <p className="text-[#ffc000] text-[15px] font-black text-center">
                  Click &quot;Confirm Submit&quot; to send offer
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsOfferModalOpen(false);
                    setIsConfirmingOffer(false);
                  }}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-black text-[14px] rounded-xl transition-all active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="offerForm"
                  disabled={isSubmittingOffer}
                  className="flex-1 py-3 bg-[#ffc000] hover:bg-[#e6ac00] text-[#424242] font-black text-[14px] rounded-xl transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmittingOffer ? "Submitting..." : isConfirmingOffer ? "Confirm Submit" : "Submit"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showResumePreview && (
        <ResumePreviewModal
          profile={profile}
          entries={unpinnedEntries}
          allSkills={allSkills}
          workExperience={workExperience}
          education={education}
          honours={honours}
          onClose={() => setShowResumePreview(false)}
        />
      )}
    </div>
  );
}
