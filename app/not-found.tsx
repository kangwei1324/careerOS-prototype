import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page not found — CareerOS",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f7f7f7] flex flex-col items-center justify-center px-6 text-center">
      <div className="text-[#ffc000] text-[11px] font-black uppercase tracking-widest mb-4">
        404
      </div>
      <h1 className="text-[32px] font-black text-[#424242] mb-3 leading-tight">
        Page not found
      </h1>
      <p className="text-[14px] text-[#424242]/50 mb-8 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="bg-[#ffc000] text-[#424242] text-[13px] font-black px-6 py-3 rounded-full hover:bg-[#e6ac00] transition-all"
      >
        ← Back to dashboard
      </Link>
      <Link
        href="/"
        className="mt-4 text-[12px] text-[#424242]/40 hover:text-[#424242] transition-colors"
      >
        Or go to homepage
      </Link>
      <div className="mt-12 text-xl font-black text-[#424242]">
        Career<span className="text-[#ffc000]">OS.</span>
      </div>
    </div>
  );
}
