"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

interface Entry {
  id: number;
  polished_entry: string;
  category: string;
  entry_date: string;
  skills: string[];
}

const CATEGORY_COLOURS: Record<string, string> = {
  Technical: "bg-blue-100 text-blue-700",
  Leadership: "bg-purple-100 text-purple-700",
  Communication: "bg-green-100 text-green-700",
  Creative: "bg-pink-100 text-pink-700",
  Other: "bg-[#424242]/8 text-[#424242]/60",
};

export default function ManagePortfolioPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    if (!user) { router.push("/auth/signin"); return; }
    fetch("/api/portfolio/entries")
      .then((r) => r.json())
      .then((data) => { setEntries(data); setLoading(false); });
  }, [user, router]);

  const startEdit = (e: Entry) => { setEditingId(e.id); setEditText(e.polished_entry); };

  const saveEdit = async (id: number) => {
    await fetch(`/api/portfolio/entries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ polished_entry: editText }),
    });
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, polished_entry: editText } : e));
    setEditingId(null);
  };

  const deleteEntry = async (id: number) => {
    setDeleting(id);
    await fetch(`/api/portfolio/entries/${id}`, { method: "DELETE" });
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setDeleting(null);
  };

  const allSkills = Array.from(new Set(entries.flatMap((e) => e.skills)));

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <nav className="sticky top-0 z-40 bg-[#f7f7f7]/90 backdrop-blur border-b border-[#424242]/8 px-6 py-3.5 flex justify-between items-center">
        <Link href="/dashboard" className="text-xl font-black tracking-tight text-[#424242]">
          Career<span className="text-[#ffc000]">OS.</span>
        </Link>
        <Link href="/portfolio/log" className="bg-[#ffc000] text-[#424242] text-[12px] font-black px-4 py-2 rounded-full hover:bg-[#e6ac00] transition-all">
          + Log activity
        </Link>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-[26px] font-black text-[#424242] mb-1">My portfolio</h1>
            <p className="text-[13px] text-[#424242]/45">{entries.length} {entries.length === 1 ? "entry" : "entries"}</p>
          </div>
          {user && (
            <Link
              href={`/portfolio/${user.username}`}
              className="text-[12px] font-bold text-[#424242]/50 border border-[#424242]/15 px-4 py-2 rounded-full hover:border-[#424242]/30 transition-all"
            >
              View public →
            </Link>
          )}
        </div>

        {/* Skills summary */}
        {allSkills.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-[0_2px_16px_rgba(0,0,0,0.05)] mb-6">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#424242]/40 mb-3">All skills extracted</p>
            <div className="flex flex-wrap gap-2">
              {allSkills.map((s) => (
                <span key={s} className="bg-[#ffc000]/15 text-[#424242] text-[11px] font-bold px-3 py-1 rounded-full">
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
          <div className="text-center py-20 bg-white rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
            <p className="text-3xl mb-3">📂</p>
            <p className="text-[15px] font-black text-[#424242] mb-1">Nothing here yet</p>
            <p className="text-[13px] text-[#424242]/45 mb-5">Log your first activity to start building your portfolio</p>
            <Link href="/portfolio/log" className="inline-flex bg-[#ffc000] text-[#424242] text-[13px] font-black px-6 py-2.5 rounded-full hover:bg-[#e6ac00] transition-all">
              + Log first activity
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={`bg-white rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.05)] p-5 transition-opacity ${
                deleting === entry.id ? "opacity-40" : ""
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${CATEGORY_COLOURS[entry.category] ?? CATEGORY_COLOURS.Other}`}>
                    {entry.category}
                  </span>
                  <span className="text-[10px] text-[#424242]/30">{entry.entry_date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => editingId === entry.id ? saveEdit(entry.id) : startEdit(entry)}
                    className="text-[11px] font-bold text-[#424242]/40 hover:text-[#424242] transition-colors"
                  >
                    {editingId === entry.id ? "Save" : "Edit"}
                  </button>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    disabled={deleting === entry.id}
                    className="text-[11px] font-bold text-red-400 hover:text-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {editingId === entry.id ? (
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={4}
                  className="w-full border border-[#ffc000]/40 bg-[#ffc000]/5 rounded-lg px-3 py-2.5 text-[13px] text-[#424242] outline-none resize-none leading-relaxed"
                />
              ) : (
                <p className="text-[13px] text-[#424242]/70 leading-relaxed">{entry.polished_entry}</p>
              )}

              {entry.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {entry.skills.map((s) => (
                    <span key={s} className="bg-[#424242]/6 text-[#424242]/60 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
