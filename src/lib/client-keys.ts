export const TYPESAFE_KEY_HEADER = "x-typesafe-api-key";
export const LAYA_KEY_HEADER = "x-laya-api-key";
export const OPENAI_KEY_HEADER = "x-openai-api-key";

const STORAGE_KEY = "jev-vs-openai.api-keys";

export type StoredKeys = {
  typesafe: string;
  laya: string;
  openai: string;
};

export function emptyStoredKeys(): StoredKeys {
  return { typesafe: "", laya: "", openai: "" };
}

export function readStoredKeys(): StoredKeys {
  if (typeof window === "undefined") {
    return emptyStoredKeys();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyStoredKeys();
    }
    const parsed = JSON.parse(raw) as Partial<StoredKeys>;
    return {
      typesafe: typeof parsed.typesafe === "string" ? parsed.typesafe : "",
      laya: typeof parsed.laya === "string" ? parsed.laya : "",
      openai: typeof parsed.openai === "string" ? parsed.openai : "",
    };
  } catch {
    return emptyStoredKeys();
  }
}

export function writeStoredKeys(keys: StoredKeys) {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      typesafe: keys.typesafe.trim(),
      laya: keys.laya.trim(),
      openai: keys.openai.trim(),
    }),
  );
}

export function clearStoredKeys() {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function apiKeyHeaders(): HeadersInit {
  const keys = readStoredKeys();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (keys.typesafe.trim()) {
    headers[TYPESAFE_KEY_HEADER] = keys.typesafe.trim();
  }
  if (keys.laya.trim()) {
    headers[LAYA_KEY_HEADER] = keys.laya.trim();
  }
  if (keys.openai.trim()) {
    headers[OPENAI_KEY_HEADER] = keys.openai.trim();
  }
  return headers;
}

export function storedConfigured(): { jev: boolean; laya: boolean; openai: boolean } {
  const keys = readStoredKeys();
  return {
    jev: Boolean(keys.typesafe.trim()),
    laya: Boolean(keys.laya.trim()),
    openai: Boolean(keys.openai.trim()),
  };
}
