"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/layout/AppNavbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/components/ui/Toast";
import type { Candidate } from "@/lib/types";
import { MALAYSIA_LOCATIONS, FIELDS_AND_SKILLS } from "@/lib/referenceData";

export default function TalentPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { showToast } = useToast();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ field: "", state: "", city: "", skills: "" });
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  useEffect(() => {
    if (!user) {
      router.push("/auth/signin");
      return;
    }
    if (user.role !== "employer") {
      router.push("/dashboard");
      return;
    }
    fetchCandidates();
  }, [user]);

  const fetchCandidates = async (f = filters) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (f.field) params.set("field", f.field);

    // Combine state and city for the location search
    const locationVal = f.city && f.state ? `${f.city}, ${f.state}` : (f.city || f.state || "");
    if (locationVal) params.set("location", locationVal);

    if (f.skills) params.set("skills", f.skills);

    try {
      const res = await fetch(`/api/talent?${params.toString()}`);
      const data = await res.json();
      setCandidates(Array.isArray(data) ? data : []);
    } catch {
      showToast("Failed to load candidates.", "error");
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const updateFilter = (k: string, v: string) => setFilters((f) => ({ ...f, [k]: v }));

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) => {
      const next = prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill];
      return next;
    });
  };

  const applyFilters = () => {
    const activeFilters = {
      ...filters,
      skills: selectedSkills.join(","),
    };
    fetchCandidates(activeFilters);
  };

  const clearFilters = () => {
    const cleared = { field: "", state: "", city: "", skills: "" };
    setFilters(cleared);
    setSelectedSkills([]);
    fetchCandidates(cleared);
  };

  const availableSkills = filters.field ? FIELDS_AND_SKILLS[filters.field] || [] : [];

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <AppNavbar />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-[28px] font-black text-[#424242] mb-1">Talent pool</h1>
        <p className="text-[13px] text-[#424242]/50 mb-8">
          Browse candidates by what they actually do — not what they put in a headline.
        </p>

        {/* Filters Panel */}
        <div className="bg-white rounded-xl shadow-[var(--card-shadow)] p-5 mb-8 space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            {/* Field Dropdown */}
            <div className="flex-1 min-w-[200px]">
              <label htmlFor="filter-field" className="block text-[10px] font-black uppercase tracking-widest text-[#424242]/40 mb-1.5">
                Field / Domain
              </label>
              <select
                id="filter-field"
                value={filters.field}
                onChange={(e) => {
                  updateFilter("field", e.target.value);
                  setSelectedSkills([]); // Reset skills on field change
                }}
                className="w-full border border-[#424242]/15 rounded-lg px-3 py-2 text-[12px] text-[#424242] outline-none focus:border-[#ffc000] bg-white transition-colors"
              >
                <option value="">All Domains</option>
                {Object.keys(FIELDS_AND_SKILLS).map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* State Dropdown */}
            <div className="flex-1 min-w-[150px]">
              <label htmlFor="filter-state" className="block text-[10px] font-black uppercase tracking-widest text-[#424242]/40 mb-1.5">
                State in Malaysia
              </label>
              <select
                id="filter-state"
                value={filters.state}
                onChange={(e) => {
                  updateFilter("state", e.target.value);
                  updateFilter("city", "");
                }}
                className="w-full border border-[#424242]/15 rounded-lg px-3 py-2 text-[12px] text-[#424242] outline-none focus:border-[#ffc000] bg-white transition-colors"
              >
                <option value="">All States</option>
                {Object.keys(MALAYSIA_LOCATIONS).map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* City Dropdown */}
            <div className="flex-1 min-w-[150px]">
              <label htmlFor="filter-city" className="block text-[10px] font-black uppercase tracking-widest text-[#424242]/40 mb-1.5">
                City / Town
              </label>
              <select
                id="filter-city"
                value={filters.city}
                onChange={(e) => updateFilter("city", e.target.value)}
                disabled={!filters.state}
                className="w-full border border-[#424242]/15 rounded-lg px-3 py-2 text-[12px] text-[#424242] outline-none focus:border-[#ffc000] bg-white disabled:opacity-50 transition-colors"
              >
                <option value="">All Cities</option>
                {filters.state &&
                  MALAYSIA_LOCATIONS[filters.state]?.map((ct) => (
                    <option key={ct} value={ct}>{ct}</option>
                  ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={applyFilters}
                className="bg-[#ffc000] text-[#424242] text-[12px] font-black px-4 py-2.5 rounded-lg hover:bg-[#e6ac00] transition-all"
              >
                Apply Filters
              </button>
              <button
                onClick={clearFilters}
                className="border border-[#424242]/15 text-[#424242]/50 text-[12px] font-bold px-4 py-2.5 rounded-lg hover:border-[#424242]/30 transition-all"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Skill Filter Tags (Based on Chosen Field) */}
          {filters.field && availableSkills.length > 0 && (
            <div className="pt-3 border-t border-[#424242]/5">
              <span className="block text-[10px] font-black uppercase tracking-widest text-[#424242]/40 mb-2">
                Filter by technical skills
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {availableSkills.map((sk) => {
                  const isSelected = selectedSkills.includes(sk);
                  return (
                    <button
                      key={sk}
                      onClick={() => toggleSkill(sk)}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all ${
                        isSelected
                          ? "bg-[#ffc000] text-[#424242]"
                          : "bg-[#f7f7f7] text-[#424242]/60 hover:bg-[#424242]/5"
                      }`}
                    >
                      {isSelected ? `✓ ${sk}` : `+ ${sk}`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Results count */}
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#424242]/40 mb-4">
          {loading ? "Loading…" : `${candidates.length} candidate${candidates.length !== 1 ? "s" : ""}`}
        </p>

        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-44 skeleton rounded-xl" />)}
          </div>
        )}

        {!loading && candidates.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl shadow-[var(--card-shadow)]">
            <p className="text-3xl mb-3" aria-hidden="true">🔍</p>
            <p className="text-[15px] font-black text-[#424242] mb-1">No candidates found</p>
            <p className="text-[13px] text-[#424242]/50">Try different filters or clear them</p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map((c) => (
            <Link
              key={c.id}
              href={`/talent/${c.username}`}
              className="bg-white rounded-xl shadow-[var(--card-shadow)] p-5 hover:shadow-[var(--card-shadow-hover)] transition-all group block"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-[#424242] flex items-center justify-center text-white text-[14px] font-black" aria-hidden="true">
                  {c.name ? c.name.charAt(0) : c.username.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="text-[13px] font-black text-[#424242] leading-tight truncate">{c.name || c.username}</h2>
                  {c.headline && <p className="text-[11px] text-[#424242]/50 truncate mt-0.5">{c.headline}</p>}
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-3 text-[10px] text-[#424242]/50">
                {c.location && <span aria-label={`Location: ${c.location}`}>📍 {c.location}</span>}
                {c.field && <span>• {c.field}</span>}
              </div>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {c.skills.slice(0, 4).map((s) => (
                  <span key={s} className="bg-[#ffc000]/15 text-[#424242] text-[10px] font-bold px-2.5 py-1 rounded-full">
                    {s}
                  </span>
                ))}
                {c.skills.length > 4 && (
                  <span className="text-[10px] text-[#424242]/40">+{c.skills.length - 4}</span>
                )}
              </div>

              <div className="flex justify-between items-center border-t border-[#424242]/5 pt-3">
                <span className="text-[10px] text-[#424242]/40">{c.entry_count} portfolio {c.entry_count === 1 ? "entry" : "entries"}</span>
                <span className="text-[11px] font-bold text-[#b38600] group-hover:underline">View profile →</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
