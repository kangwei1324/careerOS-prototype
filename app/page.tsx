import React from "react";
import Link from "next/link";
import Footer from "@/components/layout/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f7] font-sans">
      {/* ── Navbar ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-[#f7f7f7]/90 backdrop-blur border-b border-[#424242]/8 px-8 py-4 flex justify-between items-center">
        <div className="text-xl font-black tracking-tight text-[#424242]">
          Career<span className="text-[#ffc000]">OS.</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/auth/signin"
            className="text-[13px] font-semibold text-[#424242]/60 hover:text-[#424242] transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/auth/signup"
            className="bg-[#424242] text-white text-[13px] font-bold px-4 py-2 rounded-full hover:bg-[#333] transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-[#ffc000]/15 text-[#424242] text-[11px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ffc000] inline-block" />
          Talentbank Tech Hackathon 2026
        </div>

        <h1 className="text-5xl md:text-6xl font-black text-[#424242] leading-[1.05] mb-6 tracking-tight">
          Your career, built
          <br />
          <span className="text-[#ffc000]">continuously.</span>
        </h1>

        <p className="text-[17px] text-[#424242]/55 max-w-xl mx-auto leading-relaxed mb-10">
          Log your work. Let AI craft your story. Get found by employers who
          actually care about real skills — not keyword-stuffed CVs.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/auth/signup?role=candidate"
            className="bg-[#ffc000] text-[#424242] text-[14px] font-black px-7 py-3.5 rounded-full hover:bg-[#e6ac00] transition-all hover:scale-105 active:scale-95 shadow-[0_4px_20px_rgba(255,192,0,0.35)]"
          >
            Build my portfolio →
          </Link>
          <Link
            href="/auth/signup?role=employer"
            className="bg-white text-[#424242] text-[14px] font-bold px-7 py-3.5 rounded-full border border-[#424242]/15 hover:border-[#424242]/30 transition-all hover:scale-105 active:scale-95"
          >
            Find talent
          </Link>
        </div>
      </section>

      {/* ── Comparison table ───────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-[11px] font-black uppercase tracking-[0.14em] text-[#424242]/40 text-center mb-8">
          Why CareerOS is different
        </h2>
        <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="grid grid-cols-2 text-[12px]">
            <div className="bg-[#424242]/4 p-4 font-black text-[#424242]/40 uppercase tracking-widest text-[10px]">
              Job boards (LinkedIn, JobStreet)
            </div>
            <div className="p-4 font-black text-[#424242] uppercase tracking-widest text-[10px] border-l border-[#424242]/8 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ffc000]" />
              CareerOS
            </div>
            {[
              ["Employers post jobs", "No job postings — employers browse"],
              ["Candidates spam-apply", "Candidates get found passively"],
              ["ATS filters by keywords", "Employers browse by real skills & signal"],
              ["CV written the night before", "Portfolio built continuously over time"],
              ["Black-box match scores", "Human-readable AI, honest trade-offs"],
            ].map(([bad, good], i) => (
              <React.Fragment key={i}>
                <div
                  className="p-4 text-[#424242]/45 border-t border-[#424242]/8 bg-[#424242]/2"
                >
                  {bad}
                </div>
                <div
                  className="p-4 text-[#424242] font-medium border-t border-[#424242]/8 border-l border-l-[#424242]/8"
                >
                  {good}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-[11px] font-black uppercase tracking-[0.14em] text-[#424242]/40 text-center mb-12">
          Two sides. One platform.
        </h2>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Candidate card */}
          <div className="bg-white rounded-2xl p-8 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
            <div className="w-10 h-10 rounded-xl bg-[#ffc000] flex items-center justify-center mb-5">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 2a4 4 0 100 8 4 4 0 000-8zM4 17a6 6 0 0112 0"
                  stroke="#424242"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3 className="text-[18px] font-black text-[#424242] mb-2">For candidates</h3>
            <p className="text-[13px] text-[#424242]/50 mb-6 leading-relaxed">
              Stop updating your CV the night before. Build your portfolio as you work.
            </p>
            <ul className="space-y-3">
              {[
                "Log work in 2 minutes — AI turns it into your portfolio",
                "Share a public URL that grows with you",
                "Explore where your career could realistically go",
                "See which employers are already looking at your skills",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[13px] text-[#424242]/70">
                  <span className="w-4 h-4 rounded-full bg-[#ffc000]/20 flex-shrink-0 flex items-center justify-center mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ffc000]" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/auth/signup?role=candidate"
              className="mt-8 inline-flex items-center gap-2 text-[13px] font-bold text-[#424242] hover:text-[#ffc000] transition-colors"
            >
              Build my portfolio →
            </Link>
          </div>

          {/* Employer card */}
          <div className="bg-[#424242] rounded-2xl p-8 shadow-[0_2px_20px_rgba(0,0,0,0.12)]">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-5">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="6" width="16" height="12" rx="2" stroke="white" strokeWidth="1.8" />
                <path d="M6 6V5a4 4 0 018 0v1" stroke="white" strokeWidth="1.8" />
              </svg>
            </div>
            <h3 className="text-[18px] font-black text-white mb-2">For employers</h3>
            <p className="text-[13px] text-white/50 mb-6 leading-relaxed">
              Find candidates before they're even looking. Browse real work, not keyword lists.
            </p>
            <ul className="space-y-3">
              {[
                "Filter by field, skills, location — not job titles",
                "View real portfolio entries — what they actually built",
                "Reach out to passive candidates proactively",
                "Discover talent that hasn't updated their resume yet",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-[13px] text-white/60">
                  <span className="w-4 h-4 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ffc000]" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/auth/signup?role=employer"
              className="mt-8 inline-flex items-center gap-2 text-[13px] font-bold text-[#ffc000] hover:opacity-80 transition-opacity"
            >
              Browse talent →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
