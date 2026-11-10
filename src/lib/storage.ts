/**
 * Safe storage wrapper that protects against SecurityErrors, restricted iframes,
 * disabled cookies, or private browsing mode where window.localStorage throws.
 */

const memoryStore = new Map<string, string>();

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Access denied or blocked by iframe sandbox
    }
    return memoryStore.get(key) ?? null;
  },

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Access denied or quota exceeded
    }
    memoryStore.set(key, value);
  },

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Access denied
    }
    memoryStore.delete(key);
  },

  clear(): void {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window && window.localStorage) {
        window.localStorage.clear();
      }
    } catch {
      // Access denied
    }
    memoryStore.clear();
  },
};
