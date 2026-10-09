"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteNav() {
  const pathname = usePathname();
  const compare = pathname === "/";
  const settings = pathname === "/settings";

  return (
    <nav className="flex items-center gap-1 text-[17px]">
      <Link
        href="/"
        className={`rounded-full px-4 py-2 ${
          compare ? "bg-[var(--text)] text-[var(--on-btn)]" : "text-[var(--muted)] hover:text-[var(--text)]"
        }`}
      >
        Board
      </Link>
      <Link
        href="/settings"
        className={`rounded-full px-4 py-2 ${
          settings ? "bg-[var(--text)] text-[var(--on-btn)]" : "text-[var(--muted)] hover:text-[var(--text)]"
        }`}
      >
        Keys
      </Link>
    </nav>
  );
}
