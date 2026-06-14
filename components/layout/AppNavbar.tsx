"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

// ── Nav link helper ───────────────────────────────────────────────

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`text-[12px] font-bold px-3 py-1.5 rounded-full transition-all ${
        isActive
          ? "text-[#424242] bg-white shadow-sm"
          : "text-[#424242]/60 hover:text-[#424242] hover:bg-white/70"
      }`}
    >
      {children}
    </Link>
  );
}

// ── AppNavbar ─────────────────────────────────────────────────────

export default function AppNavbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const candidateLinks = [
    { href: "/dashboard",        label: "Dashboard" },
    { href: `/portfolio/${user?.username}`, label: "Profile" },
    { href: "/portfolio/manage", label: "Portfolio" },
    { href: "/explore",          label: "Explore" },
  ];

  const employerLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/talent",    label: "Browse Talent" },
    { href: "/offers",    label: "Sent Offers" },
  ];

  const navLinks = user?.role === "candidate" ? candidateLinks : employerLinks;

  return (
    <header>
      <nav
        role="navigation"
        aria-label="Main navigation"
        className="sticky top-0 z-40 bg-[#f7f7f7]/90 backdrop-blur border-b border-[#424242]/8 px-6 py-3.5"
      >
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="text-xl font-black tracking-tight text-[#424242]"
          >
            Career<span className="text-[#ffc000]">OS.</span>
          </Link>

          {/* Center prominent button for candidate */}
          {user?.role === "candidate" && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden sm:block">
              <Link
                href="/portfolio/log"
                className="bg-[#ffc000] text-[#424242] px-5 py-2 rounded-full text-[13px] font-black hover:bg-[#e6ac00] hover:scale-105 active:scale-95 transition-all shadow-sm"
              >
                + Log an Activity
              </Link>
            </div>
          )}

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1">
            {user && navLinks.map((link) => (
              <NavLink key={link.href} href={link.href}>
                {link.label}
              </NavLink>
            ))}
            {/* Company Profile — employers only */}
            {user?.role === "employer" && (
              <NavLink href={`/company/${user.username}`}>
                Company Profile
              </NavLink>
            )}
            {user && (
              <button
                onClick={handleLogout}
                className="text-[12px] font-bold ml-2 px-3 py-1.5 rounded-full text-red-600 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
              >
                Sign out
              </button>
            )}
            {!user && (
              <>
                <Link
                  href="/auth/signin"
                  className="text-[12px] font-bold text-[#424242]/60 hover:text-[#424242] px-3 py-1.5 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  className="text-[12px] font-black bg-[#424242] text-white px-4 py-2 rounded-full hover:bg-[#333] transition-all"
                >
                  Get started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden p-2 rounded-lg hover:bg-[#424242]/8 transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            <span className="block w-5 h-0.5 bg-[#424242] mb-1 transition-all" />
            <span className="block w-5 h-0.5 bg-[#424242] mb-1 transition-all" />
            <span className="block w-5 h-0.5 bg-[#424242] transition-all" />
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="sm:hidden mt-3 pb-2 border-t border-[#424242]/8 pt-3 flex flex-col gap-1 animate-fade-in">
            {user?.role === "candidate" && (
              <Link
                href="/portfolio/log"
                className="text-center bg-[#ffc000] text-[#424242] px-4 py-2.5 rounded-full text-[13px] font-black hover:bg-[#e6ac00] mb-2 mx-2 shadow-sm transition-all"
              >
                + Log an Activity
              </Link>
            )}
            {user && navLinks.map((link) => (
              <NavLink key={link.href} href={link.href}>
                {link.label}
              </NavLink>
            ))}
            {/* Company Profile — employers only */}
            {user?.role === "employer" && (
              <NavLink href={`/company/${user.username}`}>
                Company Profile
              </NavLink>
            )}
            {user && (
              <button
                onClick={handleLogout}
                className="text-left text-[12px] font-bold mt-1 px-3 py-1.5 rounded-full text-red-600 hover:bg-red-500 hover:text-white transition-all"
              >
                Sign out
              </button>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
