import { getDb, initDbSchema } from "../lib/db";
import { hashPassword } from "../lib/auth";

async function seed() {
  console.log("Initializing schema...");
  await initDbSchema();

  const db = getDb();

  console.log("Clearing existing data...");
  await db.execute("DELETE FROM users");
  await db.execute("DELETE FROM candidate_profiles");
  await db.execute("DELETE FROM employer_profiles");
  await db.execute("DELETE FROM portfolio_entries");
  await db.execute("DELETE FROM work_experience");
  await db.execute("DELETE FROM education");
  await db.execute("DELETE FROM employer_offers");
  await db.execute("DELETE FROM employer_interests");

  const defaultPassword = await hashPassword("password123");

  console.log("Seeding Employers...");
  const employers = [
    { email: "hr@techcorp.com", username: "techcorp", name: "TechCorp Global", industry: "Technology", location: "San Francisco, CA", desc: "Looking for a Senior Full Stack Engineer with strong experience in Node.js, React, and building scalable backend architectures.", cDesc: "We build scalable cloud solutions for the modern enterprise.", socials: { website: "#", linkedin: "https://linkedin.com" } },
    { email: "careers@finvest.com", username: "finvest", name: "FinVest Partners", industry: "Finance / Business", location: "New York, NY", desc: "Top-tier investment banking and asset management.", cDesc: "", socials: {} }, // Missing cDesc and socials
    { email: "jobs@buildright.com", username: "buildright", name: "BuildRight Engineering", industry: "Civil Engineering", location: "Chicago, IL", desc: "We are seeking a detail-oriented Structural Engineer with expertise in AutoCAD and commercial high-rises.", cDesc: "Specializing in large-scale commercial infrastructure.", socials: { website: "#" } },
    { email: "hello@healthsync.com", username: "healthsync", name: "HealthSync", industry: "Healthcare IT", location: "", desc: "Digital health records and telemedicine.", cDesc: "", socials: {} } // Missing location, cDesc, socials
  ];

  for (const emp of employers) {
    const res = await db.execute({ sql: "INSERT INTO users (email, password, role, username) VALUES (?, ?, 'employer', ?)", args: [emp.email, defaultPassword, emp.username] });
    const userId = Number(res.lastInsertRowid);
    await db.execute({
      sql: "INSERT INTO employer_profiles (user_id, company_name, industry, location, description, company_description, socials_json) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [userId, emp.name, emp.industry, emp.location, emp.desc, emp.cDesc, JSON.stringify(emp.socials)]
    });
  }

  console.log("Seeding Candidates...");
  const candidates = [
    {
      email: "alice@example.com", username: "alice_dev", name: "Alice Software", headline: "Senior Full Stack Engineer", location: "San Francisco, CA", field: "Software Engineering", exp: "5", skills: ["React", "Node.js", "TypeScript", "SQL"], bio: "Passionate about building scalable web applications and intuitive user interfaces.",
      socials: { github: "https://github.com", linkedin: "https://linkedin.com", website: "#" },
      work: [{ title: "Software Engineer", company: "Webify Tech", start: "2020-01", end: "2024-01", desc: "Developed microservices in Node.js and led the frontend migration to React." }],
      edu: [{ inst: "University of Technology", deg: "BSc Computer Science", start: "2016", end: "2020" }],
      portfolio: [
        { log: "Built a distributed caching system using Redis", category: "Backend", media: [], links: [{ label: "GitHub Repo", url: "https://github.com" }] },
        { log: "Created a responsive dashboard using Tailwind and React", category: "Frontend", media: [{ url: "https://placehold.co/600x400/png", type: "image" }], links: [{ label: "Live Demo", url: "#" }] }
      ]
    },
    {
      email: "bob@example.com", username: "bob_business", name: "Bob Business", headline: "Product Manager", location: "New York, NY", field: "Product Management", exp: "8", skills: ["Agile", "Scrum", "Market Research", "Roadmapping"], bio: "", // Missing bio
      socials: {}, // Missing socials
      work: [{ title: "Product Manager", company: "SaaS Inc.", start: "2018-05", end: null, desc: "Managing the core product roadmap and coordinating with cross-functional teams." }],
      edu: [{ inst: "State Business School", deg: "MBA", start: "2016", end: "2018" }],
      portfolio: [{ log: "Led the launch of a new analytics feature that increased retention by 15%", category: "Product Launch", media: [], links: [] }] // Missing media and links
    },
    {
      email: "charlie@example.com", username: "charlie_eng", name: "Charlie Civil", headline: "Structural Engineer", location: "Chicago, IL", field: "Civil Engineering", exp: "3", skills: ["AutoCAD", "Structural Analysis", "Project Management"], bio: "Detail-oriented structural engineer specializing in commercial high-rises.",
      socials: { linkedin: "https://linkedin.com" },
      work: [{ title: "Junior Engineer", company: "City Builders", start: "2021-06", end: "2023-12", desc: "Assisted in the structural design of 3 major commercial buildings." }],
      edu: [{ inst: "Engineering Institute", deg: "BEng Civil Engineering", start: "2017", end: "2021" }],
      portfolio: [{ log: "Designed the load-bearing framework for the new downtown plaza", category: "Design", media: [{ url: "https://placehold.co/600x400/222222/FFF/png?text=Blueprint", type: "image" }], links: [] }]
    },
    {
      email: "dana@example.com", username: "dana_design", name: "", headline: "", location: "", field: "", exp: "0", skills: [], bio: "", // Almost entirely blank
      socials: {},
      work: [],
      edu: [],
      portfolio: []
    }
  ];

  for (const c of candidates) {
    const res = await db.execute({ sql: "INSERT INTO users (email, password, role, username) VALUES (?, ?, 'candidate', ?)", args: [c.email, defaultPassword, c.username] });
    const userId = Number(res.lastInsertRowid);
    await db.execute({
      sql: "INSERT INTO candidate_profiles (user_id, name, headline, location, field, experience_years, skills_json, socials_json, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      args: [userId, c.name, c.headline, c.location, c.field, c.exp, JSON.stringify(c.skills), JSON.stringify(c.socials), c.bio]
    });

    for (const w of c.work) {
      await db.execute({ sql: "INSERT INTO work_experience (user_id, title, company, start_date, end_date, description) VALUES (?, ?, ?, ?, ?, ?)", args: [userId, w.title, w.company, w.start, w.end, w.desc] });
    }
    for (const e of c.edu) {
      await db.execute({ sql: "INSERT INTO education (user_id, institution, degree, start_date, end_date) VALUES (?, ?, ?, ?, ?)", args: [userId, e.inst, e.deg, e.start, e.end] });
    }
    for (const p of c.portfolio) {
      await db.execute({
        sql: "INSERT INTO portfolio_entries (user_id, raw_log, polished_entry, category, media_json, links_json, entry_date) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))",
        args: [userId, p.log, p.log, p.category, JSON.stringify(p.media), JSON.stringify(p.links)]
      });
    }
  }

  console.log("Seed complete! Login with any email and password 'password123'");
}

seed().catch(console.error);
