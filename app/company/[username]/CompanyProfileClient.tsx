"use client";

import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import AppNavbar from "@/components/layout/AppNavbar";
import Footer from "@/components/layout/Footer";

interface Profile {
  company_name: string;
  industry: string;
  location: string;
  description: string;
  company_description: string;
  socials: {
    website?: string;
    linkedin?: string;
    twitter?: string;
  };
}

export default function CompanyProfileClient({
  employerId,
  username,
  profile,
}: {
  employerId: number;
  username: string;
  profile: Profile;
}) {
  const user = useAuthStore((s) => s.user);

  const isOwner = user?.username === username;

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex flex-col">
      <AppNavbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-10">
        <div className="bg-white rounded-2xl shadow-[var(--card-shadow)] p-7 space-y-6">
          
          {/* Header row */}
          <div className="flex justify-between items-center border-b border-[#424242]/8 pb-4">
            <h1 className="text-[20px] font-black text-[#424242]">Company Profile</h1>
            {isOwner && (
              <Link
                href="/company/edit"
                className="bg-[#ffc000] text-[#424242] text-[12px] font-black px-4 py-2 rounded-full hover:bg-[#e6ac00] transition-all"
              >
                ✏️ Edit Profile
              </Link>
            )}
          </div>

          <div className="space-y-6 animate-fade-in">
            <div className="flex gap-4 items-start">
              <div
                className="w-16 h-16 rounded-2xl bg-[#424242] flex items-center justify-center text-white text-[24px] font-black flex-shrink-0"
                aria-hidden="true"
              >
                {profile.company_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-[20px] font-black text-[#424242]">{profile.company_name}</h2>
                <div className="flex flex-wrap gap-3 mt-2 text-[12px] text-[#424242]/50">
                  {profile.industry && <span>🏭 {profile.industry}</span>}
                  {profile.location && <span>📍 {profile.location}</span>}
                </div>
              </div>
            </div>

            {/* Social Links */}
            {profile.socials && (profile.socials.website || profile.socials.linkedin || profile.socials.twitter) && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-[#424242]/8">
                {profile.socials.website && (
                  <a
                    href={profile.socials.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#424242]/75 hover:text-[#424242] text-[11px] font-semibold flex items-center gap-1 bg-[#424242]/5 hover:bg-[#424242]/10 px-3 py-1.5 rounded-full transition-all"
                  >
                    🔗 Website
                  </a>
                )}
                {profile.socials.linkedin && (
                  <a
                    href={profile.socials.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#424242]/75 hover:text-[#424242] text-[11px] font-semibold flex items-center gap-1 bg-[#424242]/5 hover:bg-[#424242]/10 px-3 py-1.5 rounded-full transition-all"
                  >
                    💼 LinkedIn
                  </a>
                )}
                {profile.socials.twitter && (
                  <a
                    href={profile.socials.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#424242]/75 hover:text-[#424242] text-[11px] font-semibold flex items-center gap-1 bg-[#424242]/5 hover:bg-[#424242]/10 px-3 py-1.5 rounded-full transition-all"
                  >
                    🐦 Twitter
                  </a>
                )}
              </div>
            )}

            {/* Description */}
            <div className="pt-4 border-t border-[#424242]/8">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-[#424242]/40 mb-2">
                Company Description
              </h3>
              <p className="w-full rounded-xl py-2.5 text-[13px] text-[#424242]/70 leading-relaxed">
                {profile.company_description || "No description provided."}
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
