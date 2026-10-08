export type RequestKeys = {
  jev?: string;
  openai?: string;
};

export type Configured = {
  jev: boolean;
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
    openai: resolveProviderKey(
      request.headers.get("x-openai-api-key"),
      process.env.OPENAI_API_KEY,
    ),
  };
}

export function configuredFromKeys(keys: RequestKeys): Configured {
  return {
    jev: Boolean(keys.jev),
    openai: Boolean(keys.openai),
  };
}

export function envConfigured(): Configured {
  return {
    jev: Boolean(process.env.TYPESAFE_API_KEY?.trim()),
    openai: Boolean(process.env.OPENAI_API_KEY?.trim()),
  };
}
