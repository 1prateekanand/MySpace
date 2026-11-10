/**
 * High-Security Client-Side Cryptographic Engine
 * Built on Web Crypto API (window.crypto.subtle).
 * 
 * - AES-256-GCM for authenticated symmetric encryption with 96-bit (12-byte) IVs.
 * - PBKDF2 with SHA-256 and 100,000 iterations for key derivation from user PIN.
 * - Zero storage of raw PIN or plaintext encryption keys.
 */

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH_BITS = 256;
const VERIFICATION_TOKEN = 'MYSPACE_VERIFIED_VAULT_TOKEN_V1';

// Utility: ArrayBuffer to Base64
export function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Utility: Base64 to Uint8Array
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate a cryptographically secure random salt of specified byte length.
 */
export function generateSalt(length = 16): Uint8Array {
  const salt = new Uint8Array(length);
  window.crypto.getRandomValues(salt);
  return salt;
}

/**
 * Derives a 256-bit AES-GCM CryptoKey from a user PIN/passphrase using PBKDF2-SHA256.
 */
export async function deriveKeyFromPin(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const rawKeyMaterial = enc.encode(pin);

  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    rawKeyMaterial as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveKey', 'deriveBits']
  );

  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    {
      name: 'AES-GCM',
      length: KEY_LENGTH_BITS,
    },
    false, // key is non-extractable from memory
    ['encrypt', 'decrypt']
  );

  return derivedKey;
}

/**
 * Creates a verification hash for a PIN to check correctness without storing the PIN or decrypting the DB.
 */
export async function createPinVerifier(pin: string): Promise<{ verifierSalt: string; verifierHash: string }> {
  const salt = generateSalt(16);
  const key = await deriveKeyFromPin(pin, salt);

  // Encrypt fixed verification token
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    enc.encode(VERIFICATION_TOKEN) as BufferSource
  );

  const verifierHash = bufferToBase64(ciphertextBuffer) + '::' + bufferToBase64(iv);
  return {
    verifierSalt: bufferToBase64(salt),
    verifierHash,
  };
}

/**
 * Verifies if an entered PIN matches the stored verifier hash.
 */
export async function verifyPin(pin: string, verifierSaltBase64: string, verifierHash: string): Promise<boolean> {
  try {
    const salt = base64ToUint8Array(verifierSaltBase64);
    const [ciphertextB64, ivB64] = verifierHash.split('::');
    if (!ciphertextB64 || !ivB64) return false;

    const key = await deriveKeyFromPin(pin, salt);
    const ciphertext = base64ToUint8Array(ciphertextB64);
    const iv = base64ToUint8Array(ivB64);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as BufferSource },
      key,
      ciphertext as BufferSource
    );

    const dec = new TextDecoder();
    const token = dec.decode(decryptedBuffer);
    return token === VERIFICATION_TOKEN;
  } catch {
    return false;
  }
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  salt: string;
}

/**
 * Encrypts an arbitrary serializable JS object or string using AES-256-GCM.
 */
export async function encryptData(data: any, key: CryptoKey, salt?: Uint8Array): Promise<EncryptedPayload> {
  const usedSalt = salt || generateSalt(16);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const jsonStr = JSON.stringify(data);
  const enc = new TextEncoder();
  const encoded = enc.encode(jsonStr);

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    encoded as BufferSource
  );

  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv),
    salt: bufferToBase64(usedSalt),
  };
}

/**
 * Decrypts an AES-256-GCM payload and parses back the JSON object.
 */
export async function decryptData<T = any>(
  payload: { ciphertext: string; iv: string },
  key: CryptoKey
): Promise<T> {
  const ciphertext = base64ToUint8Array(payload.ciphertext);
  const iv = base64ToUint8Array(payload.iv);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ciphertext as BufferSource
  );

  const dec = new TextDecoder();
  const jsonStr = dec.decode(decryptedBuffer);
  return JSON.parse(jsonStr) as T;
}

/**
 * Encrypts an ArrayBuffer/Blob directly for vault files.
 */
export async function encryptBuffer(buffer: ArrayBuffer, key: CryptoKey): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    buffer
  );
  return { ciphertext, iv };
}

/**
 * Decrypts an ArrayBuffer directly.
 */
export async function decryptBuffer(ciphertext: ArrayBuffer, iv: Uint8Array, key: CryptoKey): Promise<ArrayBuffer> {
  return await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ciphertext
  );
}
