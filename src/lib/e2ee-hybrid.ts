/**
 * Hybrid encryption for large data (images, files).
 * Uses AES-256-GCM for data encryption + RSA-OAEP for key wrapping.
 * No data is stored on the backend — everything travels as encrypted text in the message.
 */

import { supabase } from '@/integrations/supabase/client';

// ── AES helpers ──────────────────────────────────────────────

async function generateAESKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ]);
}

async function exportAESKey(key: CryptoKey): Promise<ArrayBuffer> {
  return crypto.subtle.exportKey('raw', key);
}

async function importAESKey(raw: ArrayBuffer): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM', length: 256 }, false, [
    'decrypt',
  ]);
}

// ── RSA helpers (reuse existing key infrastructure) ──────────

async function importPublicKey(publicKeyB64: string): Promise<CryptoKey> {
  const jwk = JSON.parse(atob(publicKeyB64));
  return crypto.subtle.importKey('jwk', jwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, [
    'encrypt',
  ]);
}

function getKeyId(userId: string) {
  return `user_private_key:${userId}`;
}

const DB_NAME = 'foodyzone_e2ee';
const STORE_NAME = 'keys';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function loadPrivateKey(userId: string): Promise<CryptoKey | null> {
  const db = await openDB();
  const jwk: JsonWebKey | undefined = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(getKeyId(userId));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  if (!jwk) return null;
  try {
    return await crypto.subtle.importKey('jwk', jwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['decrypt']);
  } catch {
    return null;
  }
}

// ── Helpers ──────────────────────────────────────────────────

function arrayBufferToBase64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

// ── Public API ───────────────────────────────────────────────

export interface HybridEncryptedPayload {
  /** AES key encrypted with RSA public key (base64) */
  ek: string;
  /** AES-GCM IV (base64) */
  iv: string;
  /** AES-GCM ciphertext of the actual data (base64) */
  ct: string;
}

/**
 * Encrypt arbitrary binary data for a recipient's RSA public key.
 * Returns a JSON-serializable payload.
 */
export async function hybridEncrypt(
  data: ArrayBuffer,
  recipientPublicKeyB64: string
): Promise<HybridEncryptedPayload> {
  const aesKey = await generateAESKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    data
  );

  const rawAES = await exportAESKey(aesKey);
  const publicKey = await importPublicKey(recipientPublicKeyB64);
  const encryptedKey = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, rawAES);

  return {
    ek: arrayBufferToBase64(encryptedKey),
    iv: arrayBufferToBase64(iv.buffer),
    ct: arrayBufferToBase64(ciphertext),
  };
}

/**
 * Decrypt a hybrid-encrypted payload using the local private key.
 */
export async function hybridDecrypt(
  payload: HybridEncryptedPayload,
  userId: string
): Promise<ArrayBuffer> {
  const privateKey = await loadPrivateKey(userId);
  if (!privateKey) throw new Error('Private key not found');

  const rawAES = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    base64ToArrayBuffer(payload.ek)
  );

  const aesKey = await importAESKey(rawAES);

  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToArrayBuffer(payload.iv) },
    aesKey,
    base64ToArrayBuffer(payload.ct)
  );
}

/** Max image size before encryption (3 MB) */
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
