"use client";

import { useState } from "react";
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
                {profile.field   && <span>💼 {profile.field}</span>}
              </div>
            </div>
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
              { label: "Skills extracted",  value: allSkills.length },
              { label: "Employer signals",  value: count },
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
              className={`w-full mt-5 text-[14px] font-black py-3 rounded-xl transition-all active:scale-95 ${
                interested
                  ? "bg-white/20 hover:bg-white/30 text-white"
                  : "bg-[#ffc000] text-[#424242] hover:bg-[#e6ac00]"
              }`}
            >
              {interested ? "⭐ Shortlisted (Click to remove)" : loading ? "Updating..." : "Shortlist candidate →"}
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
          onAdd={() => {}}
          onEdit={() => {}}
          onDelete={() => {}}
          pinnedEntries={pinnedEntries}
          onOpenLightbox={openLightbox}
        />

        {/* Education */}
        <EducationSection
          items={education}
          isOwner={false}
          onAdd={() => {}}
          onEdit={() => {}}
          onDelete={() => {}}
          pinnedEntries={pinnedEntries}
          onOpenLightbox={openLightbox}
        />

        {/* Honours & Awards */}
        <HonoursSection
          items={honours}
          isOwner={false}
          onAdd={() => {}}
          onEdit={() => {}}
          onDelete={() => {}}
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
    </div>
  );
}
