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
}

export default function TalentProfileClient({
  candidateId,
  username,
  profile,
  entries,
  interestCount,
}: {
  candidateId: number;
  username: string;
  profile: Profile;
  entries: PortfolioEntry[];
  interestCount: number;
}) {
  const user = useAuthStore((s) => s.user);
  const { showToast } = useToast();
  const [interested, setInterested] = useState(false);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(interestCount);

  const allSkills = Array.from(new Set(entries.flatMap((e) => e.skills)));

  const expressInterest = async () => {
    if (!user || user.role !== "employer") return;
    setLoading(true);
    try {
      const res = await fetch("/api/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId }),
      });
      const data = await res.json();
      // Only increment if it was a new signal (not a duplicate)
      if (data.inserted) setCount((c) => c + 1);
      setInterested(true);
      showToast("Interest expressed ✓", "success");
    } catch {
      showToast("Failed to send signal. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <AppNavbar />

      <main className="max-w-2xl mx-auto px-6 py-10 space-y-8 animate-fade-in">
        {/* Signal summary card */}
        <div className="bg-[#424242] rounded-2xl p-6 text-white">
          <p className="text-[#ffc000] text-[11px] font-black uppercase tracking-widest mb-4">Signal summary</p>
          <div className="flex items-start gap-5">
            <div
              className="w-16 h-16 flex-shrink-0 rounded-2xl bg-white/10 flex items-center justify-center text-[28px] font-black"
              aria-hidden="true"
            >
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-[20px] font-black leading-tight">{profile.name}</h1>
              {profile.headline && <p className="text-white/55 text-[13px] mt-1">{profile.headline}</p>}
              <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-white/40">
                {profile.location && <span><span aria-hidden="true">📍</span> {profile.location}</span>}
                {profile.field   && <span><span aria-hidden="true">💼</span> {profile.field}</span>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
            {[
              { label: "Portfolio entries", value: entries.length },
              { label: "Skills extracted",  value: allSkills.length },
              { label: "Employer signals",  value: count },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white/8 rounded-xl p-3 text-center">
                <div className="text-[22px] font-black">{value}</div>
                <div className="text-[10px] text-white/40 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Top skills */}
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

          {/* Express interest */}
          {user?.role === "employer" && (
            <button
              onClick={expressInterest}
              disabled={loading || interested}
              className={`w-full mt-5 text-[14px] font-black py-3 rounded-xl transition-all ${
                interested
                  ? "bg-white/10 text-white/50 cursor-default"
                  : "bg-[#ffc000] text-[#424242] hover:bg-[#e6ac00] active:scale-95"
              }`}
            >
              {interested ? "✓ Interest expressed" : loading ? "Sending…" : "Express interest →"}
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

        {/* Portfolio story */}
        <section>
          <h2 className="text-[11px] font-black uppercase tracking-widest text-[#424242]/40 mb-4 border-b border-[#424242]/8 pb-2">
            Portfolio ({entries.length} {entries.length === 1 ? "entry" : "entries"})
          </h2>
          <div className="space-y-4">
            {entries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-xl shadow-[var(--card-shadow)] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${CATEGORY_COLOURS[entry.category] ?? CATEGORY_COLOURS.Other}`}>
                    {entry.category}
                  </span>
                  <span className="text-[10px] text-[#424242]/40">{formatDate(entry.entry_date)}</span>
                </div>
                <p className="text-[13px] text-[#424242]/70 leading-relaxed">{entry.polished_entry}</p>
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
    </div>
  );
}
