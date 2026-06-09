// ── CareerOS Shared Types ─────────────────────────────────────────

export interface PortfolioEntry {
  id: number;
  polished_entry: string;
  category: string;
  entry_date: string;
  skills: string[];
}

export interface WorkExperience {
  id: number;
  title: string;
  company: string;
  start_date: string;
  end_date: string | null;
  description: string;
}

export interface Education {
  id: number;
  institution: string;
  degree: string;
  start_date: string;
  end_date: string | null;
}

export interface HonourAward {
  id: number;
  title: string;
  issuer: string;
  award_date: string;
}

export interface Signal {
  company_name: string;
  created_at: string;
}

export interface CandidateProfile {
  name: string;
  headline: string;
  location: string;
  field: string;
  bio: string;
  skills: string[];
  userId?: number;
}

export interface Candidate {
  id: number;
  username: string;
  name: string;
  headline: string;
  location: string;
  field: string;
  skills: string[];
  bio: string;
  entry_count: number;
}

// Centralised category badge colours — previously duplicated in 3 files
export const CATEGORY_COLOURS: Record<string, string> = {
  Technical:     "bg-blue-100 text-blue-700",
  Leadership:    "bg-purple-100 text-purple-700",
  Communication: "bg-green-100 text-green-700",
  Creative:      "bg-pink-100 text-pink-700",
  Other:         "bg-[#424242]/8 text-[#424242]/60",
};
