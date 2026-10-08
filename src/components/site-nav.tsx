"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteNav() {
  const pathname = usePathname();
  const compare = pathname === "/";
  const settings = pathname === "/settings";

  return (
    <nav className="flex gap-2 text-sm">
      <Link
        href="/"
        className={`rounded-full border px-3 py-1 ${
          compare
            ? "border-white/20 bg-white/10 text-white"
            : "border-[var(--line)] text-[var(--muted)] hover:text-white"
        }`}
      >
        Compare
      </Link>
      <Link
        href="/settings"
        className={`rounded-full border px-3 py-1 ${
          settings
            ? "border-white/20 bg-white/10 text-white"
            : "border-[var(--line)] text-[var(--muted)] hover:text-white"
        }`}
      >
        Settings
      </Link>
    </nav>
  );
}
