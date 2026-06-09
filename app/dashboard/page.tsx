"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
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
          <p className="text-white/40 text-[13px] mt-1">{entries.length} portfolio {entries.length === 1 ? "entry" : "entries"} logged</p>
        </div>
        <Link
          href="/portfolio/log"
          className="bg-[#ffc000] text-[#424242] text-[13px] font-black px-5 py-2.5 rounded-full hover:bg-[#e6ac00] transition-all whitespace-nowrap flex-shrink-0"
        >
          + Log activity
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Portfolio entries", value: entries.length, icon: "📝" },
          { label: "Skills extracted",  value: allSkills.length, icon: "⚡" },
          { label: "Employer signals",  value: signals.count,   icon: "👀" },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-[var(--card-shadow)] text-center">
            <div className="text-2xl mb-2" aria-hidden="true">{icon}</div>
            <div className="text-[28px] font-black text-[#424242]">{value}</div>
            <div className="text-[11px] text-[#424242]/50 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Profile completeness */}
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
        {completeness < 100 && (
          <Link href="/onboarding" className="text-[11px] text-[#b38600] font-bold mt-2 inline-block hover:underline">
            Complete your profile →
          </Link>
        )}
      </div>

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
      {allSkills.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-[var(--card-shadow)]">
          <h2 className="text-[12px] font-black uppercase tracking-widest text-[#424242]/50 mb-4">Top skills</h2>
          <div className="flex flex-wrap gap-2">
            {allSkills.map((s) => (
              <span key={s} className="bg-[#ffc000]/15 text-[#424242] text-[11px] font-bold px-3 py-1.5 rounded-full">
                {s}
              </span>
            ))}
          </div>
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

  useEffect(() => {
    fetch("/api/onboarding")
      .then((r) => r.json())
      .then((p) => {
        setProfile(p);
        setDescription(p?.description ?? "");
      })
      .catch(() => null);
  }, []);

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
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8 animate-fade-in">
      <div className="bg-[#424242] rounded-2xl p-6">
        <p className="text-[#ffc000] text-[11px] font-black uppercase tracking-widest mb-1">Employer dashboard</p>
        <h1 className="text-white text-[22px] font-black mb-3">
          {profile?.company_name || "Your company"} 🏢
        </h1>
        <div className="flex flex-wrap gap-4">
          {profile?.industry && (
            <span className="flex items-center gap-1.5 text-white/55 text-[13px]">
              <span aria-hidden="true">🏭</span> {profile.industry}
            </span>
          )}
          {profile?.location && (
            <span className="flex items-center gap-1.5 text-white/55 text-[13px]">
              <span aria-hidden="true">📍</span> {profile.location}
            </span>
          )}
          {!profile?.industry && !profile?.location && (
            <p className="text-white/40 text-[13px]">Find the right people before they&apos;re looking</p>
          )}
        </div>
      </div>

      {/* What are you looking for */}
      <div className="bg-white rounded-xl p-6 shadow-[var(--card-shadow)]">
        <h2 className="text-[15px] font-black text-[#424242] mb-1">What are you looking for?</h2>
        <p className="text-[12px] text-[#424242]/40 mb-1">
          Describe the type of candidate you want to find — skills, experience level, traits, or anything else.
        </p>
        <p className="text-[12px] text-[#424242]/40 mb-4">
          This is saved and editable at any time — it updates the system on what candidates you are actively seeking.
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
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

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

  useEffect(() => {
    if (!user) router.push("/auth/signin");
  }, [user, router]);

  if (!user) return null;

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
