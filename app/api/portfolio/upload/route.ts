import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/gif":  "gif",
  "image/webp": "webp",
};
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Only jpg, png, gif, and webp images are allowed" },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File must be smaller than 5 MB" }, { status: 400 });
  }

  const filename = `${randomUUID()}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const dest = path.join(uploadDir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(dest, buffer);

  return NextResponse.json({ url: `/uploads/${filename}` });
}
