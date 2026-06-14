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
    { email: "hr@petronas.com", username: "petronas_dig", name: "Petronas Digital", industry: "Technology", location: "Kuala Lumpur, Malaysia", desc: "Looking for a Senior Full Stack Engineer with strong experience in Node.js, React, and building scalable backend architectures.", cDesc: "We build scalable cloud solutions for the modern enterprise in Malaysia.", socials: { website: "#", linkedin: "https://linkedin.com" } },
    { email: "careers@maybank.com", username: "maybank_inv", name: "Maybank Investment", industry: "Finance / Business", location: "Kuala Lumpur, Malaysia", desc: "Top-tier investment banking and asset management.", cDesc: "", socials: {} }, // Missing cDesc and socials
    { email: "jobs@gamuda.com", username: "gamuda_eng", name: "Gamuda Engineering", industry: "Civil Engineering", location: "Petaling Jaya, Selangor", desc: "We are seeking a detail-oriented Structural Engineer with expertise in AutoCAD and commercial high-rises.", cDesc: "Specializing in large-scale commercial infrastructure across Southeast Asia.", socials: { website: "#" } },
    { email: "hello@doctor2u.my", username: "doctor2u", name: "Doctor2U", industry: "Healthcare IT", location: "", desc: "Digital health records and telemedicine.", cDesc: "", socials: {} } // Missing location, cDesc, socials
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
      email: "aisyah@example.com", username: "aisyah_dev", name: "Aisyah Rahman", headline: "Senior Full Stack Engineer", location: "Batu Pahat, Johor", field: "Software Engineering", exp: "5", skills: ["React", "Node.js", "TypeScript", "SQL"], bio: "Passionate about building scalable web applications and intuitive user interfaces.",
      socials: { github: "https://github.com", linkedin: "https://linkedin.com", website: "#" },
      work: [{ title: "Software Engineer", company: "GrabTech Malaysia", start: "2020-01", end: "2024-01", desc: "Developed microservices in Node.js and led the frontend migration to React." }],
      edu: [{ inst: "University of Malaya", deg: "BSc Computer Science", start: "2016", end: "2020" }],
      portfolio: [
        { log: "Built a distributed caching system using Redis", category: "Backend", media: [], links: [{ label: "GitHub Repo", url: "https://github.com" }] },
        { log: "Created a responsive dashboard using Tailwind and React", category: "Frontend", media: [{ url: "https://placehold.co/600x400/png", type: "image" }], links: [{ label: "Live Demo", url: "#" }] }
      ]
    },
    {
      email: "weijie@example.com", username: "weijie_pm", name: "Lim Wei Jie", headline: "Product Manager", location: "George Town, Penang", field: "Product Management", exp: "8", skills: ["Agile", "Scrum", "Market Research", "Roadmapping"], bio: "", // Missing bio
      socials: {}, // Missing socials
      work: [{ title: "Product Manager", company: "SaaS Sdn Bhd", start: "2018-05", end: null, desc: "Managing the core product roadmap and coordinating with cross-functional teams." }],
      edu: [{ inst: "Universiti Sains Malaysia", deg: "MBA", start: "2016", end: "2018" }],
      portfolio: [{ log: "Led the launch of a new analytics feature that increased retention by 15%", category: "Product Launch", media: [], links: [] }] // Missing media and links
    },
    {
      email: "muthu@example.com", username: "muthu_eng", name: "Muthusamy Civil", headline: "Structural Engineer", location: "Petaling Jaya, Selangor", field: "Civil Engineering", exp: "3", skills: ["AutoCAD", "Structural Analysis", "Project Management"], bio: "Detail-oriented structural engineer specializing in commercial high-rises.",
      socials: { linkedin: "https://linkedin.com" },
      work: [{ title: "Junior Engineer", company: "Sunway Construction", start: "2021-06", end: "2023-12", desc: "Assisted in the structural design of 3 major commercial buildings." }],
      edu: [{ inst: "Universiti Teknologi Malaysia", deg: "BEng Civil Engineering", start: "2017", end: "2021" }],
      portfolio: [{ log: "Designed the load-bearing framework for the new downtown plaza", category: "Design", media: [{ url: "https://placehold.co/600x400/222222/FFF/png?text=Blueprint", type: "image" }], links: [] }]
    },
    {
      email: "siti@example.com", username: "siti_design", name: "", headline: "", location: "", field: "", exp: "0", skills: [], bio: "", // Almost entirely blank
      socials: {},
      work: [],
      edu: [],
      portfolio: []
    },
    {
      email: "ahmad.faris@example.com", username: "ahmad_sec", name: "Ahmad Faris", headline: "Cyber Security Analyst", location: "Cyberjaya, Selangor", field: "Cyber Security", exp: "4", skills: ["Penetration Testing", "Network Security", "Python", "SIEM"], bio: "Dedicated to securing enterprise networks and identifying vulnerabilities before they can be exploited.",
      socials: { linkedin: "https://linkedin.com", github: "https://github.com" },
      work: [{ title: "Security Consultant", company: "SecureTech MY", start: "2020-03", end: "2024-02", desc: "Conducted security audits and managed incident responses." }],
      edu: [{ inst: "Multimedia University", deg: "BSc IT Security", start: "2016", end: "2020" }],
      portfolio: [{ log: "Published a CVE regarding a vulnerability in a popular open-source library", category: "Security Research", media: [], links: [{ label: "CVE Detail", url: "#" }] }]
    },
    {
      email: "peisan.wong@example.com", username: "peisan_ds", name: "Wong Pei San", headline: "Senior Data Scientist", location: "Kuala Lumpur, Malaysia", field: "Data Science", exp: "6", skills: ["Python", "Machine Learning", "SQL", "Tableau"], bio: "Turning complex data into actionable business insights using advanced predictive modeling.",
      socials: { linkedin: "https://linkedin.com" },
      work: [{ title: "Data Scientist", company: "DataX Analytics", start: "2019-01", end: "2024-03", desc: "Developed churn prediction models and optimized pricing strategies." }],
      edu: [{ inst: "University of Nottingham Malaysia", deg: "MSc Data Science", start: "2017", end: "2018" }],
      portfolio: [{ log: "Won 1st place in the MY Big Data Hackathon", category: "Hackathon", media: [], links: [] }]
    },
    {
      email: "karthik.raj@example.com", username: "karthik_cloud", name: "Karthik Raj", headline: "Cloud Solutions Architect", location: "Bayan Lepas, Penang", field: "Cloud Computing", exp: "7", skills: ["AWS", "Kubernetes", "Terraform", "Docker"], bio: "AWS Certified Solutions Architect designing highly available cloud infrastructure.",
      socials: { linkedin: "https://linkedin.com", github: "https://github.com" },
      work: [{ title: "Cloud Engineer", company: "CloudNet Malaysia", start: "2017-06", end: "2024-01", desc: "Migrated on-premise infrastructure to AWS, reducing costs by 30%." }],
      edu: [{ inst: "Universiti Sains Malaysia", deg: "BEng Computer Engineering", start: "2013", end: "2017" }],
      portfolio: [{ log: "Implemented a multi-region active-active failover architecture", category: "Infrastructure", media: [], links: [] }]
    },
    {
      email: "nurul.huda@example.com", username: "nurul_ux", name: "Nurul Huda", headline: "UX/UI Designer", location: "Shah Alam, Selangor", field: "Design", exp: "5", skills: ["Figma", "User Research", "Prototyping", "Adobe CC"], bio: "Creating human-centric digital experiences that are both beautiful and highly functional.",
      socials: { website: "#", linkedin: "https://linkedin.com" },
      work: [{ title: "Lead Product Designer", company: "Creative Minds Hub", start: "2020-05", end: "2024-04", desc: "Led the redesign of the flagship mobile app resulting in a 40% increase in user engagement." }],
      edu: [{ inst: "UiTM", deg: "BA Graphic Design", start: "2015", end: "2019" }],
      portfolio: [{ log: "Published a comprehensive UX case study on e-commerce checkout flows", category: "Case Study", media: [{ url: "https://placehold.co/600x400/png", type: "image" }], links: [{ label: "Behance", url: "#" }] }]
    },
    {
      email: "chong.weilun@example.com", username: "weilun_mobile", name: "Chong Wei Lun", headline: "iOS Developer", location: "Subang Jaya, Selangor", field: "Mobile Development", exp: "4", skills: ["Swift", "Objective-C", "iOS SDK", "CoreData"], bio: "Passionate iOS developer with a track record of building top-charting apps in the App Store.",
      socials: { github: "https://github.com", linkedin: "https://linkedin.com" },
      work: [{ title: "Mobile Developer", company: "AppWorks Asia", start: "2020-08", end: "2024-02", desc: "Developed and maintained 3 high-traffic lifestyle apps." }],
      edu: [{ inst: "Monash University Malaysia", deg: "BSc Software Engineering", start: "2016", end: "2020" }],
      portfolio: [{ log: "Launched a personal finance tracker app with 50k+ downloads", category: "Personal Project", media: [], links: [{ label: "App Store", url: "#" }] }]
    },
    {
      email: "aishah.devops@example.com", username: "aishah_devops", name: "Siti Aishah", headline: "DevOps Engineer", location: "Kuala Lumpur, Malaysia", field: "DevOps", exp: "6", skills: ["CI/CD", "Jenkins", "Ansible", "Linux"], bio: "Streamlining deployment pipelines and automating infrastructure provisioning.",
      socials: { linkedin: "https://linkedin.com" },
      work: [{ title: "DevOps Engineer", company: "FinTech Malaysia", start: "2018-09", end: "2024-01", desc: "Managed CI/CD pipelines and Kubernetes clusters for trading platforms." }],
      edu: [{ inst: "Universiti Kebangsaan Malaysia", deg: "BSc Computer Science", start: "2014", end: "2018" }],
      portfolio: [{ log: "Automated the entire infrastructure provisioning process using Terraform", category: "Automation", media: [], links: [] }]
    },
    {
      email: "ariff.mktg@example.com", username: "ariff_marketing", name: "Ariff Johari", headline: "Digital Marketing Manager", location: "Petaling Jaya, Selangor", field: "Marketing", exp: "7", skills: ["SEO", "Content Strategy", "Google Analytics", "Paid Social"], bio: "Driving growth through data-driven digital marketing strategies.",
      socials: { linkedin: "https://linkedin.com" },
      work: [{ title: "Marketing Manager", company: "GrowthX", start: "2019-02", end: "2024-03", desc: "Managed a $500k ad spend and increased lead generation by 150%." }],
      edu: [{ inst: "Sunway University", deg: "BA Business & Marketing", start: "2014", end: "2018" }],
      portfolio: [{ log: "Led a viral social media campaign that generated 2M impressions", category: "Campaign", media: [], links: [] }]
    },
    {
      email: "weisheng.finance@example.com", username: "weisheng_fa", name: "Lee Wei Sheng", headline: "Financial Analyst", location: "Kuala Lumpur, Malaysia", field: "Finance", exp: "5", skills: ["Financial Modeling", "Excel", "Corporate Finance", "Valuation"], bio: "Detail-oriented analyst with expertise in financial modeling and investment valuation.",
      socials: { linkedin: "https://linkedin.com" },
      work: [{ title: "Investment Analyst", company: "KL Capital", start: "2019-07", end: "2024-04", desc: "Performed financial modeling and due diligence for M&A transactions." }],
      edu: [{ inst: "Taylor's University", deg: "BSc Finance", start: "2015", end: "2019" }],
      portfolio: [{ log: "Published a comprehensive industry report on the tech sector", category: "Research", media: [], links: [] }]
    },
    {
      email: "divya.research@example.com", username: "divya_bio", name: "Divya Nair", headline: "Biomedical Researcher", location: "Serdang, Selangor", field: "Biomedical Science", exp: "4", skills: ["Molecular Biology", "Data Analysis", "PCR", "Cell Culture"], bio: "Researching novel therapeutic targets for infectious diseases.",
      socials: { linkedin: "https://linkedin.com" },
      work: [{ title: "Research Associate", company: "Institute for Medical Research", start: "2020-01", end: "2024-05", desc: "Conducted experiments and analyzed data for a dengue fever study." }],
      edu: [{ inst: "Universiti Putra Malaysia", deg: "MSc Biomedical Sciences", start: "2018", end: "2020" }],
      portfolio: [{ log: "Co-authored a paper in the Journal of Virology", category: "Publication", media: [], links: [{ label: "Read Paper", url: "#" }] }]
    },
    {
      email: "amirul.mech@example.com", username: "amirul_eng", name: "Amirul Amin", headline: "Mechanical Design Engineer", location: "Prai, Penang", field: "Mechanical Engineering", exp: "6", skills: ["SolidWorks", "FEA", "Thermodynamics", "Manufacturing"], bio: "Designing efficient mechanical systems for the automotive industry.",
      socials: { linkedin: "https://linkedin.com" },
      work: [{ title: "Design Engineer", company: "AutoParts MY", start: "2018-03", end: "2024-02", desc: "Designed and prototyped cooling systems for electric vehicles." }],
      edu: [{ inst: "Universiti Tenaga Nasional", deg: "BEng Mechanical Engineering", start: "2013", end: "2017" }],
      portfolio: [{ log: "Patented a new heat exchanger design", category: "Patent", media: [], links: [] }]
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
