"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/layout/AppNavbar";
import { useToast } from "@/components/ui/Toast";
import type { Candidate } from "@/lib/types";

export default function TalentPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { showToast } = useToast();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ field: "", location: "", skills: "" });

  useEffect(() => {
    if (!user) { router.push("/auth/signin"); return; }
    if (user.role !== "employer") { router.push("/dashboard"); return; }
    fetchCandidates();
  }, [user]);

  const fetchCandidates = async (f = filters) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (f.field) params.set("field", f.field);
    if (f.location) params.set("location", f.location);
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

  const update = (k: string, v: string) => setFilters((f) => ({ ...f, [k]: v }));

  const applyFilters = () => fetchCandidates(filters);
  const clearFilters = () => {
    const cleared = { field: "", location: "", skills: "" };
    setFilters(cleared);
    fetchCandidates(cleared);
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <AppNavbar />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-[28px] font-black text-[#424242] mb-1">Talent pool</h1>
        <p className="text-[13px] text-[#424242]/50 mb-8">
          Browse candidates by what they actually do — not what they put in a headline.
        </p>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-[var(--card-shadow)] p-5 mb-8 flex flex-wrap gap-4 items-end">
          {[
            { label: "Field",    key: "field",    placeholder: "Engineering, Design…",             id: "filter-field" },
            { label: "Location", key: "location", placeholder: "Kuala Lumpur…",                    id: "filter-location" },
            { label: "Skills",   key: "skills",   placeholder: "React, Python (comma-separated)",  id: "filter-skills" },
          ].map(({ label, key, placeholder, id }) => (
            <div key={key} className="flex-1 min-w-[160px]">
              <label htmlFor={id} className="block text-[10px] font-black uppercase tracking-widest text-[#424242]/40 mb-1.5">
                {label}
              </label>
              <input
                id={id}
                value={(filters as any)[key]}
                onChange={(e) => update(key, e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                placeholder={placeholder}
                className="w-full border border-[#424242]/15 rounded-lg px-3 py-2 text-[12px] text-[#424242] outline-none focus:border-[#ffc000] transition-colors"
              />
            </div>
          ))}
          <div className="flex gap-2">
            <button
              onClick={applyFilters}
              className="bg-[#ffc000] text-[#424242] text-[12px] font-black px-4 py-2 rounded-lg hover:bg-[#e6ac00] transition-all"
            >
              Filter
            </button>
            <button
              onClick={clearFilters}
              className="border border-[#424242]/15 text-[#424242]/50 text-[12px] font-bold px-4 py-2 rounded-lg hover:border-[#424242]/30 transition-all"
            >
              Clear
            </button>
          </div>
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
                  <span key={s} className="bg-[#ffc000]/15 text-[#424242] text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                    {s}
                  </span>
                ))}
                {c.skills.length > 4 && (
                  <span className="text-[10px] text-[#424242]/40">+{c.skills.length - 4}</span>
                )}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#424242]/40">{c.entry_count} portfolio {c.entry_count === 1 ? "entry" : "entries"}</span>
                <span className="text-[11px] font-bold text-[#b38600] group-hover:underline">View profile →</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
