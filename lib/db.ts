import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// ── DB file lives in project root /data/ ────────────────────────
const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, "careeros.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  initSchema(_db);
  return _db;
}

// ── Schema ───────────────────────────────────────────────────────
function initSchema(db: Database.Database) {
  db.exec(`
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

  // ── Safe migration: add location to employer_profiles if missing ──
  try {
    db.exec(`ALTER TABLE employer_profiles ADD COLUMN location TEXT NOT NULL DEFAULT ''`);
  } catch {
    // Column already exists — ignore
  }
}
