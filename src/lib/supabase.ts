import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { safeStorage } from './storage';

const STORAGE_KEY_CONFIG = 'myspace_supabase_config';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

function getEnvSupabaseConfig(): { url: string; anonKey: string; isProd: boolean } {
  let envUrl = '';
  let envKey = '';
  let isProd = false;

  try {
    const metaEnv = typeof import.meta !== 'undefined' && (import.meta as any)?.env;
    if (metaEnv) {
      envUrl = typeof metaEnv.VITE_SUPABASE_URL === 'string' ? metaEnv.VITE_SUPABASE_URL.trim() : '';
      envKey = typeof metaEnv.VITE_SUPABASE_ANON_KEY === 'string' ? metaEnv.VITE_SUPABASE_ANON_KEY.trim() : '';
      isProd = Boolean(metaEnv.PROD);
    }
  } catch {
    // ignore
  }

  return { url: envUrl, anonKey: envKey, isProd };
}

/**
 * Rejects placeholder strings and ensures secret / service_role keys are never accepted in frontend code.
 */
export function isForbiddenSecretKey(key: string): boolean {
  const trimmed = (key || '').trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('sb_secret_')) return true;

  // Inspect JWT payload role claim (without verifying signature) to block accidental service_role keys
  const parts = trimmed.split('.');
  if (parts.length === 3) {
    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = atob(base64);
      const payload = JSON.parse(json);
      if (payload?.role === 'service_role' || payload?.role === 'supabase_admin') {
        return true;
      }
    } catch {
      // non-JWT publishable keys (sb_publishable_...) are allowed
    }
  }

  return false;
}

export function isValidSupabaseConfig(config: Partial<SupabaseConfig> | null | undefined): config is SupabaseConfig {
  if (!config || typeof config.url !== 'string' || typeof config.anonKey !== 'string') {
    return false;
  }

  const url = config.url.trim();
  const anonKey = config.anonKey.trim();

  if (
    !url ||
    !anonKey ||
    url.includes('your-project') ||
    anonKey.includes('your-anon-key')
  ) {
    return false;
  }

  if (isForbiddenSecretKey(anonKey)) {
    console.error('Blocked privileged Supabase key in frontend configuration.');
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function isProductionEnvConfigured(): boolean {
  const env = getEnvSupabaseConfig();
  return env.isProd && isValidSupabaseConfig({ url: env.url, anonKey: env.anonKey });
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  const env = getEnvSupabaseConfig();
  const envConfig: SupabaseConfig = { url: env.url, anonKey: env.anonKey };

  // In production, always prioritise Vercel / Vite environment variables and never allow
  // stale browser-stored configuration to override production credentials.
  if (env.isProd) {
    if (isValidSupabaseConfig(envConfig)) {
      try {
        safeStorage.removeItem(STORAGE_KEY_CONFIG);
      } catch {
        // ignore
      }
      return envConfig;
    }
    return { url: '', anonKey: '' };
  }

  // Outside production, still prioritise valid environment variables when provided
  if (isValidSupabaseConfig(envConfig)) {
    return envConfig;
  }

  // Optional non-production browser fallback for local testing when env vars are unset
  try {
    const stored = safeStorage.getItem(STORAGE_KEY_CONFIG);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        const candidate: SupabaseConfig = {
          url: typeof parsed.url === 'string' ? parsed.url.trim() : '',
          anonKey: typeof parsed.anonKey === 'string' ? parsed.anonKey.trim() : '',
        };
        if (isValidSupabaseConfig(candidate)) {
          return candidate;
        }
      }
    }
  } catch {
    // fallback
  }

  return {
    url: env.url,
    anonKey: env.anonKey,
  };
}

export function saveStoredSupabaseConfig(config: SupabaseConfig): void {
  const env = getEnvSupabaseConfig();
  if (env.isProd) {
    // Never store or override Supabase credentials in browser storage in production
    return;
  }

  if (config.anonKey && isForbiddenSecretKey(config.anonKey)) {
    throw new Error('Privileged service-role or secret keys must never be used in frontend code.');
  }

  try {
    if (!config.url && !config.anonKey) {
      safeStorage.removeItem(STORAGE_KEY_CONFIG);
    } else {
      safeStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    }
    cachedClient = null;
    currentConfigKey = '';
  } catch (e) {
    console.error('Failed to save supabase config:', e);
  }
}

let cachedClient: SupabaseClient | null = null;
let currentConfigKey = '';

export function getSupabase(): SupabaseClient | null {
  try {
    const config = getStoredSupabaseConfig();
    if (!isValidSupabaseConfig(config)) {
      return null;
    }

    const configKey = `${config.url}:::${config.anonKey}`;
    if (cachedClient && currentConfigKey === configKey) {
      return cachedClient;
    }

    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    });
    currentConfigKey = configKey;
    return cachedClient;
  } catch (err) {
    console.warn('Error initializing Supabase client:', err);
    return null;
  }
}

export function isSupabaseConnected(): boolean {
  try {
    return getSupabase() !== null;
  } catch {
    return false;
  }
}

export async function testSupabaseConnection(
  customConfig?: SupabaseConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    const cfg = customConfig || getStoredSupabaseConfig();
    if (!isValidSupabaseConfig(cfg)) {
      return {
        success: false,
        error: 'Please enter a valid Supabase project URL and publishable/anon public key.',
      };
    }

    const testClient = createClient(cfg.url, cfg.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { error } = await testClient.auth.getSession();
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Connection to Supabase Auth failed.' };
  }
}
