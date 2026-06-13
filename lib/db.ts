import { createClient, Client } from "@libsql/client";
import path from "path";
import fs from "fs";

let _db: Client | null = null;
let _schemaInitialized = false;

export function getDb(): Client {
  if (_db) return _db;
  
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url) {
    _db = createClient({ url, authToken });
  } else {
    // Fallback to local SQLite file
    const DATA_DIR = path.join(process.cwd(), "data");
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    
    _db = createClient({ url: `file:${path.join(DATA_DIR, "careeros.db")}` });
  }

  return _db;
}

// ── Schema ───────────────────────────────────────────────────────
export async function initDbSchema(): Promise<void> {
  if (_schemaInitialized) return;
  const db = getDb();

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      email       TEXT    NOT NULL UNIQUE,
      password    TEXT    NOT NULL,
      role        TEXT    NOT NULL CHECK(role IN ('candidate','employer')),
      username    TEXT    NOT NULL UNIQUE,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS candidate_profiles (
      user_id     INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      name        TEXT    NOT NULL DEFAULT '',
      headline    TEXT    NOT NULL DEFAULT '',
      location    TEXT    NOT NULL DEFAULT '',
      field       TEXT    NOT NULL DEFAULT '',
      experience_years INTEGER NOT NULL DEFAULT 0,
      skills_json TEXT    NOT NULL DEFAULT '[]',
      bio         TEXT    NOT NULL DEFAULT '',
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS employer_profiles (
      user_id      INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      company_name TEXT    NOT NULL DEFAULT '',
      industry     TEXT    NOT NULL DEFAULT '',
      location     TEXT    NOT NULL DEFAULT '',
      description  TEXT    NOT NULL DEFAULT '',
      updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS portfolio_entries (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      raw_log         TEXT    NOT NULL,
      polished_entry  TEXT    NOT NULL DEFAULT '',
      category        TEXT    NOT NULL DEFAULT 'Other',
      entry_date      TEXT    NOT NULL,
      skills_json     TEXT    NOT NULL DEFAULT '[]',
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS work_experience (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title       TEXT    NOT NULL,
      company     TEXT    NOT NULL,
      start_date  TEXT    NOT NULL,
      end_date    TEXT,
      description TEXT    NOT NULL DEFAULT '',
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS education (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      institution TEXT    NOT NULL,
      degree      TEXT    NOT NULL,
      start_date  TEXT    NOT NULL,
      end_date    TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS honours_awards (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title      TEXT    NOT NULL,
      issuer     TEXT    NOT NULL DEFAULT '',
      award_date TEXT    NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS employer_interests (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      employer_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(employer_id, candidate_id)
    );

    CREATE TABLE IF NOT EXISTS profile_views (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      viewer_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
      candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      viewed_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Safe migrations
  const migrations = [
    `ALTER TABLE employer_profiles ADD COLUMN location TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE candidate_profiles ADD COLUMN socials_json TEXT NOT NULL DEFAULT '{}'`,
    `ALTER TABLE employer_profiles ADD COLUMN socials_json TEXT NOT NULL DEFAULT '{}'`,
    `ALTER TABLE employer_profiles ADD COLUMN company_description TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE portfolio_entries ADD COLUMN media_json TEXT NOT NULL DEFAULT '[]'`,
    `ALTER TABLE portfolio_entries ADD COLUMN links_json TEXT NOT NULL DEFAULT '[]'`,
    `ALTER TABLE portfolio_entries ADD COLUMN pinned_type TEXT`,
    `ALTER TABLE portfolio_entries ADD COLUMN pinned_id INTEGER`,
    `
      CREATE TABLE IF NOT EXISTS employer_offers (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        employer_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        candidate_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        offer_type   TEXT    NOT NULL,
        field        TEXT    NOT NULL,
        role_name    TEXT    NOT NULL,
        min_salary   INTEGER,
        max_salary   INTEGER,
        status       TEXT    NOT NULL DEFAULT 'pending',
        created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS ai_suggestions (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        employer_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        candidate_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reason           TEXT    NOT NULL,
        description_hash TEXT    NOT NULL,
        created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
      )
    `
  ];

  for (const m of migrations) {
    try {
      await db.execute(m);
    } catch (e) {
      // Ignore existing column errors
    }
  }

  _schemaInitialized = true;
}
