import { PageShell } from "@/components/page-shell";
import { SettingsForm } from "@/components/settings-form";

export default function SettingsPage() {
  return (
    <PageShell>
      <header className="max-w-2xl">
        <h1 className="text-[52px] leading-[1.05] font-semibold tracking-tight sm:text-[64px]">
          Keys
        </h1>
        <p className="mt-6 text-[21px] leading-8 text-[var(--muted)]">
          Add API keys to run live comparisons. Nothing on this page is committed
          to the repository.
        </p>
      </header>
      <section className="rounded-[32px] bg-[var(--panel)] p-8 sm:p-10">
        <SettingsForm />
      </section>
    </PageShell>
  );
}
