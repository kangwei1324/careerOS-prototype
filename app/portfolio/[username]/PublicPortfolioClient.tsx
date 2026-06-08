"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import AppNavbar from "@/components/layout/AppNavbar";
import { useToast } from "@/components/ui/Toast";
import { CATEGORY_COLOURS, type PortfolioEntry } from "@/lib/types";
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

export default function PublicPortfolioClient({
  username,
  profile,
  entries,
  allSkills,
}: {
  username: string;
  profile: Profile;
  entries: PortfolioEntry[];
  allSkills: string[];
}) {
  const user = useAuthStore((s) => s.user);
  const { showToast } = useToast();
  const [bio, setBio] = useState(profile.bio);
  const [generatingBio, setGeneratingBio] = useState(false);

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
                {/* Copy link — moved from navbar to top-right of profile card */}
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
            {/* Only show regen to owner */}
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

        {/* Portfolio timeline */}
        <section>
          <h2 className="text-[11px] font-black uppercase tracking-widest text-[#424242]/40 mb-4 border-b border-[#424242]/8 pb-2">
            Portfolio ({entries.length} {entries.length === 1 ? "entry" : "entries"})
          </h2>

          {entries.length === 0 && (
            <div className="bg-white rounded-xl p-10 text-center shadow-[var(--card-shadow)]">
              <p className="text-[13px] text-[#424242]/40">No portfolio entries yet.</p>
            </div>
          )}

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
                      <span key={s} className="bg-[#424242]/6 text-[#424242]/55 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-[#424242]/8 py-6 text-center mt-8">
        <p className="text-[11px] text-[#424242]/30">
          Built with <span className="text-[#ffc000] font-bold">CareerOS</span> — Talentbank Tech Hackathon 2026
        </p>
      </footer>
    </div>
  );
}
