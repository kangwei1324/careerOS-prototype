import crypto from "crypto";
import { cookies } from "next/headers";
import { getDb } from "./db";

const SESSION_COOKIE = "careeros_session";
const SECRET = process.env.SESSION_SECRET || "careeros-dev-secret-change-in-prod";

// ── Password hashing (scrypt) ────────────────────────────────────
export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, derived) => {
      if (err) reject(err);
      else resolve(`${salt}:${derived.toString("hex")}`);
    });
  });
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, stored] = hash.split(":");
    crypto.scrypt(password, salt, 64, (err, derived) => {
      if (err) reject(err);
      else resolve(derived.toString("hex") === stored);
    });
  });
}

// ── Session cookie (signed payload) ─────────────────────────────
interface SessionPayload {
  userId: number;
  role: "candidate" | "employer";
  username: string;
}

function sign(payload: SessionPayload): string {
  const data = JSON.stringify(payload);
  const sig = crypto
    .createHmac("sha256", SECRET)
    .update(data)
    .digest("hex");
  return Buffer.from(data).toString("base64") + "." + sig;
}

function verify(token: string): SessionPayload | null {
  try {
    const [b64, sig] = token.split(".");
    const data = Buffer.from(b64, "base64").toString();
    const expected = crypto
      .createHmac("sha256", SECRET)
      .update(data)
      .digest("hex");
    if (sig !== expected) return null;
    return JSON.parse(data) as SessionPayload;
  } catch {
    return null;
  }
}

// ── Public helpers ───────────────────────────────────────────────
export async function createSession(payload: SessionPayload) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sign(payload), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verify(token);
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// ── Username generation ──────────────────────────────────────────
export function generateUsername(email: string): string {
  const base = email.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase();
  const suffix = Math.floor(Math.random() * 900 + 100);
  return `${base}${suffix}`;
}

// ── Ensure unique username ───────────────────────────────────────
export function uniqueUsername(email: string): string {
  const db = getDb();
  let username = generateUsername(email);
  while (db.prepare("SELECT id FROM users WHERE username = ?").get(username)) {
    username = generateUsername(email);
  }
  return username;
}
