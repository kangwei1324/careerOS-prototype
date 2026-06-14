# CareerOS — Passive Talent Discovery Platform
### Talentbank Tech Hackathon 2026 | Team PeckingDucks

[![Live Demo](https://img.shields.io/badge/Demo-Live_Prototype-ffc000?style=for-the-badge)](https://talentbank-career-os-1.vercel.app/)

CareerOS is a two-sided platform that completely eliminates the traditional friction of job postings, spam applications, and black-box ATS algorithms. Instead, it introduces a **passive discovery engine** where candidates organically build a verified record of achievements (a **Living Portfolio**), and employers browse the talent pool to extend direct job and interview offers.

---

## ⚡ The Unique Twist: Flipped Hiring

Traditional job boards are noisy, transactional, and frustrating for both sides. CareerOS flips the paradigm:

| The Legacy Way (LinkedIn, JobStreet) | The CareerOS Way |
| :--- | :--- |
| **Active Applications:** Candidates spam hundreds of resumes. | **Passive Discovery:** Candidates get found based on real capabilities. |
| **Job Postings:** Employers post generic listings and wait. | **Talent Pool Sourcing:** Employers browse, filter, and discover talent directly. |
| **Static CVs:** Resumes are written from memory the night before. | **Living Portfolios:** Accomplishments are logged and polished continuously. |
| **Black-box ATS:** Hardcoded keywords filter out high-potential candidates. | **Transparent AI matching:** AI recommends candidates with clear justifications. |
| **Opaque Match Scores:** Arbitrary ratings with no context. | **Honest Trade-offs:** Career paths explore realistic trajectories with trade-offs. |

---

## 🚀 Key Features

### For Candidates (The Living Portfolio)
* **Continuous Logging:** Log achievements in 2 minutes (what was done, outcomes, dates).
* **AI Portfolio Polisher:** Google Gemini automatically refines raw logs into polished portfolio narratives.
* **AI Skill Extraction:** Auto-tags relevant skills from logged entries and maps them to a visual skills display.
* **AI Bio Generation:** Synthesizes multiple portfolio entries into a clean professional biography.
* **Career Path Explorer:** Generate 3–5 realistic paths with concrete milestones, timelines, and honest trade-offs.
* **Signal Dashboard:** Track profile views, shortlists, and direct applications/interview offers from employers.
* **Offer Action Center:** Accept or decline employer offers directly on the dashboard.

### For Employers (Talent Discovery)
* **Talent Pool Browser:** Filter candidates by skills, location, field, and experience.
* **AI Candidate Suggestions:** Input natural language talent needs, and Gemini matches candidates with detailed justifications.
* **Interactive Timelines:** Browse a candidate's portfolio timeline (achievements over time, not static CV titles).
* **Direct Offers:** Proactively extend specific offers (Interviews or Positions) including salary ranges and role descriptions.
* **Shortlist Management:** Save profiles to return to them later.

---

## 🛠 Tech Stack

* **Framework:** Next.js 16 (App Router) — unifying frontend components and serverless API endpoints.
* **Styling:** Vanilla CSS & Tailwind CSS v4 for a premium, custom interface.
* **Database:** SQLite (via `@libsql/client` and `better-sqlite3`), running locally at `data/careeros.db` with support for remote Turso DB sync.
* **AI Provider:** Google Gemini API using `gemini-2.5-flash-lite` (via the new `@google/genai` SDK).
* **State & Session:** Zustand store combined with Cookie-based mock session management.

---

## 💻 Getting Started

### 1. Prerequisites
Ensure you have Node.js (v18+) and npm installed.

### 2. Configure Environment
Create a `.env.local` file in the root directory:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
# Optional: Setup Turso DB if deploying to cloud. Left blank to use local SQLite.
# TURSO_DATABASE_URL=
# TURSO_AUTH_TOKEN=
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Seed Database
Initialize schema migrations and populate mock candidate/employer records:
```bash
npm run seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎯 Verification & Demo Criteria
A reviewer can complete the following end-to-end flows:
1. **Onboarding:** Sign up as a candidate, log an activity, and watch Gemini polish it into a portfolio entry with auto-extracted skills.
2. **Path Discovery:** Use the Career Path Explorer to evaluate trajectories, checking the standardized uncertainty disclaimers.
3. **Employer Search:** Sign up/in as an employer, type target criteria, receive AI suggestions, and view the public candidate URL.
4. **Offer Transaction:** Send an Interview or Position offer to the candidate, log back in as the candidate, and accept or decline it.
