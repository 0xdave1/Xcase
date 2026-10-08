const globalIdempotency = globalThis as typeof globalThis & {
  __xcaseIdempotencyCache?: Map<string, unknown>;
};

const cache = globalIdempotency.__xcaseIdempotencyCache ??
  (globalIdempotency.__xcaseIdempotencyCache = new Map<string, unknown>());

export function getIdempotencyKey(request: Request) {
  return request.headers.get("x-idempotency-key")?.trim();
}

export async function withIdempotency<T>(
  key: string | undefined,
  scope: string,
  action: () => Promise<T> | T,
): Promise<{ reused: boolean; value: T }> {
  if (!key) {
    return { reused: false, value: await action() };
  }

  const scopedKey = `${scope}:${key}`;
  const existing = cache.get(scopedKey);
  if (existing) {
    return { reused: true, value: existing as T };
  }

  const value = await action();
  cache.set(scopedKey, value);
  return { reused: false, value };
}
