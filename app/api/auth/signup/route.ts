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
    const existing = (await db.execute({ sql: "SELECT id FROM users WHERE email = ?", args: [email] })).rows[0];
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashed = await hashPassword(password);
    const username = await uniqueUsername(email);

    const result = await db.execute({ sql: "INSERT INTO users (email, password, role, username) VALUES (?, ?, ?, ?)", args: [email, hashed, role, username] });

    const userId = Number(result.lastInsertRowid);

    // Create empty profile record
    if (role === "candidate") {
      await db.execute({ sql: "INSERT INTO candidate_profiles (user_id) VALUES (?)", args: [userId] });
    } else {
      await db.execute({ sql: "INSERT INTO employer_profiles (user_id) VALUES (?)", args: [userId] });
    }

    await createSession({ userId, role, username });

    return NextResponse.json({ userId, role, username });
  } catch (err) {
    console.error("[signup]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
