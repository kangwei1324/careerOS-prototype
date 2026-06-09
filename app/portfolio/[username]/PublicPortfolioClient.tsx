"use client";

import { useState } from "react";
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

// ── Main Client Component ─────────────────────────────────────────────────────

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

  const isOwner = user?.username === username;

  const copyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast("Portfolio link copied!", "success");
  };

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
    <div className="min-h-screen bg-[#f7f7f7]">
      <AppNavbar />

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-8 animate-fade-in">
        {/* Profile header */}
        <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] p-7">
          <div className="flex gap-5 items-start">
            <div
              className="w-20 h-20 flex-shrink-0 rounded-2xl bg-[#424242] flex items-center justify-center text-white text-[28px] font-black"
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
                <button
                  onClick={copyUrl}
                  className="flex-shrink-0 text-[12px] font-bold text-[#424242]/50 border border-[#424242]/15 px-4 py-2 rounded-full hover:border-[#424242]/30 transition-all flex items-center gap-1.5"
                >
                  <span aria-hidden="true">🔗</span> Copy link
                </button>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-5 pt-5 border-t border-[#424242]/8">
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
                <span key={s} className="bg-[#ffc000]/15 text-[#424242] text-[11px] font-bold px-3 py-1.5 rounded-full">
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
                  className="bg-white rounded-xl shadow-[var(--card-shadow)] p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${CATEGORY_COLOURS[entry.category] ?? CATEGORY_COLOURS.Other}`}>
                      {entry.category}
                    </span>
                    <span className="text-[10px] text-[#424242]/40">{formatDate(entry.entry_date)}</span>
                  </div>
                  <p className="text-[13px] text-[#424242]/75 leading-relaxed">{entry.polished_entry}</p>
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
    </div>
  );
}
