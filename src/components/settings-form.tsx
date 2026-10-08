"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import {
  clearStoredKeys,
  emptyStoredKeys,
  readStoredKeys,
  writeStoredKeys,
  type StoredKeys,
} from "@/lib/client-keys";

type EnvConfigured = { jev: boolean; openai: boolean };

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function useStoredKeys(): StoredKeys {
  return JSON.parse(
    useSyncExternalStore(
      subscribe,
      () => JSON.stringify(readStoredKeys()),
      () => JSON.stringify(emptyStoredKeys()),
    ),
  ) as StoredKeys;
}

export function SettingsForm() {
  const initial = useStoredKeys();
  const [env, setEnv] = useState<EnvConfigured>({ jev: false, openai: false });
  const [saved, setSaved] = useState(false);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    void fetch("/api/status")
      .then((response) => response.json())
      .then((data: { env?: EnvConfigured }) => {
        if (data.env) {
          setEnv(data.env);
        }
      })
      .catch(() => undefined);
  }, []);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    writeStoredKeys({
      typesafe: String(data.get("typesafe") ?? ""),
      openai: String(data.get("openai") ?? ""),
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

  function clear() {
    clearStoredKeys();
    setFormKey((value) => value + 1);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1600);
  }

  return (
    <form key={formKey} onSubmit={save} className="mt-8 max-w-xl space-y-6">
      <p className="text-sm leading-6 text-[var(--muted)]">
        Keys saved here stay in this browser only. They are sent to this app’s
        server for each run, never written to git. You can also set
        <code className="mx-1 rounded bg-black/30 px-1.5 py-0.5 text-[var(--text)]">
          TYPESAFE_API_KEY
        </code>
        and
        <code className="mx-1 rounded bg-black/30 px-1.5 py-0.5 text-[var(--text)]">
          OPENAI_API_KEY
        </code>
        in <code className="rounded bg-black/30 px-1.5 py-0.5">.env.local</code>.
        A key from Settings overrides env for that provider.
      </p>
      <label className="block">
        <span className="text-[11px] tracking-[0.18em] text-[var(--muted)] uppercase">
          TypeSafe / Jev key
        </span>
        <input
          name="typesafe"
          type="password"
          autoComplete="off"
          defaultValue={initial.typesafe}
          placeholder={env.jev ? "Server env is set — paste here to override" : "sk_… or ts_…"}
          className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-sm outline-none focus:border-[var(--jev)]"
        />
        <span className="mt-2 block text-xs text-[var(--muted)]">
          {env.jev ? "Env fallback is configured." : "No env fallback for TypeSafe."}
        </span>
      </label>
      <label className="block">
        <span className="text-[11px] tracking-[0.18em] text-[var(--muted)] uppercase">
          OpenAI key
        </span>
        <input
          name="openai"
          type="password"
          autoComplete="off"
          defaultValue={initial.openai}
          placeholder={env.openai ? "Server env is set — paste here to override" : "sk-…"}
          className="mt-2 w-full rounded-xl border border-[var(--line)] bg-[var(--bg)] px-4 py-3 text-sm outline-none focus:border-[var(--openai)]"
        />
        <span className="mt-2 block text-xs text-[var(--muted)]">
          {env.openai ? "Env fallback is configured." : "No env fallback for OpenAI."}
        </span>
      </label>
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"
        >
          Save in this browser
        </button>
        <button
          type="button"
          onClick={clear}
          className="rounded-xl border border-[var(--line)] px-5 py-3 text-sm text-[var(--muted)] hover:text-white"
        >
          Clear saved keys
        </button>
        {saved ? <p className="self-center text-sm text-[var(--good)]">Saved.</p> : null}
      </div>
    </form>
  );
}
