export type RequestKeys = {
  jev?: string;
  laya?: string;
  openai?: string;
};

export type Configured = {
  jev: boolean;
  laya: boolean;
  openai: boolean;
};

export function resolveProviderKey(
  headerValue: string | null | undefined,
  envValue: string | undefined,
): string | undefined {
  const header = headerValue?.trim();
  if (header) {
    return header;
  }
  const env = envValue?.trim();
  return env || undefined;
}

export function keysFromRequest(request: Request): RequestKeys {
  return {
    jev: resolveProviderKey(
      request.headers.get("x-typesafe-api-key"),
      process.env.TYPESAFE_API_KEY,
    ),
    laya: resolveProviderKey(
      request.headers.get("x-laya-api-key"),
      process.env.LAYA_API_KEY,
    ),
    openai: resolveProviderKey(
      request.headers.get("x-openai-api-key"),
      process.env.OPENAI_API_KEY,
    ),
  };
}

export function configuredFromKeys(keys: RequestKeys): Configured {
  return {
    jev: Boolean(keys.jev),
    laya: Boolean(keys.laya),
    openai: Boolean(keys.openai),
  };
}

export function envConfigured(): Configured {
  return {
    jev: Boolean(process.env.TYPESAFE_API_KEY?.trim()),
    laya: Boolean(process.env.LAYA_API_KEY?.trim()),
    openai: Boolean(process.env.OPENAI_API_KEY?.trim()),
  };
}
