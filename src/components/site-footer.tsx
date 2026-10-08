const SOCIALS = [
  { label: "Website", href: "https://nehasharma.dev" },
  { label: "GitHub", href: "https://github.com/Neha" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/nehha/" },
  { label: "X", href: "https://x.com/hellonehha" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--line)] bg-[var(--bg-2)]/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-xs leading-5 text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>
          © 2026–2027 Neha Sharma. All rights reserved.
        </p>
        <nav aria-label="Author social links" className="flex flex-wrap gap-x-4 gap-y-2">
          {SOCIALS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--text)]"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
