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
    <form key={formKey} onSubmit={save} className="max-w-xl space-y-8">
      <p className="text-[19px] leading-8 text-[var(--muted)]">
        Keys stay in this browser and are sent only when you run a comparison.
        You can also put them in .env.local. A key from this page overrides env
        for that model.
      </p>
      <Field
        name="typesafe"
        label="TypeSafe · Jev"
        defaultValue={initial.typesafe}
        placeholder={env.jev ? "Env is set — paste here to override" : "sk_… or ts_…"}
        hint={env.jev ? "Server fallback is ready." : "No server fallback."}
      />
      <Field
        name="openai"
        label="OpenAI"
        defaultValue={initial.openai}
        placeholder={env.openai ? "Env is set — paste here to override" : "sk-…"}
        hint={env.openai ? "Server fallback is ready." : "No server fallback."}
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-full bg-[var(--btn)] px-8 py-3.5 text-[17px] font-semibold text-[var(--on-btn)]"
        >
          Save in this browser
        </button>
        <button
          type="button"
          onClick={clear}
          className="rounded-full bg-[var(--bg)] px-8 py-3.5 text-[17px] text-[var(--muted)] hover:text-[var(--text)]"
        >
          Clear saved keys
        </button>
        {saved ? <p className="self-center text-[17px] text-[var(--good)]">Saved.</p> : null}
      </div>
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  placeholder,
  hint,
}: {
  name: string;
  label: string;
  defaultValue: string;
  placeholder: string;
  hint: string;
}) {
  return (
    <label className="block">
      <span className="text-[17px] font-semibold">{label}</span>
      <input
        name={name}
        type="password"
        autoComplete="off"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="mt-2 h-14 w-full rounded-[18px] border border-[var(--line)] bg-[var(--panel)] px-5 text-[17px] outline-none focus:border-[var(--text)]/30"
      />
      <span className="mt-2 block text-[15px] text-[var(--muted)]">{hint}</span>
    </label>
  );
}
