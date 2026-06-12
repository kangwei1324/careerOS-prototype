"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CATEGORY_COLOURS, type EntryMedia, type PortfolioEntry, type WorkExperience, type Education, type HonourAward } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

// ── PinnedActivities ─────────────────────────────────────────────────────────────

export function PinnedActivities({
  entries,
  onOpenLightbox,
}: {
  entries: PortfolioEntry[];
  onOpenLightbox: (media: EntryMedia[], startIndex: number) => void;
}) {
  if (entries.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-[#424242]/8 space-y-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-[#424242]/40">
        Activities ({entries.length})
      </p>
      {entries.map((entry) => (
        <div key={entry.id} className="bg-[#f7f7f7] rounded-xl p-4 space-y-2">
          {/* Category + date */}
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${CATEGORY_COLOURS[entry.category] ?? CATEGORY_COLOURS.Other}`}>
              {entry.category}
            </span>
            <span className="text-[10px] text-[#424242]/40">{formatDate(entry.entry_date)}</span>
          </div>

          {/* Narrative */}
          <p className="text-[12px] text-[#424242]/75 leading-relaxed">{entry.polished_entry}</p>

          {/* Image strip */}
          {entry.media && entry.media.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {entry.media.map((m, i) => (
                <button
                  key={i}
                  onClick={() => onOpenLightbox(entry.media, i)}
                  className="flex-shrink-0 w-28 rounded-lg overflow-hidden border border-[#424242]/10 hover:border-[#ffc000]/50 transition-all focus:outline-none focus:ring-2 focus:ring-[#ffc000] group"
                  aria-label={m.caption || `View image ${i + 1} fullscreen`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.url} alt={m.caption || "proof"} className="w-28 h-20 object-cover group-hover:scale-105 transition-transform duration-200" />
                  {m.caption && <p className="text-[9px] text-[#424242]/40 px-1.5 py-1 truncate text-left">{m.caption}</p>}
                </button>
              ))}
            </div>
          )}

          {/* Proof links */}
          {entry.links && entry.links.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {entry.links.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-[#424242]/55 bg-white hover:bg-[#ffc000]/20 hover:text-[#424242] px-2.5 py-1 rounded-full transition-all border border-[#424242]/10">
                  🔗 {l.label}
                </a>
              ))}
            </div>
          )}

          {/* Skills */}
          {entry.skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {entry.skills.map((s) => (
                <span key={s} className="bg-[#424242]/6 text-[#424242]/45 text-[9px] font-bold px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in bg-black/40 backdrop-blur-sm">
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
    </div>,
    document.body
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

function SubmitButton({ saving, isEdit = false }: { saving: boolean, isEdit?: boolean }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="w-full bg-[#ffc000] text-[#424242] text-[13px] font-black py-2.5 rounded-full hover:bg-[#e6ac00] disabled:opacity-50 transition-all"
    >
      {saving ? "Saving…" : isEdit ? "Save Changes" : "Save Entry"}
    </button>
  );
}

// ── Work Experience ──────────────────────────────────────────────────────────

export function WorkExperienceSection({
  items,
  isOwner,
  onAdd,
  onEdit,
  onDelete,
  pinnedEntries,
  onOpenLightbox,
}: {
  items: WorkExperience[];
  isOwner: boolean;
  onAdd: (item: WorkExperience) => void;
  onEdit: (item: WorkExperience) => void;
  onDelete: (id: number) => void;
  pinnedEntries: PortfolioEntry[];
  onOpenLightbox: (media: EntryMedia[], startIndex: number) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", company: "", start_date: "", end_date: "", description: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const { showToast } = useToast();

  const openAddForm = () => {
    setEditingId(null);
    setForm({ title: "", company: "", start_date: "", end_date: "", description: "" });
    setShowForm(true);
  };

  const openEditForm = (item: WorkExperience) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      company: item.company,
      start_date: item.start_date,
      end_date: item.end_date || "",
      description: item.description || ""
    });
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const url = editingId ? `/api/portfolio/work-experience/${editingId}` : "/api/portfolio/work-experience";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      if (editingId) {
        onEdit({ id: editingId, ...form, end_date: form.end_date || null });
        showToast("Work experience updated ✓", "success");
      } else {
        onAdd({ id: data.id, ...form, end_date: form.end_date || null });
        showToast("Work experience added ✓", "success");
      }
      
      setShowForm(false);
    } catch {
      showToast("Failed to save. Try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setConfirmDeleteId(null);
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
      <SectionHeader title="Work Experience" isOwner={isOwner} onAdd={openAddForm} />

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
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-all">
                    <button
                      onClick={() => openEditForm(item)}
                      className="text-[11px] font-bold text-[#b38600] hover:text-[#e6ac00] transition-all"
                      aria-label="Edit"
                    >
                      ✏️ Edit
                    </button>
                    {confirmDeleteId === item.id ? (
                      <span className="flex items-center gap-1 ml-1">
                        <span className="text-[11px] text-[#424242]/50 mr-1">Delete?</span>
                        <button onClick={() => handleDelete(item.id)} className="text-[11px] font-black text-red-500 hover:text-red-700 transition-colors">Yes</button>
                        <span className="text-[#424242]/20">·</span>
                        <button onClick={() => setConfirmDeleteId(null)} className="text-[11px] font-bold text-[#424242]/40 hover:text-[#424242] transition-colors">Cancel</button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(item.id)}
                        disabled={deletingId === item.id}
                        className="text-[11px] text-red-400 hover:text-red-600 transition-all ml-1 px-1"
                        aria-label="Delete"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            {item.description && (
              <p className="text-[12px] text-[#424242]/60 leading-relaxed mt-3">{item.description}</p>
            )}
            <PinnedActivities
              entries={pinnedEntries.filter((e) => e.pinned_type === "work_experience" && e.pinned_id === item.id)}
              onOpenLightbox={onOpenLightbox}
            />
          </div>
        ))}
      </div>

      {showForm && (
        <FormModal title={editingId ? "Edit Work Experience" : "Add Work Experience"} onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="space-y-3">
            <InputField label="Job Title" id="wx-title" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="Senior Software Engineer" required />
            <InputField label="Company" id="wx-company" value={form.company} onChange={(v) => setForm((f) => ({ ...f, company: v }))} placeholder="TalentBank" required />
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Start" id="wx-start" type="month" value={form.start_date} onChange={(v) => setForm((f) => ({ ...f, start_date: v }))} required />
              <InputField label="End (leave blank if current)" id="wx-end" type="month" value={form.end_date} onChange={(v) => setForm((f) => ({ ...f, end_date: v }))} />
            </div>
            <TextAreaField label="Description" id="wx-desc" value={form.description} onChange={(v) => setForm((f) => ({ ...f, description: v }))} placeholder="Key responsibilities and achievements…" />
            <SubmitButton saving={saving} isEdit={!!editingId} />
          </form>
        </FormModal>
      )}
    </section>
  );
}

// ── Education ────────────────────────────────────────────────────────────────

export function EducationSection({
  items,
  isOwner,
  onAdd,
  onEdit,
  onDelete,
  pinnedEntries,
  onOpenLightbox,
}: {
  items: Education[];
  isOwner: boolean;
  onAdd: (item: Education) => void;
  onEdit: (item: Education) => void;
  onDelete: (id: number) => void;
  pinnedEntries: PortfolioEntry[];
  onOpenLightbox: (media: EntryMedia[], startIndex: number) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ institution: "", degree: "", start_date: "", end_date: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const { showToast } = useToast();

  const openAddForm = () => {
    setEditingId(null);
    setForm({ institution: "", degree: "", start_date: "", end_date: "" });
    setShowForm(true);
  };

  const openEditForm = (item: Education) => {
    setEditingId(item.id);
    setForm({
      institution: item.institution,
      degree: item.degree,
      start_date: item.start_date,
      end_date: item.end_date || ""
    });
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const url = editingId ? `/api/portfolio/education/${editingId}` : "/api/portfolio/education";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      if (editingId) {
        onEdit({ id: editingId, ...form, end_date: form.end_date || null });
        showToast("Education updated ✓", "success");
      } else {
        onAdd({ id: data.id, ...form, end_date: form.end_date || null });
        showToast("Education added ✓", "success");
      }

      setShowForm(false);
    } catch {
      showToast("Failed to save. Try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setConfirmDeleteId(null);
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
      <SectionHeader title="Education" isOwner={isOwner} onAdd={openAddForm} />

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
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[11px] text-[#424242]/40 text-right">
                      {formatDateRange(item.start_date, item.end_date)}
                    </span>
                    {isOwner && (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-all">
                        <button
                          onClick={() => openEditForm(item)}
                          className="text-[11px] font-bold text-[#b38600] hover:text-[#e6ac00] transition-all"
                          aria-label="Edit"
                        >
                          ✏️ Edit
                        </button>
                        {confirmDeleteId === item.id ? (
                          <span className="flex items-center gap-1 ml-1">
                            <span className="text-[11px] text-[#424242]/50 mr-1">Delete?</span>
                            <button onClick={() => handleDelete(item.id)} className="text-[11px] font-black text-red-500 hover:text-red-700 transition-colors">Yes</button>
                            <span className="text-[#424242]/20">·</span>
                            <button onClick={() => setConfirmDeleteId(null)} className="text-[11px] font-bold text-[#424242]/40 hover:text-[#424242] transition-colors">Cancel</button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(item.id)}
                            disabled={deletingId === item.id}
                            className="text-[11px] text-red-400 hover:text-red-600 transition-all ml-1 px-1"
                            aria-label="Delete"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-[12px] text-[#424242]/55 mt-0.5">{item.degree}</p>
              </div>
            </div>
            <PinnedActivities
              entries={pinnedEntries.filter((e) => e.pinned_type === "education" && e.pinned_id === item.id)}
              onOpenLightbox={onOpenLightbox}
            />
          </div>
        ))}
      </div>

      {showForm && (
        <FormModal title={editingId ? "Edit Education" : "Add Education"} onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="space-y-3">
            <InputField label="Institution" id="edu-institution" value={form.institution} onChange={(v) => setForm((f) => ({ ...f, institution: v }))} placeholder="University of Nottingham Malaysia" required />
            <InputField label="Degree / Qualification" id="edu-degree" value={form.degree} onChange={(v) => setForm((f) => ({ ...f, degree: v }))} placeholder="BSc Computer Science with AI" required />
            <div className="grid grid-cols-2 gap-3">
              <InputField label="Start" id="edu-start" type="month" value={form.start_date} onChange={(v) => setForm((f) => ({ ...f, start_date: v }))} required />
              <InputField label="End (leave blank if current)" id="edu-end" type="month" value={form.end_date} onChange={(v) => setForm((f) => ({ ...f, end_date: v }))} />
            </div>
            <SubmitButton saving={saving} isEdit={!!editingId} />
          </form>
        </FormModal>
      )}
    </section>
  );
}

// ── Honours & Awards ─────────────────────────────────────────────────────────

export function HonoursSection({
  items,
  isOwner,
  onAdd,
  onEdit,
  onDelete,
  pinnedEntries,
  onOpenLightbox,
}: {
  items: HonourAward[];
  isOwner: boolean;
  onAdd: (item: HonourAward) => void;
  onEdit: (item: HonourAward) => void;
  onDelete: (id: number) => void;
  pinnedEntries: PortfolioEntry[];
  onOpenLightbox: (media: EntryMedia[], startIndex: number) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", issuer: "", award_date: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const { showToast } = useToast();

  const openAddForm = () => {
    setEditingId(null);
    setForm({ title: "", issuer: "", award_date: "" });
    setShowForm(true);
  };

  const openEditForm = (item: HonourAward) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      issuer: item.issuer || "",
      award_date: item.award_date
    });
    setShowForm(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editingId ? "PATCH" : "POST";
      const url = editingId ? `/api/portfolio/honours/${editingId}` : "/api/portfolio/honours";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();

      if (editingId) {
        onEdit({ id: editingId, ...form });
        showToast("Award updated ✓", "success");
      } else {
        onAdd({ id: data.id, ...form });
        showToast("Award added ✓", "success");
      }
      
      setShowForm(false);
    } catch {
      showToast("Failed to save. Try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    setConfirmDeleteId(null);
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
      <SectionHeader title="Honours & Awards" isOwner={isOwner} onAdd={openAddForm} />

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
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-[11px] text-[#424242]/40">{formatDate(item.award_date)}</span>
                    {isOwner && (
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-all">
                        <button
                          onClick={() => openEditForm(item)}
                          className="text-[11px] font-bold text-[#b38600] hover:text-[#e6ac00] transition-all"
                          aria-label="Edit"
                        >
                          ✏️ Edit
                        </button>
                        {confirmDeleteId === item.id ? (
                          <span className="flex items-center gap-1 ml-1">
                            <span className="text-[11px] text-[#424242]/50 mr-1">Delete?</span>
                            <button onClick={() => handleDelete(item.id)} className="text-[11px] font-black text-red-500 hover:text-red-700 transition-colors">Yes</button>
                            <span className="text-[#424242]/20">·</span>
                            <button onClick={() => setConfirmDeleteId(null)} className="text-[11px] font-bold text-[#424242]/40 hover:text-[#424242] transition-colors">Cancel</button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(item.id)}
                            disabled={deletingId === item.id}
                            className="text-[11px] text-red-400 hover:text-red-600 transition-all ml-1 px-1"
                            aria-label="Delete"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {item.issuer && (
                  <p className="text-[12px] text-[#424242]/55 mt-0.5">{item.issuer}</p>
                )}
              </div>
            </div>
            <PinnedActivities
              entries={pinnedEntries.filter((e) => e.pinned_type === "honours_awards" && e.pinned_id === item.id)}
              onOpenLightbox={onOpenLightbox}
            />
          </div>
        ))}
      </div>

      {showForm && (
        <FormModal title={editingId ? "Edit Honour / Award" : "Add Honour / Award"} onClose={() => setShowForm(false)}>
          <form onSubmit={submit} className="space-y-3">
            <InputField label="Award / Title" id="ha-title" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} placeholder="NottHack 2026 – 1st Runner Up" required />
            <InputField label="Issuing Organisation" id="ha-issuer" value={form.issuer} onChange={(v) => setForm((f) => ({ ...f, issuer: v }))} placeholder="Computer Science Society" />
            <InputField label="Date" id="ha-date" type="month" value={form.award_date} onChange={(v) => setForm((f) => ({ ...f, award_date: v }))} required />
            <SubmitButton saving={saving} isEdit={!!editingId} />
          </form>
        </FormModal>
      )}
    </section>
  );
}
