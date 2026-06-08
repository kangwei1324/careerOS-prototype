"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

interface PortfolioEntry {
  id: number;
  polished_entry: string;
  category: string;
  entry_date: string;
  skills: string[];
}

interface Signal {
  company_name: string;
  created_at: string;
}

// ── Candidate Dashboard ──────────────────────────────────────────
function CandidateDashboard({ username }: { username: string }) {
  const [entries, setEntries] = useState<PortfolioEntry[]>([]);
  const [signals, setSignals] = useState<{ count: number; employers: Signal[] }>({ count: 0, employers: [] });
  const [profile, setProfile] = useState<any>(null);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    fetch("/api/portfolio/entries").then((r) => r.json()).then(setEntries);
    if (user?.userId) {
      fetch(`/api/interest?candidateId=${user.userId}`).then((r) => r.json()).then(setSignals);
      fetch("/api/onboarding").then((r) => r.json()).then(setProfile);
    }
  }, [user?.userId]);

  const allSkills: string[] = Array.from(
    new Set(entries.flatMap((e) => e.skills))
  ).slice(0, 8);

  const completeness = profile
    ? [profile.name, profile.headline, profile.location, profile.field, (profile.skills || []).length > 0]
        .filter(Boolean).length * 20
    : 0;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8 animate-fade-in">
      {/* Welcome banner */}
      <div className="bg-[#424242] rounded-2xl p-6 flex justify-between items-center">
        <div>
          <p className="text-[#ffc000] text-[11px] font-black uppercase tracking-widest mb-1">Your career, building.</p>
          <h2 className="text-white text-[22px] font-black">Hi, {profile?.name || username} 👋</h2>
          <p className="text-white/40 text-[13px] mt-1">{entries.length} portfolio {entries.length === 1 ? "entry" : "entries"} logged</p>
        </div>
        <Link
          href="/portfolio/log"
          className="bg-[#ffc000] text-[#424242] text-[13px] font-black px-5 py-2.5 rounded-full hover:bg-[#e6ac00] transition-all whitespace-nowrap"
        >
          + Log activity
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Portfolio entries", value: entries.length, icon: "📝" },
          { label: "Skills extracted", value: allSkills.length, icon: "⚡" },
          { label: "Employer signals", value: signals.count, icon: "👀" },
        ].map(({ label, value, icon }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-[0_2px_16px_rgba(0,0,0,0.05)] text-center">
            <div className="text-2xl mb-2">{icon}</div>
            <div className="text-[28px] font-black text-[#424242]">{value}</div>
            <div className="text-[11px] text-[#424242]/40 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Profile completeness */}
      <div className="bg-white rounded-xl p-5 shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-[12px] font-black uppercase tracking-widest text-[#424242]/50">Profile completeness</h3>
          <span className="text-[13px] font-black text-[#424242]">{completeness}%</span>
        </div>
        <div className="h-2 bg-[#424242]/8 rounded-full overflow-hidden">
          <div
            className="h-full bg-[#ffc000] rounded-full transition-all"
            style={{ width: `${completeness}%` }}
          />
        </div>
        {completeness < 100 && (
          <Link href="/onboarding" className="text-[11px] text-[#ffc000] font-bold mt-2 inline-block hover:underline">
            Complete your profile →
          </Link>
        )}
      </div>

      {/* Employer signals */}
      {signals.count > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
          <h3 className="text-[12px] font-black uppercase tracking-widest text-[#424242]/50 mb-4">Employer signals</h3>
          <div className="space-y-3">
            {signals.employers.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#424242] rounded-lg flex items-center justify-center text-white text-[10px] font-black">
                  {s.company_name.charAt(0)}
                </div>
                <div>
                  <p className="text-[13px] font-bold text-[#424242]">{s.company_name}</p>
                  <p className="text-[11px] text-[#424242]/40">Expressed interest</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {allSkills.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
          <h3 className="text-[12px] font-black uppercase tracking-widest text-[#424242]/50 mb-4">Top skills</h3>
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
            <h3 className="text-[12px] font-black uppercase tracking-widest text-[#424242]/50">Recent entries</h3>
            <Link href="/portfolio/manage" className="text-[11px] text-[#ffc000] font-bold hover:underline">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {entries.slice(0, 3).map((e) => (
              <div key={e.id} className="bg-white rounded-xl p-5 shadow-[0_2px_16px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#ffc000] bg-[#ffc000]/10 px-2.5 py-1 rounded-full">
                    {e.category}
                  </span>
                  <span className="text-[10px] text-[#424242]/30">{e.entry_date}</span>
                </div>
                <p className="text-[13px] text-[#424242]/70 leading-relaxed line-clamp-3">{e.polished_entry}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && (
        <div className="bg-white rounded-xl p-10 shadow-[0_2px_16px_rgba(0,0,0,0.05)] text-center">
          <p className="text-3xl mb-3">📝</p>
          <p className="text-[15px] font-black text-[#424242] mb-1">No entries yet</p>
          <p className="text-[13px] text-[#424242]/45 mb-5">Log your first activity and let AI craft your story</p>
          <Link
            href="/portfolio/log"
            className="inline-flex bg-[#ffc000] text-[#424242] text-[13px] font-black px-6 py-2.5 rounded-full hover:bg-[#e6ac00] transition-all"
          >
            + Log first activity
          </Link>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-4">
        <Link href={`/portfolio/${username}`} className="bg-white rounded-xl p-4 shadow-[0_2px_16px_rgba(0,0,0,0.05)] flex items-center gap-3 hover:shadow-[0_4px_24px_rgba(0,0,0,0.09)] transition-shadow group">
          <span className="text-2xl">🔗</span>
          <div>
            <p className="text-[13px] font-black text-[#424242]">View public portfolio</p>
            <p className="text-[11px] text-[#424242]/40">portfolio/{username}</p>
          </div>
        </Link>
        <Link href="/explore" className="bg-white rounded-xl p-4 shadow-[0_2px_16px_rgba(0,0,0,0.05)] flex items-center gap-3 hover:shadow-[0_4px_24px_rgba(0,0,0,0.09)] transition-shadow group">
          <span className="text-2xl">🧭</span>
          <div>
            <p className="text-[13px] font-black text-[#424242]">Career path explorer</p>
            <p className="text-[11px] text-[#424242]/40">See where you could go</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

// ── Employer Dashboard ───────────────────────────────────────────
function EmployerDashboard() {
  const [profile, setProfile] = useState<any>(null);
  useEffect(() => {
    fetch("/api/onboarding").then((r) => r.json()).then(setProfile);
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-8 animate-fade-in">
      <div className="bg-[#424242] rounded-2xl p-6 flex justify-between items-center">
        <div>
          <p className="text-[#ffc000] text-[11px] font-black uppercase tracking-widest mb-1">Employer dashboard</p>
          <h2 className="text-white text-[22px] font-black">
            {profile?.company_name || "Your company"} 🏢
          </h2>
          <p className="text-white/40 text-[13px] mt-1">Find the right people before they're looking</p>
        </div>
        <Link
          href="/talent"
          className="bg-[#ffc000] text-[#424242] text-[13px] font-black px-5 py-2.5 rounded-full hover:bg-[#e6ac00] transition-all whitespace-nowrap"
        >
          Browse talent →
        </Link>
      </div>
      <div className="bg-white rounded-xl p-8 shadow-[0_2px_16px_rgba(0,0,0,0.05)] text-center">
        <p className="text-3xl mb-3">🔍</p>
        <p className="text-[15px] font-black text-[#424242] mb-1">Start discovering talent</p>
        <p className="text-[13px] text-[#424242]/45 mb-5">
          Browse candidates by field, skills, and location. View their living portfolios.
        </p>
        <Link href="/talent" className="inline-flex bg-[#ffc000] text-[#424242] text-[13px] font-black px-6 py-2.5 rounded-full hover:bg-[#e6ac00] transition-all">
          Browse talent pool →
        </Link>
      </div>
    </div>
  );
}

// ── Navbar ───────────────────────────────────────────────────────
function Navbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-40 bg-[#f7f7f7]/90 backdrop-blur border-b border-[#424242]/8 px-6 py-3.5 flex justify-between items-center">
      <Link href="/dashboard" className="text-xl font-black tracking-tight text-[#424242]">
        Career<span className="text-[#ffc000]">OS.</span>
      </Link>
      <div className="flex items-center gap-2">
        {user?.role === "candidate" && (
          <>
            <Link href="/portfolio/log" className="text-[12px] font-bold text-[#424242]/60 hover:text-[#424242] px-3 py-1.5 rounded-full hover:bg-white transition-all">Log</Link>
            <Link href="/portfolio/manage" className="text-[12px] font-bold text-[#424242]/60 hover:text-[#424242] px-3 py-1.5 rounded-full hover:bg-white transition-all">Portfolio</Link>
            <Link href="/explore" className="text-[12px] font-bold text-[#424242]/60 hover:text-[#424242] px-3 py-1.5 rounded-full hover:bg-white transition-all">Explore</Link>
          </>
        )}
        {user?.role === "employer" && (
          <Link href="/talent" className="text-[12px] font-bold text-[#424242]/60 hover:text-[#424242] px-3 py-1.5 rounded-full hover:bg-white transition-all">Browse Talent</Link>
        )}
        <button
          onClick={handleLogout}
          className="text-[12px] font-bold text-[#424242]/45 hover:text-[#424242] ml-2 transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
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
    <div className="min-h-screen bg-[#f7f7f7]">
      <Navbar />
      {user.role === "candidate" ? (
        <CandidateDashboard username={user.username} />
      ) : (
        <EmployerDashboard />
      )}
    </div>
  );
}
