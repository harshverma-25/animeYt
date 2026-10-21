interface CacheEntry {
  data: any;
  expiry: number;
}

const clientCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<any>>();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Synchronously retrieve anime details from client-side memory if valid
 */
export function getCachedAnime(slugOrId: string): any | null {
  if (!slugOrId) return null;
  const entry = clientCache.get(slugOrId.toLowerCase());
  if (entry && entry.expiry > Date.now()) {
    return entry.data;
  }
  return null;
}

/**
 * Store anime details in client-side memory
 */
export function setCachedAnime(slugOrId: string, data: any): void {
  if (!slugOrId || !data) return;
  const key = slugOrId.toLowerCase();
  clientCache.set(key, { data, expiry: Date.now() + DEFAULT_TTL_MS });
  if (data.slug && data.slug.toLowerCase() !== key) {
    clientCache.set(data.slug.toLowerCase(), { data, expiry: Date.now() + DEFAULT_TTL_MS });
  }
  if (data.id && data.id.toLowerCase() !== key) {
    clientCache.set(data.id.toLowerCase(), { data, expiry: Date.now() + DEFAULT_TTL_MS });
  }
}

/**
 * Fetch anime details with instant client cache lookup and request deduplication
 */
export function fetchAnimeWithCache(slugOrId: string): Promise<any> {
  const key = slugOrId.toLowerCase();
  const cached = getCachedAnime(key);
  if (cached) {
    return Promise.resolve(cached);
  }

  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key)!;
  }

  const promise = (async () => {
    const res = await fetch(`/api/catalogue/${encodeURIComponent(slugOrId)}`);
    if (!res.ok) throw new Error('Anime not found');
    const data = await res.json();
    setCachedAnime(slugOrId, data);
    return data;
  })().finally(() => {
    inFlightRequests.delete(key);
  });

  inFlightRequests.set(key, promise);
  return promise;
}
