"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore, useHasHydrated } from "@/stores/authStore";
import AppNavbar from "@/components/layout/AppNavbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/components/ui/Toast";
import { MediaEditor, LinksEditor, PinSelector, type PinOption, type PinType } from "@/components/portfolio/EntryEditors";
import { CATEGORY_COLOURS, type EntryMedia, type EntryLink, type PortfolioEntry, type WorkExperience, type Education, type HonourAward } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Lightbox } from "@/components/ui/Lightbox";

// ── helpers ──────────────────────────────────────────────────────────────────

function pinLabel(
  entry: PortfolioEntry,
  work: WorkExperience[],
  edu: Education[],
  honours: HonourAward[]
): string | null {
  if (!entry.pinned_type || !entry.pinned_id) return null;
  if (entry.pinned_type === "work_experience") {
    const w = work.find((x) => x.id === entry.pinned_id);
    return w ? `💼 ${w.title} @ ${w.company}` : null;
  }
  if (entry.pinned_type === "education") {
    const e = edu.find((x) => x.id === entry.pinned_id);
    return e ? `🎓 ${e.degree} – ${e.institution}` : null;
  }
  if (entry.pinned_type === "honours_awards") {
    const h = honours.find((x) => x.id === entry.pinned_id);
    return h ? `🏆 ${h.title}` : null;
  }
  return null;
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function ManagePortfolioPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { showToast } = useToast();
  const [entries, setEntries] = useState<PortfolioEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editMedia, setEditMedia] = useState<EntryMedia[]>([]);
  const [editLinks, setEditLinks] = useState<EntryLink[]>([]);
  const [editPinnedType, setEditPinnedType] = useState<PinType | null>(null);
  const [editPinnedId, setEditPinnedId] = useState<number | null>(null);

  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  // Lightbox
  const [lightbox, setLightbox] = useState<{ media: EntryMedia[]; startIndex: number } | null>(null);

  // Parent entries for pin selector
  const [workItems, setWorkItems]       = useState<WorkExperience[]>([]);
  const [eduItems, setEduItems]         = useState<Education[]>([]);
  const [honoursItems, setHonoursItems] = useState<HonourAward[]>([]);

  const hydrated = useHasHydrated();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) { router.push("/auth/signin"); return; }
    if (user.role !== "candidate") { router.push("/dashboard"); return; }

    Promise.all([
      fetch("/api/portfolio/entries").then((r) => r.json()),
      fetch("/api/portfolio/work-experience").then((r) => r.json()),
      fetch("/api/portfolio/education").then((r) => r.json()),
      fetch("/api/portfolio/honours").then((r) => r.json()),
    ]).then(([ent, work, edu, honours]) => {
      setEntries(Array.isArray(ent) ? ent : []);
      setWorkItems(Array.isArray(work) ? work : []);
      setEduItems(Array.isArray(edu) ? edu : []);
      setHonoursItems(Array.isArray(honours) ? honours : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [hydrated, user, router]);

  const startEdit = (e: PortfolioEntry) => {
    setEditingId(e.id);
    setEditText(e.polished_entry);
    setEditMedia(e.media ?? []);
    setEditLinks(e.links ?? []);
    setEditPinnedType((e.pinned_type as PinType) ?? null);
    setEditPinnedId(e.pinned_id ?? null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
    setEditMedia([]);
    setEditLinks([]);
    setEditPinnedType(null);
    setEditPinnedId(null);
  };

  const saveEdit = async (id: number) => {
    try {
      const res = await fetch(`/api/portfolio/entries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          polished_entry: editText,
          media:          editMedia,
          links:          editLinks,
          pinned_type:    editPinnedType,
          pinned_id:      editPinnedId,
        }),
      });
      if (!res.ok) throw new Error();
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id
            ? { ...e, polished_entry: editText, media: editMedia, links: editLinks, pinned_type: editPinnedType ?? undefined, pinned_id: editPinnedId ?? undefined }
            : e
        )
      );
      cancelEdit();
      showToast("Entry updated ✓", "success");
    } catch {
      showToast("Failed to save changes. Try again.", "error");
    }
  };

  const confirmDelete = (id: number) => setConfirmDeleteId(id);
  const cancelDelete = () => setConfirmDeleteId(null);

  const deleteEntry = async (id: number) => {
    setConfirmDeleteId(null);
    setDeleting(id);
    try {
      await fetch(`/api/portfolio/entries/${id}`, { method: "DELETE" });
      setEntries((prev) => prev.filter((e) => e.id !== id));
      showToast("Entry deleted", "info");
    } catch {
      showToast("Failed to delete. Try again.", "error");
    } finally {
      setDeleting(null);
    }
  };

  const allSkills = Array.from(new Set(entries.flatMap((e) => e.skills)));

  const pinOptions: PinOption[] = [
    ...workItems.map((w) => ({ type: "work_experience" as PinType, id: w.id, label: `${w.title} @ ${w.company}`, icon: "💼" })),
    ...eduItems.map((e) => ({ type: "education" as PinType, id: e.id, label: `${e.degree} – ${e.institution}`, icon: "🎓" })),
    ...honoursItems.map((h) => ({ type: "honours_awards" as PinType, id: h.id, label: h.title, icon: "🏆" })),
  ];

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <AppNavbar />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-[26px] font-black text-[#424242] mb-1">My portfolio</h1>
            <p className="text-[13px] text-[#424242]/50">{entries.length} {entries.length === 1 ? "entry" : "entries"}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {user && (
              <Link
                href={`/portfolio/${user.username}`}
                className="text-[12px] font-bold text-[#424242]/50 border border-[#424242]/15 px-4 py-2 rounded-full hover:border-[#424242]/30 transition-all"
              >
                View profile →
              </Link>
            )}
            <Link
              href="/portfolio/log"
              className="bg-[#ffc000] text-[#424242] text-[12px] font-black px-4 py-2 rounded-full hover:bg-[#e6ac00] transition-all"
            >
              + Log activity
            </Link>
          </div>
        </div>

        {/* Skills summary */}
        {allSkills.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-[var(--card-shadow)] mb-6">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#424242]/40 mb-3">All skills extracted</p>
            <div className="flex flex-wrap gap-2">
              {allSkills.map((s) => (
                <span key={s} className="bg-[#ffc000]/15 text-[#424242] text-[11px] font-bold px-3 py-1.5 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <div key={i} className="h-32 skeleton rounded-xl" />)}
          </div>
        )}

        {!loading && entries.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl shadow-[var(--card-shadow)]">
            <p className="text-3xl mb-3" aria-hidden="true">📂</p>
            <p className="text-[15px] font-black text-[#424242] mb-1">Nothing here yet</p>
            <p className="text-[13px] text-[#424242]/50 mb-5">Log your first activity to start building your portfolio</p>
            <Link href="/portfolio/log" className="inline-flex bg-[#ffc000] text-[#424242] text-[13px] font-black px-6 py-2.5 rounded-full hover:bg-[#e6ac00] transition-all">
              + Log first activity
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {entries.map((entry) => {
            const isEditing = editingId === entry.id;
            const pin = pinLabel(entry, workItems, eduItems, honoursItems);

            return (
              <div
                key={entry.id}
                className={`bg-white rounded-xl shadow-[var(--card-shadow)] transition-opacity ${deleting === entry.id ? "opacity-40" : ""}`}
              >
                {/* ── Card header ── */}
                <div className="flex justify-between items-start p-5 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${CATEGORY_COLOURS[entry.category] ?? CATEGORY_COLOURS.Other}`}>
                      {entry.category}
                    </span>
                    <span className="text-[10px] text-[#424242]/40">{formatDate(entry.entry_date)}</span>
                    {pin && !isEditing && (
                      <span className="text-[10px] font-bold text-[#424242]/50 bg-[#424242]/6 px-2 py-0.5 rounded-full border border-[#424242]/10 flex items-center gap-1">
                        📌 <span className="truncate max-w-[140px]">{pin}</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isEditing ? (
                      <>
                        <button onClick={() => saveEdit(entry.id)} className="text-[12px] font-black text-[#b38600] hover:text-[#e6ac00] transition-colors min-h-[44px] px-2">
                          Save
                        </button>
                        <button onClick={cancelEdit} className="text-[12px] font-bold text-[#424242]/40 hover:text-[#424242] transition-colors min-h-[44px] px-2">
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(entry)} className="text-[11px] font-bold text-[#424242]/40 hover:text-[#424242] transition-colors min-h-[44px] px-2">
                          Edit
                        </button>
                        {confirmDeleteId === entry.id ? (
                          <span className="flex items-center gap-1">
                            <span className="text-[11px] text-[#424242]/50 mr-1">Delete?</span>
                            <button onClick={() => deleteEntry(entry.id)} className="text-[11px] font-black text-red-500 hover:text-red-700 transition-colors">Yes</button>
                            <span className="text-[#424242]/20">·</span>
                            <button onClick={cancelDelete} className="text-[11px] font-bold text-[#424242]/40 hover:text-[#424242] transition-colors">Cancel</button>
                          </span>
                        ) : (
                          <button onClick={() => confirmDelete(entry.id)} disabled={deleting === entry.id} className="text-[11px] font-bold text-red-400 hover:text-red-600 transition-colors min-h-[44px] px-2">
                            Delete
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* ── Card body ── */}
                <div className="px-5 pb-5 space-y-4">
                  {/* Narrative */}
                  {isEditing ? (
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={4}
                      aria-label="Edit portfolio entry"
                      className="w-full border border-[#ffc000]/40 bg-[#ffc000]/5 rounded-lg px-3 py-2.5 text-[13px] text-[#424242] outline-none resize-none leading-relaxed"
                    />
                  ) : (
                    <p className="text-[13px] text-[#424242]/70 leading-relaxed">{entry.polished_entry}</p>
                  )}

                  {/* Read-only: image strip */}
                  {!isEditing && entry.media && entry.media.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                      {entry.media.map((m, i) => (
                        <button
                          key={i}
                          onClick={() => setLightbox({ media: entry.media!, startIndex: i })}
                          className="flex-shrink-0 w-36 rounded-lg overflow-hidden border border-[#424242]/10 hover:border-[#ffc000]/50 transition-all focus:outline-none focus:ring-2 focus:ring-[#ffc000] group"
                          aria-label={m.caption || `View image ${i + 1} fullscreen`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={m.url} alt={m.caption || "proof image"} className="w-36 h-24 object-cover group-hover:scale-105 transition-transform duration-200" />
                          {m.caption && <p className="text-[10px] text-[#424242]/50 px-2 py-1 truncate text-left">{m.caption}</p>}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Read-only: proof links */}
                  {!isEditing && entry.links && entry.links.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {entry.links.map((l, i) => (
                        <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#424242]/60 bg-[#424242]/6 hover:bg-[#ffc000]/20 hover:text-[#424242] px-3 py-1.5 rounded-full transition-all border border-[#424242]/10">
                          🔗 {l.label}
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Edit mode: full editors */}
                  {isEditing && (
                    <div className="space-y-5 pt-2 border-t border-[#424242]/8">
                      <MediaEditor media={editMedia} onChange={setEditMedia} />
                      <LinksEditor links={editLinks} onChange={setEditLinks} />
                      {pinOptions.length > 0 && (
                        <PinSelector
                          options={pinOptions}
                          pinnedType={editPinnedType}
                          pinnedId={editPinnedId}
                          onChange={(t, id) => { setEditPinnedType(t); setEditPinnedId(id); }}
                        />
                      )}
                    </div>
                  )}

                  {/* Skills */}
                  {entry.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {entry.skills.map((s) => (
                        <span key={s} className="bg-[#424242]/8 text-[#424242]/55 text-[10px] font-bold px-2.5 py-1 rounded-full">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <Footer />

      {lightbox && (
        <Lightbox
          media={lightbox.media}
          startIndex={lightbox.startIndex}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
