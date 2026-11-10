import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { safeStorage } from './storage';

const STORAGE_KEY_CONFIG = 'myspace_supabase_config';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  try {
    const stored = safeStorage.getItem(STORAGE_KEY_CONFIG);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        return {
          url: typeof parsed.url === 'string' ? parsed.url.trim() : '',
          anonKey: typeof parsed.anonKey === 'string' ? parsed.anonKey.trim() : '',
        };
      }
    }
  } catch {
    // fallback
  }

  let envUrl = '';
  let envKey = '';
  try {
    const metaEnv = typeof import.meta !== 'undefined' && (import.meta as any)?.env;
    if (metaEnv) {
      envUrl = (metaEnv.VITE_SUPABASE_URL || '').trim();
      envKey = (metaEnv.VITE_SUPABASE_ANON_KEY || '').trim();
    }
  } catch {
    // fallback
  }

  return {
    url: envUrl,
    anonKey: envKey,
  };
}

export function saveStoredSupabaseConfig(config: SupabaseConfig): void {
  try {
    safeStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save supabase config:', e);
  }
}

let cachedClient: SupabaseClient | null = null;
let currentConfigKey = '';

export function getSupabase(): SupabaseClient | null {
  try {
    const config = getStoredSupabaseConfig();
    if (
      !config ||
      !config.url ||
      !config.anonKey ||
      typeof config.url !== 'string' ||
      typeof config.anonKey !== 'string' ||
      config.url.includes('your-project') ||
      config.url.trim() === ''
    ) {
      return null;
    }

    // Validate URL syntax before passing to createClient
    try {
      new URL(config.url);
    } catch {
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
    if (!cfg.url || !cfg.anonKey || cfg.url.includes('your-project') || cfg.url.trim() === '') {
      return { success: false, error: 'Please enter a valid Supabase project URL and anon public key.' };
    }

    try {
      new URL(cfg.url);
    } catch {
      return { success: false, error: 'Invalid Supabase URL format.' };
    }

    const testClient = createClient(cfg.url, cfg.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { error } = await testClient.from('saved_links').select('id').limit(1);
    if (error) {
      // If table doesn't exist yet, the connection itself is valid
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        return { success: true };
      }
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Connection to Supabase failed.' };
  }
}
