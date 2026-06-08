import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const db = getDb();
    const user = db
      .prepare("SELECT id, password, role, username FROM users WHERE email = ?")
      .get(email) as
      | { id: number; password: string; role: string; username: string }
      | undefined;

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const payload = {
      userId: user.id,
      role: user.role as "candidate" | "employer",
      username: user.username,
    };

    await createSession(payload);

    return NextResponse.json(payload);
  } catch (err) {
    console.error("[signin]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
