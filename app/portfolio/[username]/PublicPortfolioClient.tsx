"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import AppNavbar from "@/components/layout/AppNavbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/components/ui/Toast";
import { CATEGORY_COLOURS, type EntryMedia, type EntryLink, type PortfolioEntry, type WorkExperience, type Education, type HonourAward } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface Profile {
  name: string;
  headline: string;
  location: string;
  field: string;
  bio: string;
  skills: string[];
  userId: number;
  socials?: {
    website?: string;
    linkedin?: string;
    github?: string;
  };
}

import { Lightbox } from "@/components/ui/Lightbox";

import {
  PinnedActivities,
  WorkExperienceSection,
  EducationSection,
  HonoursSection,
} from "@/components/portfolio/ResumeSections";

// ── Resume Preview Modal ─────────────────────────────────────────────────────

// Shared editable span — click to edit inline, changes saved on blur
function E({
  value,
  onChange,
  className = "",
  block = false,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  block?: boolean;
}) {
  const Tag = block ? "div" : "span";
  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => onChange(e.currentTarget.textContent ?? "")}
      className={`outline-none focus:bg-yellow-50 focus:ring-1 focus:ring-[#ffc000]/60 rounded cursor-text ${className}`}
    >
      {value}
    </Tag>
  );
}

function ResumePreviewModal({
  profile,
  entries: initialEntries,
  allSkills,
  workExperience: initialWork,
  education: initialEdu,
  honours: initialHonours,
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

  // ── local editable state ────────────────────────────────────────
  const profileSkillsArr: string[] = Array.isArray(profile.skills) ? profile.skills : [];
  const mergedSkills = [...profileSkillsArr, ...allSkills.filter(s => !profileSkillsArr.includes(s))];

  const [rd, setRd] = useState({
    name: profile.name,
    headline: profile.headline ?? "",
    location: profile.location ?? "",
    field: profile.field ?? "",
    bio: profile.bio ?? "",
    skills: mergedSkills,
    work: initialWork.map(w => ({ ...w })),
    edu: initialEdu.map(e => ({ ...e })),
    honours: initialHonours.map(h => ({ ...h })),
    entries: initialEntries.map(e => ({ ...e })),
  });
  const [skillInput, setSkillInput] = useState("");

  const upd = (key: keyof typeof rd, val: unknown) =>
    setRd(prev => ({ ...prev, [key]: val }));
  const updWork = (i: number, key: string, val: string) =>
    setRd(prev => { const w = [...prev.work]; (w[i] as any)[key] = val; return { ...prev, work: w }; });
  const updEdu = (i: number, key: string, val: string) =>
    setRd(prev => { const e = [...prev.edu]; (e[i] as any)[key] = val; return { ...prev, edu: e }; });
  const updHonour = (i: number, key: string, val: string) =>
    setRd(prev => { const h = [...prev.honours]; (h[i] as any)[key] = val; return { ...prev, honours: h }; });
  const updEntry = (i: number, val: string) =>
    setRd(prev => { const e = [...prev.entries]; e[i] = { ...e[i], polished_entry: val }; return { ...prev, entries: e }; });

  const addSkill = () => {
    const t = skillInput.trim();
    if (!t || rd.skills.includes(t)) { setSkillInput(""); return; }
    upd("skills", [...rd.skills, t]);
    setSkillInput("");
  };
  const removeSkill = (s: string) => upd("skills", rd.skills.filter(x => x !== s));

  // ── PDF generation (uses rd state) ─────────────────────────────
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
    const workHtml = rd.work.map(w => {
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

    const eduHtml = rd.edu.map(e => `
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px;">
        <div>
          <strong style="font-size:12.5px;">${esc(e.institution)}</strong>
          <div style="font-size:11.5px;font-style:italic;color:#555;">${esc(e.degree)}</div>
        </div>
        <span style="font-size:10.5px;color:#555;flex-shrink:0;margin-left:8px;">${dr(e.start_date, e.end_date)}</span>
      </div>`).join("");

    const honoursHtml = rd.honours.map(h => `
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;">
        <div>
          <strong style="font-size:12px;">${esc(h.title)}</strong>
          ${h.issuer ? `<span style="font-size:11.5px;color:#555;"> – ${esc(h.issuer)}</span>` : ""}
        </div>
        ${h.award_date ? `<span style="font-size:10.5px;color:#555;flex-shrink:0;margin-left:8px;">${fmt(h.award_date)}</span>` : ""}
      </div>`).join("");

    const entriesHtml = rd.entries.map(entry => `
      <div style="margin-bottom:8px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;">
          <strong style="font-size:11.5px;text-transform:uppercase;letter-spacing:0.05em;color:#444;">${esc(entry.category)}</strong>
          <span style="font-size:10.5px;color:#666;flex-shrink:0;margin-left:8px;">${esc(formatDate(entry.entry_date))}</span>
        </div>
        <p style="font-size:11.5px;color:#333;margin:2px 0 0 0;line-height:1.5;">${esc(entry.polished_entry)}</p>
        ${entry.skills.length > 0 ? `<p style="font-size:10.5px;color:#666;margin:2px 0 0 0;"><em>Skills:</em> ${esc(entry.skills.join(", "))}</p>` : ""}
      </div>`).join("");

    const contactParts = [rd.location, rd.field, rd.headline].filter(Boolean).map(esc);
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
<title>${esc(rd.name)} – Resume</title>
<style>* { box-sizing:border-box;margin:0;padding:0; } body { font-family:Arial,Helvetica,sans-serif;font-size:12.5px;color:#111;padding:36px 48px;line-height:1.45; } @media print { body { padding:24px 36px; } }</style>
</head><body>
<div style="text-align:center;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:14px;">
  <h1 style="font-size:24px;font-weight:900;text-transform:uppercase;letter-spacing:-0.02em;">${esc(rd.name)}</h1>
  <div style="font-size:11px;color:#555;margin-top:4px;">${contactParts.join(" &bull; ")}</div>
</div>
${rd.bio ? `<div style="margin-bottom:14px;">${sub("Summary")}<p style="font-size:11.5px;color:#444;line-height:1.55;">${esc(rd.bio)}</p></div>` : ""}
${rd.work.length > 0 ? `<div style="margin-bottom:14px;">${sub("Work Experience")}${workHtml}</div>` : ""}
${rd.edu.length > 0 ? `<div style="margin-bottom:14px;">${sub("Education")}${eduHtml}</div>` : ""}
${rd.skills.length > 0 ? `<div style="margin-bottom:14px;">${sub("Skills")}<p style="font-size:11.5px;color:#333;">${rd.skills.map(esc).join(" &bull; ")}</p></div>` : ""}
${rd.honours.length > 0 ? `<div style="margin-bottom:14px;">${sub("Honours &amp; Awards")}${honoursHtml}</div>` : ""}
${rd.entries.length > 0 ? `<div>${sub("Projects &amp; Activities")}${entriesHtml}</div>` : ""}
</body></html>`;

    const win = window.open("", "_blank", "width=860,height=1100");
    if (!win) { alert("Please allow pop-ups to download the resume PDF."); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 flex items-start justify-center overflow-y-auto py-8 px-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Modal shell */}
        <div className="bg-white w-full max-w-[720px] shadow-2xl rounded-sm relative">

          {/* Toolbar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50 rounded-t-sm">
            <span className="text-[13px] font-bold text-gray-600">Resume Preview <span className="text-[11px] font-normal text-gray-400">— click any text to edit</span></span>
            <div className="flex items-center gap-2">
              <button onClick={handlePrint} className="flex items-center gap-1.5 bg-[#ffc000] text-[#424242] text-[12px] font-bold px-4 py-1.5 rounded-full hover:bg-[#e3ab00] transition-all cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download PDF
              </button>
              <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-700 text-[20px] leading-none transition-colors px-1">×</button>
            </div>
          </div>

          {/* ── RESUME BODY ── */}
          <div className="px-10 py-8 font-[Arial,Helvetica,sans-serif] text-[#111] text-[13px] leading-[1.45]">

            {/* Header */}
            <div className="text-center border-b-2 border-[#111] pb-3 mb-4">
              <h1 className="text-[26px] font-black tracking-tight uppercase">
                <E value={rd.name} onChange={v => upd("name", v)} />
              </h1>
              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 mt-1 text-[11.5px] text-gray-600">
                <E value={rd.location} onChange={v => upd("location", v)} className="text-gray-600" />
                {rd.location && (rd.field || rd.headline) && <span className="text-gray-400 select-none">•</span>}
                <E value={rd.field} onChange={v => upd("field", v)} className="text-gray-600" />
                {rd.field && rd.headline && <span className="text-gray-400 select-none">•</span>}
                <E value={rd.headline} onChange={v => upd("headline", v)} className="text-gray-600" />
              </div>
            </div>

            {/* Summary */}
            <div className="mb-4">
              <h2 className="text-[11px] font-black uppercase tracking-[0.12em] border-b border-[#111] mb-1.5">Summary</h2>
              <E value={rd.bio} onChange={v => upd("bio", v)} block className="text-[12px] leading-relaxed text-gray-700 min-h-[1em]" />
            </div>

            {/* Work Experience */}
            {rd.work.length > 0 && (
              <div className="mb-4">
                <h2 className="text-[11px] font-black uppercase tracking-[0.12em] border-b border-[#111] mb-2">Work Experience</h2>
                <div className="space-y-3">
                  {rd.work.map((w, i) => (
                    <div key={w.id}>
                      <div className="flex justify-between items-baseline">
                        <E value={w.title} onChange={v => updWork(i, "title", v)} className="font-black text-[13px]" />
                        <span className="text-[11px] text-gray-500 flex-shrink-0 ml-2">{dr(w.start_date, w.end_date)}</span>
                      </div>
                      <E value={w.company} onChange={v => updWork(i, "company", v)} className="text-[12px] font-bold text-gray-600 italic" />
                      <E value={w.description ?? ""} onChange={v => updWork(i, "description", v)} block className="text-[12px] text-gray-700 mt-1 leading-relaxed min-h-[1em] whitespace-pre-wrap" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {rd.edu.length > 0 && (
              <div className="mb-4">
                <h2 className="text-[11px] font-black uppercase tracking-[0.12em] border-b border-[#111] mb-2">Education</h2>
                <div className="space-y-2">
                  {rd.edu.map((e, i) => (
                    <div key={e.id} className="flex justify-between items-baseline">
                      <div>
                        <E value={e.institution} onChange={v => updEdu(i, "institution", v)} className="font-black text-[13px]" />
                        <E value={e.degree} onChange={v => updEdu(i, "degree", v)} block className="text-[12px] text-gray-600 italic" />
                      </div>
                      <span className="text-[11px] text-gray-500 flex-shrink-0 ml-2">{dr(e.start_date, e.end_date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Skills */}
            <div className="mb-4">
              <h2 className="text-[11px] font-black uppercase tracking-[0.12em] border-b border-[#111] mb-2">Skills</h2>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {rd.skills.map(s => (
                  <span key={s} className="flex items-center gap-1 bg-gray-100 text-gray-700 text-[11px] font-bold px-2.5 py-1 rounded-full">
                    {s}
                    <button onClick={() => removeSkill(s)} className="text-gray-400 hover:text-red-500 text-[10px] leading-none cursor-pointer ml-0.5" aria-label={`Remove ${s}`}>✕</button>
                  </span>
                ))}
                <form onSubmit={e => { e.preventDefault(); addSkill(); }} className="flex items-center gap-1">
                  <input
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    placeholder="Add…"
                    className="text-[11px] border border-gray-300 rounded-full px-2.5 py-1 w-20 outline-none focus:border-[#ffc000]"
                  />
                  <button type="submit" disabled={!skillInput.trim()} className="w-5 h-5 rounded-full bg-gray-200 hover:bg-[#ffc000] text-gray-600 text-[12px] font-black leading-none flex items-center justify-center disabled:opacity-30 cursor-pointer transition-all">+</button>
                </form>
              </div>
            </div>

            {/* Honours & Awards */}
            {rd.honours.length > 0 && (
              <div className="mb-4">
                <h2 className="text-[11px] font-black uppercase tracking-[0.12em] border-b border-[#111] mb-2">Honours &amp; Awards</h2>
                <div className="space-y-1.5">
                  {rd.honours.map((h, i) => (
                    <div key={h.id} className="flex justify-between items-baseline">
                      <div>
                        <E value={h.title} onChange={v => updHonour(i, "title", v)} className="font-black text-[12.5px]" />
                        {h.issuer !== undefined && (
                          <><span className="text-gray-500 text-[12px]"> – </span><E value={h.issuer} onChange={v => updHonour(i, "issuer", v)} className="text-[12px] text-gray-600" /></>
                        )}
                      </div>
                      {h.award_date && <span className="text-[11px] text-gray-500 flex-shrink-0 ml-2">{fmt(h.award_date)}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects & Activities */}
            {rd.entries.length > 0 && (
              <div>
                <h2 className="text-[11px] font-black uppercase tracking-[0.12em] border-b border-[#111] mb-2">Projects &amp; Activities</h2>
                <div className="space-y-2.5">
                  {rd.entries.map((entry, i) => (
                    <div key={entry.id}>
                      <div className="flex justify-between items-baseline">
                        <span className="font-black text-[12px] uppercase tracking-wide text-gray-700">{entry.category}</span>
                        <span className="text-[11px] text-gray-500 flex-shrink-0 ml-2">{formatDate(entry.entry_date)}</span>
                      </div>
                      <E value={entry.polished_entry} onChange={v => updEntry(i, v)} block className="text-[12px] text-gray-700 leading-relaxed mt-0.5 min-h-[1em] whitespace-pre-wrap" />
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

export default function PublicPortfolioClient({
  username,
  profile,
  entries,
  allSkills,
  workExperience: initialWorkExperience,
  education: initialEducation,
  honours: initialHonours,
}: {
  username: string;
  profile: Profile;
  entries: PortfolioEntry[];
  allSkills: string[];
  workExperience: WorkExperience[];
  education: Education[];
  honours: HonourAward[];
}) {
  const user = useAuthStore((s) => s.user);
  const { showToast } = useToast();
  const [bio, setBio] = useState(profile.bio);
  const [generatingBio, setGeneratingBio] = useState(false);

  // Local state for the three new sections (so ADD shows immediately without a page reload)
  const [workExpItems, setWorkExpItems] = useState<WorkExperience[]>(initialWorkExperience);
  const [educationItems, setEducationItems] = useState<Education[]>(initialEducation);
  const [honoursItems, setHonoursItems] = useState<HonourAward[]>(initialHonours);

  const [showResumePreview, setShowResumePreview] = useState(false);

  // Skills Modal State
  const [showSkillsModal, setShowSkillsModal] = useState(false);
  const [skillsForm, setSkillsForm] = useState<string[]>(profile.skills);
  const [skillInput, setSkillInput] = useState("");
  const [savingSkills, setSavingSkills] = useState(false);

  const saveSkills = async () => {
    setSavingSkills(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          skills: skillsForm,
        }),
      });
      if (!res.ok) throw new Error();
      showToast("Skills updated ✓", "success");
      window.location.reload();
    } catch {
      showToast("Failed to save skills.", "error");
    } finally {
      setSavingSkills(false);
    }
  };

  // Lightbox
  const [lightbox, setLightbox] = useState<{ media: EntryMedia[]; startIndex: number } | null>(null);

  const openLightbox = (media: EntryMedia[], startIndex: number) =>
    setLightbox({ media, startIndex });

  // Split entries into pinned (belong under a section) vs. standalone
  const pinnedEntries = entries.filter((e) => e.pinned_type && e.pinned_id);
  const unpinnedEntries = entries.filter((e) => !e.pinned_type || !e.pinned_id);

  const isOwner = user?.username === username;

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast("Portfolio link copied!", "success");
  };

  const openResumePreview = () => setShowResumePreview(true);

  const regenerateBio = async () => {
    setGeneratingBio(true);
    try {
      const res = await fetch("/api/ai/generate-bio", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.bio) {
        setBio(data.bio);
        showToast("AI bio regenerated ✓", "success");
      }
    } catch {
      showToast("Bio generation failed. Try again.", "error");
    } finally {
      setGeneratingBio(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] resume-root">
      <AppNavbar />

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-8 animate-fade-in">
        {/* Profile header */}
        <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-7 resume-profile-card">
          <div className="flex gap-5 items-start">
            <div
              className="w-20 h-20 flex-shrink-0 rounded-2xl bg-[#424242] flex items-center justify-center text-white text-[28px] font-black resume-avatar"
              aria-hidden="true"
            >
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-[22px] font-black text-[#424242] leading-tight">{profile.name}</h1>
                  {profile.headline && (
                    <p className="text-[13px] font-semibold text-[#424242]/60 mt-1 leading-snug">{profile.headline}</p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-3">
                    {profile.location && (
                      <span className="text-[11px] text-[#424242]/50 flex items-center gap-1">
                        <span aria-hidden="true">📍</span> {profile.location}
                      </span>
                    )}
                    {profile.field && (
                      <span className="text-[11px] text-[#424242]/50 flex items-center gap-1">
                        <span aria-hidden="true">💼</span> {profile.field}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 no-print">
                  {isOwner && (
                    <Link
                      href="/profile/edit"
                      className="flex-shrink-0 text-[12px] font-bold text-[#424242]/70 bg-white border border-[#424242]/15 px-4 py-2 rounded-full hover:border-[#424242]/30 hover:bg-[#f7f7f7] transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      ✏️ Edit profile
                    </Link>
                  )}
                  <button
                    onClick={copyUrl}
                    className="flex-shrink-0 text-[12px] font-bold text-[#424242]/50 border border-[#424242]/15 px-4 py-2 rounded-full hover:border-[#424242]/30 transition-all flex items-center gap-1.5"
                  >
                    <span aria-hidden="true">🔗</span> Copy link
                  </button>
                  <button
                    onClick={openResumePreview}
                    className="flex-shrink-0 text-[12px] font-bold text-[#424242] bg-[#ffc000] px-4 py-2 rounded-full hover:bg-[#e3ab00] cursor-pointer active:scale-95 transition-all flex items-center gap-1.5 shadow-sm"
                    title="Preview and download resume as PDF"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    Preview PDF
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Social Badges */}
          {profile.socials && (profile.socials.website || profile.socials.linkedin || profile.socials.github) && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#424242]/8">
              {profile.socials.website && (
                <a
                  href={profile.socials.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#424242]/75 hover:text-[#424242] text-[11px] font-semibold flex items-center gap-1 bg-[#424242]/5 hover:bg-[#424242]/10 px-3 py-1.5 rounded-full transition-all"
                >
                  <span>🔗</span> Website
                </a>
              )}
              {profile.socials.linkedin && (
                <a
                  href={profile.socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#424242]/75 hover:text-[#424242] text-[11px] font-semibold flex items-center gap-1 bg-[#424242]/5 hover:bg-[#424242]/10 px-3 py-1.5 rounded-full transition-all"
                >
                  <span>💼</span> LinkedIn
                </a>
              )}
              {profile.socials.github && (
                <a
                  href={profile.socials.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#424242]/75 hover:text-[#424242] text-[11px] font-semibold flex items-center gap-1 bg-[#424242]/5 hover:bg-[#424242]/10 px-3 py-1.5 rounded-full transition-all"
                >
                  <span>🐙</span> GitHub
                </a>
              )}
            </div>
          )}

          {/* Bio */}
          <div className="mt-4 pt-4 border-t border-[#424242]/8">
            {bio ? (
              <p className="text-[13px] text-[#424242]/70 leading-relaxed italic">{bio}</p>
            ) : (
              <p className="text-[13px] text-[#424242]/30 italic">No bio yet.</p>
            )}
            {isOwner && (
              <button
                onClick={regenerateBio}
                disabled={generatingBio || entries.length === 0}
                className="mt-3 text-[11px] font-bold text-[#b38600] hover:underline disabled:opacity-40 flex items-center gap-1.5"
              >
                {generatingBio ? (
                  <>
                    <span className="w-3 h-3 border border-[#ffc000]/30 border-t-[#ffc000] rounded-full animate-spin" aria-hidden="true" />
                    Generating…
                  </>
                ) : (
                  "✨ Regenerate AI bio"
                )}
              </button>
            )}
          </div>
        </div>

        {/* Skills map */}
        {allSkills.length > 0 && (
          <section className="bg-white rounded-xl shadow-[var(--card-shadow)] p-5">
            <div className="flex items-center justify-between mb-4 border-b border-[#424242]/8 pb-2">
              <h2 className="text-[11px] font-black uppercase tracking-widest text-[#424242]/40">
                Skills
              </h2>
              {isOwner && (
                <button
                  onClick={() => setShowSkillsModal(true)}
                  className="text-[10px] font-bold text-[#b38600] hover:underline cursor-pointer"
                >
                  ✏️ Edit Profile Skills
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {allSkills.map((s) => (
                <span key={s} className="bg-[#ffc000]/15 text-[#424242] text-[11px] font-bold px-3 py-1.5 rounded-full resume-skill-pill">
                  {s}
                </span>
              ))}
            </div>
            
            {isOwner && (
              <div className="pt-3 border-t border-[#424242]/8 flex justify-center">
                <Link
                  href="/portfolio/manage"
                  className="text-[12px] font-bold text-[#424242]/70 hover:text-[#424242] bg-[#f7f7f7] hover:bg-[#ffc000]/20 px-6 py-2 rounded-full transition-all border border-[#424242]/10 flex items-center gap-2"
                >
                  ⚙️ Manage Portfolio Entries
                </Link>
              </div>
            )}
          </section>
        )}

        {/* Work Experience */}
        <WorkExperienceSection
          items={workExpItems}
          isOwner={isOwner}
          onAdd={(item) => setWorkExpItems((prev) => [item, ...prev])}
          onEdit={(updated) => setWorkExpItems((prev) => prev.map((i) => i.id === updated.id ? updated : i))}
          onDelete={(id) => setWorkExpItems((prev) => prev.filter((i) => i.id !== id))}
          pinnedEntries={pinnedEntries}
          onOpenLightbox={openLightbox}
        />

        {/* Education */}
        <EducationSection
          items={educationItems}
          isOwner={isOwner}
          onAdd={(item) => setEducationItems((prev) => [item, ...prev])}
          onEdit={(updated) => setEducationItems((prev) => prev.map((i) => i.id === updated.id ? updated : i))}
          onDelete={(id) => setEducationItems((prev) => prev.filter((i) => i.id !== id))}
          pinnedEntries={pinnedEntries}
          onOpenLightbox={openLightbox}
        />

        {/* Honours & Awards */}
        <HonoursSection
          items={honoursItems}
          isOwner={isOwner}
          onAdd={(item) => setHonoursItems((prev) => [item, ...prev])}
          onEdit={(updated) => setHonoursItems((prev) => prev.map((i) => i.id === updated.id ? updated : i))}
          onDelete={(id) => setHonoursItems((prev) => prev.filter((i) => i.id !== id))}
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
                <div
                  key={entry.id}
                  className="bg-white rounded-xl shadow-[var(--card-shadow)] p-5 resume-entry-card"
                >
                  {/* Category + Date */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full resume-category-badge ${CATEGORY_COLOURS[entry.category] ?? CATEGORY_COLOURS.Other}`}>
                      {entry.category}
                    </span>
                    <span className="text-[10px] text-[#424242]/40">{formatDate(entry.entry_date)}</span>
                  </div>

                  {/* Narrative */}
                  <p className="text-[13px] text-[#424242]/75 leading-relaxed">{entry.polished_entry}</p>

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
                        <span key={s} className="bg-[#424242]/8 text-[#424242]/55 text-[10px] font-bold px-2.5 py-1 rounded-full resume-skill-pill">
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

      {showResumePreview && (
        <ResumePreviewModal
          profile={profile}
          entries={unpinnedEntries}
          allSkills={allSkills}
          workExperience={workExpItems}
          education={educationItems}
          honours={honoursItems}
          onClose={() => setShowResumePreview(false)}
        />
      )}

      {lightbox && (
        <Lightbox
          media={lightbox.media}
          startIndex={lightbox.startIndex}
          onClose={() => setLightbox(null)}
        />
      )}

      {showSkillsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-[#424242]/10 flex justify-between items-center bg-[#f7f7f7]">
              <h2 className="text-[15px] font-black text-[#424242]">Manage Profile Skills</h2>
              <button
                onClick={() => setShowSkillsModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 text-[#424242]/50 hover:text-[#424242] transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="flex flex-wrap gap-2 mb-6">
                {skillsForm.map(s => (
                  <span key={s} className="bg-[#ffc000]/20 text-[#424242] text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
                    {s}
                    <button
                      onClick={() => setSkillsForm(prev => prev.filter(x => x !== s))}
                      className="text-[#424242]/40 hover:text-red-500 font-bold ml-1 leading-none transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                {skillsForm.length === 0 && (
                  <span className="text-[12px] text-[#424242]/40 italic">No skills added yet.</span>
                )}
              </div>
              
              <form 
                onSubmit={e => {
                  e.preventDefault();
                  const val = skillInput.trim();
                  if (val && !skillsForm.includes(val)) {
                    setSkillsForm(prev => [...prev, val]);
                    setSkillInput("");
                  }
                }}
                className="flex items-center gap-2"
              >
                <input
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  placeholder="e.g. React, Python, Project Management"
                  className="flex-1 border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] transition-colors bg-white"
                />
                <button
                  type="submit"
                  disabled={!skillInput.trim()}
                  className="bg-[#424242] text-white px-5 py-2.5 rounded-xl text-[13px] font-black disabled:opacity-50 transition-all hover:bg-[#333] cursor-pointer"
                >
                  Add
                </button>
              </form>
            </div>

            <div className="p-5 border-t border-[#424242]/10 bg-[#f7f7f7] flex justify-end gap-3">
              <button
                onClick={() => {
                  setSkillsForm(profile.skills);
                  setShowSkillsModal(false);
                }}
                className="px-5 py-2.5 text-[13px] font-bold text-[#424242] hover:bg-black/5 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={saveSkills}
                disabled={savingSkills}
                className="bg-[#ffc000] text-[#424242] px-5 py-2.5 rounded-xl text-[13px] font-black disabled:opacity-50 hover:bg-[#e6ac00] transition-all cursor-pointer"
              >
                {savingSkills ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
