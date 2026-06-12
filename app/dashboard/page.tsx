"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore, useHasHydrated } from "@/stores/authStore";
import AppNavbar from "@/components/layout/AppNavbar";
import Footer from "@/components/layout/Footer";
import { formatDate } from "@/lib/utils";
import { CATEGORY_COLOURS, type PortfolioEntry, type Signal } from "@/lib/types";

// ── Candidate Dashboard ──────────────────────────────────────────
function CandidateDashboard({ username }: { username: string }) {
  const [entries, setEntries] = useState<PortfolioEntry[]>([]);
  const [signals, setSignals] = useState<{ count: number; employers: Signal[] }>({ count: 0, employers: [] });
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user?.userId) return;

    Promise.all([
      fetch("/api/portfolio/entries").then((r) => r.json()).then((d) => Array.isArray(d) ? d : []).catch(() => []),
      fetch(`/api/interest?candidateId=${user.userId}`).then((r) => r.json()).catch(() => ({ count: 0, employers: [] })),
      fetch("/api/onboarding").then((r) => r.json()).catch(() => null),
    ]).then(([entriesData, signalsData, profileData]) => {
      setEntries(entriesData);
      setSignals(signalsData);
      setProfile(profileData);
      setLoading(false);
    });
  }, [user?.userId]);

  const allSkills: string[] = Array.from(
    new Set(entries.flatMap((e) => e.skills))
  ).slice(0, 8);

  const [primarySkills, setPrimarySkills] = useState<string[]>([]);
  const [dismissedAi, setDismissedAi] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [savingSkills, setSavingSkills] = useState(false);

  // Sync primarySkills from profile when it loads
  useEffect(() => {
    if (profile?.skills) setPrimarySkills(Array.isArray(profile.skills) ? profile.skills : []);
  }, [profile]);

  const aiOnlySkills: string[] = allSkills
    .filter((s) => !primarySkills.includes(s) && !dismissedAi.includes(s));

  const saveSkills = async (updated: string[]) => {
    if (!profile) return;
    setSavingSkills(true);
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, skills: updated }),
      });
    } finally {
      setSavingSkills(false);
    }
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed || primarySkills.includes(trimmed)) { setSkillInput(""); return; }
    const updated = [...primarySkills, trimmed];
    setPrimarySkills(updated);
    setSkillInput("");
    saveSkills(updated);
  };

  const removeSkill = (s: string) => {
    const updated = primarySkills.filter((x) => x !== s);
    setPrimarySkills(updated);
    saveSkills(updated);
  };

  const dismissAiSkill = (s: string) => setDismissedAi((prev) => [...prev, s]);


  const completeness = profile
    ? [profile.name, profile.headline, profile.location, profile.field, (profile.skills || []).length > 0]
      .filter(Boolean).length * 20
    : 0;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <div className="h-32 skeleton rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-28 skeleton rounded-xl" />)}
        </div>
        <div className="h-16 skeleton rounded-xl" />
        <div className="h-24 skeleton rounded-xl" />
      </div>
    );
  }


  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8 animate-fade-in">
      {/* Welcome banner */}
      <div className="bg-[#424242] rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-[#ffc000] text-[11px] font-black uppercase tracking-widest mb-1">Your career, building.</p>
          <h1 className="text-white text-[22px] font-black">Hi, {profile?.name || username} 👋</h1>
          <p className="text-[13px] font-semibold text-[#c4c4c4]/60 mt-1 leading-snug">{profile?.headline}</p>
          <div className="flex flex-wrap gap-3 mt-3">
            <span className="text-[11px] text-[#f8f8f8]/50 flex items-center gap-1">
              <span aria-hidden="true">📍</span> {profile.location}
            </span>
            <span className="text-[11px] text-[#c4c4c4]/50 flex items-center gap-1">
              <span aria-hidden="true">💼</span> {profile.field}
            </span>
          </div>
          <p className="text-white/40 text-[13px] mt-1">{entries.length} portfolio {entries.length === 1 ? "entry" : "entries"} logged</p>
        </div>
        <Link
          href="/profile/edit"
          className="bg-[#ffc000] text-[#424242] text-[13px] font-black px-5 py-2.5 rounded-full hover:bg-[#e6ac00] transition-all whitespace-nowrap flex-shrink-0"
        >
          ✏️ Edit profile
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Portfolio entries", value: entries.length, icon: "📝" },
          { label: "Skills extracted", value: allSkills.length, icon: "⚡" },
          { label: "Employer signals", value: signals.count, icon: "👀" },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-[var(--card-shadow)] text-center">
            <div className="text-2xl mb-2" aria-hidden="true">{icon}</div>
            <div className="text-[28px] font-black text-[#424242]">{value}</div>
            <div className="text-[11px] text-[#424242]/50 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Profile completeness — hidden after 100% */}
      {completeness < 100 && (
        <div className="bg-white rounded-xl p-5 shadow-[var(--card-shadow)]">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-[12px] font-black uppercase tracking-widest text-[#424242]/50">Profile completeness</h2>
            <span className="text-[13px] font-black text-[#424242]">{completeness}%</span>
          </div>
          <div className="h-2 bg-[#424242]/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#ffc000] rounded-full transition-all"
              style={{ width: `${completeness}%` }}
              role="progressbar"
              aria-valuenow={completeness}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <Link href="/onboarding" className="text-[11px] text-[#b38600] font-bold mt-2 inline-block hover:underline">
            Complete your profile →
          </Link>
        </div>
      )}

      {/* Employer signals */}
      {signals.count > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-[var(--card-shadow)]">
          <h2 className="text-[12px] font-black uppercase tracking-widest text-[#424242]/50 mb-4">Employer signals</h2>
          <div className="space-y-3">
            {signals.employers.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#424242] rounded-lg flex items-center justify-center text-white text-[10px] font-black flex-shrink-0" aria-hidden="true">
                  {s.company_name.charAt(0)}
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#424242]">{s.company_name}</p>
                  <p className="text-[11px] text-[#424242]/50">Expressed interest</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {(primarySkills.length > 0 || aiOnlySkills.length > 0) && (
        <div className="bg-white rounded-xl p-5 shadow-[var(--card-shadow)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[12px] font-black uppercase tracking-widest text-[#424242]/50">Skills</h2>
            {savingSkills && <span className="text-[10px] text-[#424242]/30 animate-pulse">Saving…</span>}
          </div>

          {/* Primary — profile-entered skills */}
          <div className="flex flex-wrap gap-2 mb-3">
            {primarySkills.map((s) => (
              <span key={s} className="flex items-center gap-1 bg-[#ffc000] text-[#424242] text-[11px] font-black px-3 py-1.5 rounded-full">
                {s}
                <button
                  onClick={() => removeSkill(s)}
                  aria-label={`Remove ${s}`}
                  className="ml-0.5 text-[#424242]/50 hover:text-[#424242] cursor-pointer text-[10px] leading-none transition-colors"
                >
                  ✕
                </button>
              </span>
            ))}

            {/* Inline add field */}
            <form
              onSubmit={(e) => { e.preventDefault(); addSkill(); }}
              className="flex items-center gap-1"
            >
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Add skill…"
                className="text-[11px] border border-[#424242]/20 rounded-full px-3 py-1.5 w-28 outline-none focus:border-[#ffc000] transition-colors"
              />
              <button
                type="submit"
                disabled={!skillInput.trim()}
                aria-label="Add skill"
                className="w-6 h-6 rounded-full bg-[#ffc000] text-[#424242] font-black text-[14px] leading-none flex items-center justify-center hover:bg-[#e6ac00] disabled:opacity-30 cursor-pointer transition-all"
              >
                +
              </button>
            </form>
          </div>

          {/* Secondary — AI-detected skills not already listed */}
          {aiOnlySkills.length > 0 && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#424242]/30 mb-2">Also detected from your logs</p>
              <div className="flex flex-wrap gap-2">
                {aiOnlySkills.map((s) => (
                  <span key={s} className="flex items-center gap-1 bg-[#424242]/6 text-[#424242]/50 text-[11px] font-bold px-3 py-1.5 rounded-full border border-[#424242]/8">
                    {s}
                    <button
                      onClick={() => dismissAiSkill(s)}
                      aria-label={`Dismiss ${s}`}
                      className="ml-0.5 text-[#424242]/30 hover:text-[#424242]/60 cursor-pointer text-[10px] leading-none transition-colors"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Recent entries */}
      {entries.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[12px] font-black uppercase tracking-widest text-[#424242]/50">Recent entries</h2>
            <Link href="/portfolio/manage" className="text-[11px] text-[#b38600] font-bold hover:underline">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {entries.slice(0, 3).map((e) => (
              <div key={e.id} className="bg-white rounded-xl p-5 shadow-[var(--card-shadow)]">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${CATEGORY_COLOURS[e.category] ?? CATEGORY_COLOURS.Other}`}>
                    {e.category}
                  </span>
                  <span className="text-[10px] text-[#424242]/40">{formatDate(e.entry_date)}</span>
                </div>
                <p className="text-[13px] text-[#424242]/70 leading-relaxed line-clamp-3">{e.polished_entry}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className="bg-white rounded-xl p-10 shadow-[var(--card-shadow)] text-center">
          <p className="text-3xl mb-3" aria-hidden="true">📝</p>
          <p className="text-[15px] font-black text-[#424242] mb-1">No entries yet</p>
          <p className="text-[13px] text-[#424242]/50 mb-5">Log your first activity and let AI craft your story</p>
          <Link
            href="/portfolio/log"
            className="inline-flex bg-[#ffc000] text-[#424242] text-[13px] font-black px-6 py-2.5 rounded-full hover:bg-[#e6ac00] transition-all"
          >
            + Log first activity
          </Link>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href={`/portfolio/${username}`} className="bg-white rounded-xl p-4 shadow-[var(--card-shadow)] flex items-center gap-3 hover:shadow-[var(--card-shadow-hover)] transition-shadow group">
          <span className="text-2xl" aria-hidden="true">🔗</span>
          <div>
            <p className="text-[13px] font-black text-[#424242]">View public portfolio</p>
            <p className="text-[11px] text-[#424242]/50">portfolio/{username}</p>
          </div>
        </Link>
        <Link href="/explore" className="bg-white rounded-xl p-4 shadow-[var(--card-shadow)] flex items-center gap-3 hover:shadow-[var(--card-shadow-hover)] transition-shadow group">
          <span className="text-2xl" aria-hidden="true">🧭</span>
          <div>
            <p className="text-[13px] font-black text-[#424242]">Career path explorer</p>
            <p className="text-[11px] text-[#424242]/50">See where you could go</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

// ── Employer Dashboard ───────────────────────────────────────────
function EmployerDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [shortlist, setShortlist] = useState<any[]>([]);
  const [loadingShortlist, setLoadingShortlist] = useState(true);

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((p) => {
        setProfile(p);
        setDescription(p?.description ?? "");
        if (p?.description) {
          fetchSuggestions();
        }
      })
      .catch(() => null);

    fetchShortlist();
  }, []);

  const fetchShortlist = async () => {
    setLoadingShortlist(true);
    try {
      const res = await fetch("/api/employer/shortlist");
      const data = await res.json();
      setShortlist(Array.isArray(data) ? data : []);
    } catch {
      setShortlist([]);
    } finally {
      setLoadingShortlist(false);
    }
  };

  const fetchSuggestions = async (refresh = false) => {
    setLoadingSuggestions(true);
    try {
      const url = refresh ? "/api/employer/suggestions?refresh=1" : "/api/employer/suggestions";
      const res = await fetch(url);
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const removeShortlist = async (candidateId: number) => {
    try {
      const res = await fetch("/api/interest", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId }),
      });
      if (res.ok) {
        setShortlist((list) => list.filter((c) => c.id !== candidateId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveDescription = async () => {
    if (!profile) return;
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: profile.company_name,
          industry: profile.industry,
          location: profile.location,
          description,
          company_description: profile.company_description ?? "",
          socials: profile.socials || {},
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      // Refresh AI suggestions when requirement changes
      fetchSuggestions(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8 animate-fade-in">
      {/* Banner */}
      <div className="bg-[#424242] rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-[#ffc000] text-[11px] font-black uppercase tracking-widest mb-1">Employer dashboard</p>
            <h1 className="text-white text-[22px] font-black">
              {profile?.company_name || "Your company"} 🏢
            </h1>
          </div>
          {profile?.username && (
            <Link
              href={`/company/${profile.username}`}
              className="bg-white/10 hover:bg-white/20 text-white text-[12px] font-bold px-4 py-2 rounded-full transition-all whitespace-nowrap"
            >
              View company profile →
            </Link>
          )}
        </div>

        <div className="flex flex-wrap gap-4 mt-3 text-white/50 text-[13px]">
          {profile?.industry && (
            <span className="flex items-center gap-1">
              <span>🏭</span> {profile.industry}
            </span>
          )}
          {profile?.location && (
            <span className="flex items-center gap-1">
              <span>📍</span> {profile.location}
            </span>
          )}
        </div>

        {/* Company Socials */}
        {profile?.socials && (profile.socials.website || profile.socials.linkedin || profile.socials.twitter) && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/10">
            {profile.socials.website && (
              <a
                href={profile.socials.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white text-[11px] font-semibold flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-all"
              >
                <span>🔗</span> Website
              </a>
            )}
            {profile.socials.linkedin && (
              <a
                href={profile.socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white text-[11px] font-semibold flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-all"
              >
                <span>💼</span> LinkedIn
              </a>
            )}
            {profile.socials.twitter && (
              <a
                href={profile.socials.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white text-[11px] font-semibold flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-full transition-all"
              >
                <span>🐦</span> Twitter
              </a>
            )}
          </div>
        )}
      </div>

      {/* What are you looking for */}
      <div className="bg-white rounded-xl p-6 shadow-[var(--card-shadow)]">
        <h2 className="text-[15px] font-black text-[#424242] mb-1">What are you looking for?</h2>
        <p className="text-[12px] text-[#424242]/40 mb-1">
          Describe the type of candidate you want to find — skills, experience level, traits, or target projects.
        </p>
        <p className="text-[12px] text-[#424242]/40 mb-4">
          Gemini will analyze candidate work logs and recommend matches based on real capabilities.
        </p>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          placeholder="e.g. We're looking for frontend engineers with 2+ years of React experience who thrive in fast-paced startups…"
          className="w-full border border-[#424242]/15 rounded-xl px-4 py-3 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] transition-colors resize-none leading-relaxed"
        />
        <div className="flex items-center justify-between mt-3">
          {saved && (
            <span className="text-[12px] text-green-600 font-bold">✓ Saved</span>
          )}
          {!saved && <span />}
          <button
            onClick={saveDescription}
            disabled={saving}
            className="bg-[#ffc000] text-[#424242] text-[13px] font-black px-5 py-2 rounded-full hover:bg-[#e6ac00] transition-all disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save & Find Matches"}
          </button>
        </div>
      </div>

      {/* AI Suggested Candidates */}
      <div className="bg-white rounded-xl p-6 shadow-[var(--card-shadow)] space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">✨</span>
          <h2 className="text-[15px] font-black text-[#424242]">AI Suggested Candidates</h2>
        </div>

        {!description.trim() ? (
          <p className="text-[12px] text-[#424242]/40 italic">
            Describe what you are looking for above and save to generate AI candidate matches.
          </p>
        ) : loadingSuggestions ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 skeleton rounded-xl" />
            ))}
          </div>
        ) : suggestions.length === 0 ? (
          <p className="text-[12px] text-[#424242]/40 italic">
            No candidates matched your description. Try adjusting your target skills or experience requirements.
          </p>
        ) : (
          <div className="space-y-4">
            {suggestions.map((c) => (
              <div key={c.id} className="border border-[#424242]/8 rounded-xl p-4 hover:border-[#ffc000]/40 transition-colors bg-white">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <Link href={`/talent/${c.username}`} className="text-[13px] font-black text-[#424242] hover:underline">
                      {c.name}
                    </Link>
                    {c.headline && <p className="text-[11px] text-[#424242]/50">{c.headline}</p>}
                    <p className="text-[10px] text-[#424242]/40 mt-1">📍 {c.location || "N/A"} • {c.field}</p>
                  </div>
                  <Link
                    href={`/talent/${c.username}`}
                    className="text-[11px] font-bold text-[#b38600] border border-[#ffc000]/25 hover:bg-[#ffc000]/5 px-3 py-1 rounded-full"
                  >
                    View profile
                  </Link>
                </div>
                
                {/* AI Reason */}
                {c.reason && (
                  <div className="mt-3 bg-[#ffc000]/10 border-l-2 border-[#ffc000] p-2.5 rounded-r-lg text-[12px] text-[#424242]/80 leading-relaxed italic">
                    <strong>Match Signal:</strong> {c.reason}
                  </div>
                )}

                {/* Skills badges */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {c.skills.slice(0, 5).map((s: string) => (
                    <span key={s} className="bg-[#424242]/6 text-[#424242]/60 text-[9px] font-bold px-2 py-0.5 rounded-full">
                      {s}
                    </span>
                  ))}
                  {c.skills.length > 5 && (
                    <span className="text-[9px] text-[#424242]/40">+{c.skills.length - 5}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shortlisted Candidates */}
      <div className="bg-white rounded-xl p-6 shadow-[var(--card-shadow)] space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">⭐</span>
          <h2 className="text-[15px] font-black text-[#424242]">Shortlisted Candidates</h2>
        </div>

        {loadingShortlist ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 skeleton rounded-xl" />
            ))}
          </div>
        ) : shortlist.length === 0 ? (
          <div className="text-center py-6 text-[13px] text-[#424242]/40">
            No candidates shortlisted yet. Search candidate portfolios to add some.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {shortlist.map((c) => (
              <div key={c.id} className="border border-[#424242]/8 rounded-xl p-4 flex flex-col justify-between hover:shadow-[0_2px_12px_rgba(0,0,0,0.03)] transition-all bg-white">
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <Link href={`/talent/${c.username}`} className="text-[13px] font-black text-[#424242] hover:underline">
                      {c.name}
                    </Link>
                    <button
                      onClick={() => removeShortlist(c.id)}
                      className="text-[#424242]/40 hover:text-red-500 text-[11px]"
                      title="Remove from shortlist"
                    >
                      ✕ Remove
                    </button>
                  </div>
                  {c.headline && <p className="text-[11px] text-[#424242]/50 truncate mt-0.5">{c.headline}</p>}
                  <p className="text-[10px] text-[#424242]/40 mt-1">📍 {c.location || "N/A"}</p>
                </div>
                
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-[#424242]/5">
                  <span className="text-[10px] text-[#424242]/40">{c.entry_count} logs</span>
                  <Link href={`/talent/${c.username}`} className="text-[11px] font-bold text-[#b38600] hover:underline">
                    View full profile →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Discover more */}
      <div className="bg-white rounded-xl p-8 shadow-[var(--card-shadow)] text-center">
        <p className="text-3xl mb-3" aria-hidden="true">🔍</p>
        <p className="text-[15px] font-black text-[#424242] mb-1">Discover other talents yourself</p>
        <p className="text-[13px] text-[#424242]/50 mb-5">
          Browse candidates by field, skills, and location. View their living portfolios.
        </p>
        <Link href="/talent" className="inline-flex bg-[#ffc000] text-[#424242] text-[13px] font-black px-6 py-2.5 rounded-full hover:bg-[#e6ac00] transition-all">
          Browse talent pool →
        </Link>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const hydrated = useHasHydrated();

  useEffect(() => {
    if (hydrated && !user) router.push("/auth/signin");
  }, [hydrated, user, router]);

  if (!hydrated || !user) return null;

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex flex-col">
      <AppNavbar />
      <main className="flex-1">
        {user.role === "candidate" ? (
          <CandidateDashboard username={user.username} />
        ) : (
          <EmployerDashboard />
        )}
      </main>
      <Footer />
    </div>
  );
}
