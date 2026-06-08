import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { hashPassword, createSession, uniqueUsername } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password, role } = await req.json();

    if (!email || !password || !role) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (!["candidate", "employer"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    const db = getDb();

    // Check if email already exists
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashed = await hashPassword(password);
    const username = uniqueUsername(email);

    const result = db
      .prepare(
        "INSERT INTO users (email, password, role, username) VALUES (?, ?, ?, ?)"
      )
      .run(email, hashed, role, username);

    const userId = result.lastInsertRowid as number;

    // Create empty profile record
    if (role === "candidate") {
      db.prepare(
        "INSERT INTO candidate_profiles (user_id) VALUES (?)"
      ).run(userId);
    } else {
      db.prepare(
        "INSERT INTO employer_profiles (user_id) VALUES (?)"
      ).run(userId);
    }

    await createSession({ userId, role, username });

    return NextResponse.json({ userId, role, username });
  } catch (err) {
    console.error("[signup]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
