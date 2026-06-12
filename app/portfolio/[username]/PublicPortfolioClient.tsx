"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import AppNavbar from "@/components/layout/AppNavbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/components/ui/Toast";
import { CATEGORY_COLOURS, type PortfolioEntry, type WorkExperience, type Education, type HonourAward } from "@/lib/types";
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

// ── helpers ──────────────────────────────────────────────────────────────────

function formatDateRange(start: string, end: string | null): string {
  const fmt = (d: string) => {
    const [y, m] = d.split("-");
    if (!m) return y;
    return new Date(Number(y), Number(m) - 1).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };
  return `${fmt(start)} – ${end ? fmt(end) : "Present"}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  isOwner,
  onAdd,
}: {
  title: string;
  isOwner: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-4 border-b border-[#424242]/10 pb-2">
      <h2 className="text-[15px] font-black text-[#424242]">{title}</h2>
      {isOwner && (
        <button
          onClick={onAdd}
          className="flex items-center gap-1 text-[12px] font-black text-[#b38600] hover:text-[#e6ac00] transition-colors"
        >
          ADD ENTRY <span className="text-[16px] leading-none">+</span>
        </button>
      )}
    </div>
  );
}

function FormModal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-black text-[#424242]">{title}</h3>
          <button
            onClick={onClose}
            className="text-[#424242]/40 hover:text-[#424242] text-[20px] leading-none transition-colors"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function InputField({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[11px] font-black uppercase tracking-widest text-[#424242]/50">
        {label}{required && <span className="text-[#ffc000] ml-0.5">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="border border-[#424242]/15 rounded-lg px-3 py-2 text-[13px] text-[#424242] outline-none focus:border-[#ffc000]/60 focus:ring-2 focus:ring-[#ffc000]/10 transition-all"
      />
    </div>
  );
}

function TextAreaField({
  label,
  id,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[11px] font-black uppercase tracking-widest text-[#424242]/50">
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="border border-[#424242]/15 rounded-lg px-3 py-2 text-[13px] text-[#424242] outline-none focus:border-[#ffc000]/60 focus:ring-2 focus:ring-[#ffc000]/10 transition-all resize-none"
      />
    </div>
  );
}

function SubmitButton({ saving }: { saving: boolean }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="w-full bg-[#ffc000] text-[#424242] text-[13px] font-black py-2.5 rounded-full hover:bg-[#e6ac00] disabled:opacity-50 transition-all"
    >
      {saving ? "Saving…" : "Save Entry"}
    </button>
  );
}

// ── Work Experience ──────────────────────────────────────────────────────────

function WorkExperienceSection({
  items,
  isOwner,
  onAdd,
  onDelete,
}: {
  items: WorkExperience[];
  isOwner: boolean;
  onAdd: (item: WorkExperience) => void;
  onDelete: (id: number) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", company: "", start_date: "", end_date: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { showToast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/portfolio/work-experience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onAdd({ id: data.id, ...form, end_date: form.end_date || null });
      setForm({ title: "", company: "", start_date: "", end_date: "", description: "" });
      setShowForm(false);
      showToast("Work experience added ✓", "success");
    } catch {
      showToast("Failed to save. Try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await fetch(`/api/portfolio/work-experience/${id}`, { method: "DELETE" });
      onDelete(id);
      showToast("Entry deleted", "info");
    } catch {
      showToast("Failed to delete.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section>
      <SectionHeader title="Work Experience" isOwner={isOwner} onAdd={() => setShowForm(true)} />

      {items.length === 0 && (
        <p className="text-[12px] text-[#424242]/30 italic py-3">
          {isOwner ? "Add your first work experience." : "No work experience listed."}
        </p>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-[var(--card-shadow)] p-5 group relative">
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-black text-[#424242] leading-tight">{item.title}</p>
                <p className="text-[12px] text-[#424242]/55 mt-0.5">{item.company}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-[11px] text-[#424242]/40 text-right">
                  {formatDateRange(item.start_date, item.end_date)}
                </span>
                {isOwner && (
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="opacity-0 group-hover:opacity-100 text-[11px] text-red-400 hover:text-red-600 transition-all"
                    aria-label="Delete"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
            {item.description && (
              <p className="text-[12px] text-[#424242]/60 leading-relaxed mt-3">{item.description}</p>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <FormModal title="Add Work Experience" onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="space-y-3">
            <InputField label="Job Title" id="wx-title" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="Senior Software Engineer" required />
            <InputField label="Company" id="wx-company" value={form.company} onChange={(v) => setForm((f) => ({ ...f, company: v }))} placeholder="TalentBank" required />
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Start" id="wx-start" type="month" value={form.start_date} onChange={(v) => setForm((f) => ({ ...f, start_date: v }))} required />
              <InputField label="End (leave blank if current)" id="wx-end" type="month" value={form.end_date} onChange={(v) => setForm((f) => ({ ...f, end_date: v }))} />
            </div>
            <TextAreaField label="Description" id="wx-desc" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} placeholder="Key responsibilities and achievements…" />
            <SubmitButton saving={saving} />
          </form>
        </FormModal>
      )}
    </section>
  );
}

// ── Education ────────────────────────────────────────────────────────────────

function EducationSection({
  items,
  isOwner,
  onAdd,
  onDelete,
}: {
  items: Education[];
  isOwner: boolean;
  onAdd: (item: Education) => void;
  onDelete: (id: number) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ institution: "", degree: "", start_date: "", end_date: "" });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { showToast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/portfolio/education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onAdd({ id: data.id, ...form, end_date: form.end_date || null });
      setForm({ institution: "", degree: "", start_date: "", end_date: "" });
      setShowForm(false);
      showToast("Education added ✓", "success");
    } catch {
      showToast("Failed to save. Try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await fetch(`/api/portfolio/education/${id}`, { method: "DELETE" });
      onDelete(id);
      showToast("Entry deleted", "info");
    } catch {
      showToast("Failed to delete.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section>
      <SectionHeader title="Education" isOwner={isOwner} onAdd={() => setShowForm(true)} />

      {items.length === 0 && (
        <p className="text-[12px] text-[#424242]/30 italic py-3">
          {isOwner ? "Add your education history." : "No education listed."}
        </p>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-[var(--card-shadow)] p-5 group">
            <div className="flex gap-3 items-start">
              {/* Institution icon placeholder */}
              <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-[#424242] flex items-center justify-center text-white text-[16px]">
                🎓
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-[13px] font-black text-[#424242] leading-tight">{item.institution}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] text-[#424242]/40 text-right">
                      {formatDateRange(item.start_date, item.end_date)}
                    </span>
                    {isOwner && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="opacity-0 group-hover:opacity-100 text-[11px] text-red-400 hover:text-red-600 transition-all"
                        aria-label="Delete"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[12px] text-[#424242]/55 mt-0.5">{item.degree}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <FormModal title="Add Education" onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="space-y-3">
            <InputField label="Institution" id="edu-institution" value={form.institution} onChange={(v) => setForm((f) => ({ ...f, institution: v }))} placeholder="University of Nottingham Malaysia" required />
            <InputField label="Degree / Qualification" id="edu-degree" value={form.degree} onChange={(v) => setForm((f) => ({ ...f, degree: v }))} placeholder="BSc Computer Science with AI" required />
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Start" id="edu-start" type="month" value={form.start_date} onChange={(v) => setForm((f) => ({ ...f, start_date: v }))} required />
              <InputField label="End (leave blank if current)" id="edu-end" type="month" value={form.end_date} onChange={(v) => setForm((f) => ({ ...f, end_date: v }))} />
            </div>
            <SubmitButton saving={saving} />
          </form>
        </FormModal>
      )}
    </section>
  );
}

// ── Honours & Awards ─────────────────────────────────────────────────────────

function HonoursSection({
  items,
  isOwner,
  onAdd,
  onDelete,
}: {
  items: HonourAward[];
  isOwner: boolean;
  onAdd: (item: HonourAward) => void;
  onDelete: (id: number) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", issuer: "", award_date: "" });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { showToast } = useToast();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/portfolio/honours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      onAdd({ id: data.id, ...form });
      setForm({ title: "", issuer: "", award_date: "" });
      setShowForm(false);
      showToast("Award added ✓", "success");
    } catch {
      showToast("Failed to save. Try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await fetch(`/api/portfolio/honours/${id}`, { method: "DELETE" });
      onDelete(id);
      showToast("Entry deleted", "info");
    } catch {
      showToast("Failed to delete.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section>
      <SectionHeader title="Honours & Awards" isOwner={isOwner} onAdd={() => setShowForm(true)} />

      {items.length === 0 && (
        <p className="text-[12px] text-[#424242]/30 italic py-3">
          {isOwner ? "Add your honours and awards." : "No awards listed."}
        </p>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl shadow-[var(--card-shadow)] p-5 group">
            <div className="flex gap-3 items-start">
              {/* Award icon placeholder */}
              <div className="w-10 h-10 flex-shrink-0 rounded-lg bg-[#ffc000]/20 flex items-center justify-center text-[18px]">
                🏆
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-[13px] font-black text-[#424242] leading-tight">{item.title}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] text-[#424242]/40">{formatDate(item.award_date)}</span>
                    {isOwner && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="opacity-0 group-hover:opacity-100 text-[11px] text-red-400 hover:text-red-600 transition-all"
                        aria-label="Delete"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                {item.issuer && (
                  <p className="text-[12px] text-[#424242]/55 mt-0.5">{item.issuer}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <FormModal title="Add Honour / Award" onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="space-y-3">
            <InputField label="Award / Title" id="ha-title" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="NottHack 2026 – 1st Runner Up" required />
            <InputField label="Issuing Organisation" id="ha-issuer" value={form.issuer} onChange={(v) => setForm((f) => ({ ...f, issuer: v }))} placeholder="Computer Science Society" />
            <InputField label="Date" id="ha-date" type="month" value={form.award_date} onChange={(v) => setForm((f) => ({ ...f, award_date: v }))} required />
            <SubmitButton saving={saving} />
          </form>
        </FormModal>
      )}
    </section>
  );
}

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
            <h2 className="text-[11px] font-black uppercase tracking-widest text-[#424242]/40 mb-4 border-b border-[#424242]/8 pb-2">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2">
              {allSkills.map((s) => (
                <span key={s} className="bg-[#ffc000]/15 text-[#424242] text-[11px] font-bold px-3 py-1.5 rounded-full resume-skill-pill">
                  {s}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Work Experience */}
        <WorkExperienceSection
          items={workExpItems}
          isOwner={isOwner}
          onAdd={(item) => setWorkExpItems((prev) => [item, ...prev])}
          onDelete={(id) => setWorkExpItems((prev) => prev.filter((i) => i.id !== id))}
        />

        {/* Education */}
        <EducationSection
          items={educationItems}
          isOwner={isOwner}
          onAdd={(item) => setEducationItems((prev) => [item, ...prev])}
          onDelete={(id) => setEducationItems((prev) => prev.filter((i) => i.id !== id))}
        />

        {/* Honours & Awards */}
        <HonoursSection
          items={honoursItems}
          isOwner={isOwner}
          onAdd={(item) => setHonoursItems((prev) => [item, ...prev])}
          onDelete={(id) => setHonoursItems((prev) => prev.filter((i) => i.id !== id))}
        />

        {/* Activity Log — catches everything that doesn't fit the structured sections */}
        {entries.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4 border-b border-[#424242]/10 pb-2">
              <h2 className="text-[15px] font-black text-[#424242]">Activity Log</h2>
              <span className="text-[12px] text-[#424242]/40">{entries.length} {entries.length === 1 ? "entry" : "entries"}</span>
            </div>

            <div className="space-y-4">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white rounded-xl shadow-[var(--card-shadow)] p-5 resume-entry-card"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full resume-category-badge ${CATEGORY_COLOURS[entry.category] ?? CATEGORY_COLOURS.Other}`}>
                      {entry.category}
                    </span>
                    <span className="text-[10px] text-[#424242]/40">{formatDate(entry.entry_date)}</span>
                  </div>
                  <p className="text-[13px] text-[#424242]/75 leading-relaxed">{entry.polished_entry}</p>
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
          entries={entries}
          allSkills={allSkills}
          workExperience={workExpItems}
          education={educationItems}
          honours={honoursItems}
          onClose={() => setShowResumePreview(false)}
        />
      )}
    </div>
  );
}
