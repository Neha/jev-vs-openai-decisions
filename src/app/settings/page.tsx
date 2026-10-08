import { SiteNav } from "@/components/site-nav";
import { SettingsForm } from "@/components/settings-form";

export default function SettingsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8">
      <header className="flex flex-col gap-4 border-b border-[var(--line)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Settings</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Add API keys to run live comparisons. Nothing on this page is committed
            to the repository.
          </p>
        </div>
        <SiteNav />
      </header>
      <SettingsForm />
    </main>
  );
}
