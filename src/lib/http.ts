export function extractError(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const error = record.error;
    if (typeof error === "string" && error.trim()) {
      return error;
    }
    if (error && typeof error === "object") {
      const message = (error as Record<string, unknown>).message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }
    if (typeof record.detail === "string" && record.detail.trim()) {
      return record.detail;
    }
  }
  return `HTTP ${status}`;
}

export async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return {};
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { message: text.slice(0, 300) };
  }
}

export function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

export function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}
