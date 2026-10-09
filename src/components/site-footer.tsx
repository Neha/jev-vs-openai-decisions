const SOCIALS = [
  { label: "Website", href: "https://nehasharma.dev" },
  { label: "GitHub", href: "https://github.com/Neha" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/nehha/" },
  { label: "X", href: "https://x.com/hellonehha" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--line)]">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-3 px-6 py-8 text-[15px] leading-6 text-[var(--muted)] sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <p>© 2026–2027 Neha Sharma. All rights reserved.</p>
        <nav aria-label="Author social links" className="flex flex-wrap gap-x-5 gap-y-2">
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
