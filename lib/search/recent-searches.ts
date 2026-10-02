// Buscas recentes guardadas no aparelho (apenas termos, nunca dados pessoais).

const STORAGE_KEY = "demir-recent-searches";
const LIMIT = 6;
const CHANGE_EVENT = "demir-recent-searches-change";
const EMPTY: string[] = [];

let cachedRaw: string | null = null;
let cachedValue: string[] = EMPTY;

function readRaw() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function write(list: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Storage indisponível (modo privado): apenas não lembra.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function getRecentSearches(): string[] {
  const raw = readRaw();
  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    cachedValue = Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string").slice(0, LIMIT) : EMPTY;
  } catch {
    cachedValue = EMPTY;
  }
  return cachedValue;
}

export function getServerRecentSearches(): string[] {
  return EMPTY;
}

export function subscribeRecentSearches(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function addRecentSearch(term: string) {
  const clean = term.trim().replace(/\s+/g, " ");
  if (clean.length < 2) return;
  const next = [clean, ...getRecentSearches().filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, LIMIT);
  write(next);
}

export function removeRecentSearch(term: string) {
  write(getRecentSearches().filter((item) => item !== term));
}

export function clearRecentSearches() {
  write([]);
}
