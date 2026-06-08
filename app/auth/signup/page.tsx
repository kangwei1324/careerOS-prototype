"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);

  const [role, setRole] = useState<"candidate" | "employer">(
    (searchParams.get("role") as "candidate" | "employer") ?? "candidate"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Sign up failed"); return; }
      setUser({ userId: data.userId, role: data.role, username: data.username, name: "" });
      router.push("/onboarding");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="text-2xl font-black text-[#424242] mb-10">
        Career<span className="text-[#ffc000]">OS.</span>
      </Link>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.07)] p-8">
        <h1 className="text-[22px] font-black text-[#424242] mb-1">Create your account</h1>
        <p className="text-[13px] text-[#424242]/45 mb-7">
          Already have one?{" "}
          <Link href="/auth/signin" className="text-[#ffc000] font-bold hover:underline">
            Sign in
          </Link>
        </p>

        {/* Role toggle */}
        <div className="flex gap-2 bg-[#f7f7f7] p-1.5 rounded-xl mb-6">
          {(["candidate", "employer"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-2 rounded-lg text-[12px] font-bold capitalize transition-all ${
                role === r
                  ? "bg-white text-[#424242] shadow-sm"
                  : "text-[#424242]/45 hover:text-[#424242]"
              }`}
            >
              {r === "candidate" ? "👤 Candidate" : "🏢 Employer"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#424242]/50 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] transition-colors bg-white"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#424242]/50 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Min 6 characters"
              className="w-full border border-[#424242]/15 rounded-xl px-4 py-2.5 text-[13px] text-[#424242] outline-none focus:border-[#ffc000] transition-colors bg-white"
            />
          </div>

          {error && (
            <p className="text-[12px] text-red-500 font-medium bg-red-50 px-4 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ffc000] text-[#424242] text-[14px] font-black py-3 rounded-xl hover:bg-[#e6ac00] transition-all disabled:opacity-50 mt-2"
          >
            {loading ? "Creating account…" : "Create account →"}
          </button>
        </form>
      </div>
    </div>
  );
}
