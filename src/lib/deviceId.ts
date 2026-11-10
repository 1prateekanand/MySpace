import { safeStorage } from './storage';

const DEVICE_ID_KEY = 'myspace_device_id';

/**
 * Returns a persistent random UUID unique to this browser instance/device.
 * Stored in safeStorage (localStorage fallback).
 */
export function getDeviceId(): string {
  try {
    const existing = safeStorage.getItem(DEVICE_ID_KEY);
    if (existing && existing.trim().length > 0) {
      return existing.trim();
    }
  } catch {
    // fallback
  }

  // Generate a cryptographically secure random UUID
  let newId: string;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    newId = crypto.randomUUID();
  } else {
    // Fallback pseudo-UUID
    newId = 'dev-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
  }

  safeStorage.setItem(DEVICE_ID_KEY, newId);
  return newId;
}

/**
 * Builds the canonical storage namespace for device-isolated multi-user data:
 * myspace:{user_id}:{device_id}
 */
export function getWorkspaceNamespace(userId: string): string {
  const deviceId = getDeviceId();
  const cleanUser = (userId || 'guest').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `myspace:${cleanUser}:${deviceId}`;
}
