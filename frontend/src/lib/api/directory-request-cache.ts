/**
 * Cache em memória (Module-scope) com TTL curto para GETs do diretório de configuração.
 * Objetivo: acelerar revisita a painéis evitando refetch imediato do mesmo URL.
 * As mutações (POST/PATCH/DELETE) devem chamar `invalidateDirectoryRequestCache`
 * com o prefixo adequado para evitar dados obsoletos após gravação.
 */

const DEFAULT_TTL_MS = 30_000;

type DirectoryCacheEntry<T> = {
  timestamp: number;
  data: T;
};

const cacheStore = new Map<string, DirectoryCacheEntry<unknown>>();

export type CachedDirectoryResult<T> = {
  ok: boolean;
  status: number;
  data: T | null;
  fromCache: boolean;
};

/**
 * Faz GET em `url` retornando o JSON parseado. Serve dado em cache se dentro do TTL.
 * Só armazena respostas ok (status 2xx) com payload válido.
 */
export async function cachedDirectoryJsonFetch<T>(
  url: string,
  options?: { ttlMs?: number; bypassCache?: boolean }
): Promise<CachedDirectoryResult<T>> {
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS;
  const bypassCache = options?.bypassCache ?? false;

  if (!bypassCache) {
    const cached = cacheStore.get(url) as DirectoryCacheEntry<T> | undefined;
    if (cached != null && Date.now() - cached.timestamp < ttlMs) {
      return { ok: true, status: 200, data: cached.data, fromCache: true };
    }
  }

  try {
    const response = await fetch(url);
    const data = (await response.json().catch(() => null)) as T | null;
    if (response.ok && data != null) {
      cacheStore.set(url, { timestamp: Date.now(), data });
    }
    return {
      ok: response.ok,
      status: response.status,
      data,
      fromCache: false
    };
  } catch {
    return { ok: false, status: 0, data: null, fromCache: false };
  }
}

/**
 * Remove entradas cujo URL começa com `prefix`. Sem argumento limpa tudo.
 */
export function invalidateDirectoryRequestCache(prefix?: string): void {
  if (!prefix) {
    cacheStore.clear();
    return;
  }
  for (const key of Array.from(cacheStore.keys())) {
    if (key.startsWith(prefix)) {
      cacheStore.delete(key);
    }
  }
}
