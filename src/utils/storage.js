// Safe localStorage wrappers used to persist raffle progress across page
// reloads and crashes. We intentionally swallow errors:
//
//   * Safari private mode and certain enterprise policies throw on any write.
//   * Quota exceeded (5 MB) can throw on writes too.
//
// In every error case the raffle still works in-memory — persistence is a
// best-effort safety net, not a hard requirement.
//
// Keys are versioned (suffix `:v1`) so we can change the persisted shape
// later without booby-trapping users with stale data.

const PREFIX = 'raffle-spinner';
const VERSION = 'v1';

function key(name) {
  return `${PREFIX}:${VERSION}:${name}`;
}

export function loadJson(name, fallback = null) {
  if (typeof window === 'undefined' || !window.localStorage) return fallback;
  try {
    const raw = window.localStorage.getItem(key(name));
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch {
    return fallback;
  }
}

export function saveJson(name, value) {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    window.localStorage.setItem(key(name), JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(name) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(key(name));
  } catch {
    /* ignore */
  }
}

// Wipe every key this app owns. Used by the "Start fresh" action so we don't
// leave orphaned data behind (e.g. if we add more keys in the future).
export function clearAll() {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const prefix = `${PREFIX}:${VERSION}:`;
    const toRemove = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(prefix)) toRemove.push(k);
    }
    toRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
