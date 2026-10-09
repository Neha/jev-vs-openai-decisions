import type { ReactNode } from "react";
import { SiteFooter } from "./site-footer";
import { SiteNav } from "./site-nav";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--bg)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1120px] items-center justify-end px-6 py-4 sm:px-10">
          <SiteNav />
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col gap-16 px-6 py-14 sm:px-10 sm:py-20">
        {children}
      </div>
      <SiteFooter />
    </div>
  );
}
