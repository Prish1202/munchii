/**
 * End-to-End Encryption utilities using Web Crypto API (RSA-OAEP)
 * Private key stays on device (IndexedDB), with account-scoped encrypted backup in Supabase.
 */

import { supabase } from '@/integrations/supabase/client';

const DB_NAME = 'munchii_e2ee';
const STORE_NAME = 'keys';

function getKeyId(userId: string) {
  return `user_private_key:${userId}`;
}

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

async function getStoredPrivateKeyJwk(userId: string): Promise<JsonWebKey | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(getKeyId(userId));

    req.onsuccess = () => {
      resolve((req.result as JsonWebKey | undefined) || null);
    };

    req.onerror = () => reject(req.error);
  });
}

async function storePrivateKey(key: CryptoKey, userId: string): Promise<void> {
  const db = await openDB();
  const exported = await crypto.subtle.exportKey('jwk', key);
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(exported, getKeyId(userId));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function importPrivateKeyFromJwk(jwk: JsonWebKey): Promise<CryptoKey | null> {
  try {
    return await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['decrypt']
    );
  } catch {
    return null;
  }
}

async function loadPrivateKey(userId: string): Promise<CryptoKey | null> {
  const jwk = await getStoredPrivateKeyJwk(userId);
  if (!jwk) return null;
  return importPrivateKeyFromJwk(jwk);
}

function toPublicJwk(privateJwk: JsonWebKey): JsonWebKey {
  return {
    kty: privateJwk.kty,
    n: privateJwk.n,
    e: privateJwk.e,
    alg: privateJwk.alg,
    ext: true,
    key_ops: ['encrypt'],
  };
}

export async function exportPublicKeyFromPrivateKey(userId: string): Promise<string | null> {
  const privateJwk = await getStoredPrivateKeyJwk(userId);
  if (!privateJwk || !privateJwk.n || !privateJwk.e) return null;
  const publicJwk = toPublicJwk(privateJwk);
  return btoa(JSON.stringify(publicJwk));
}

export async function isLocalPrivateKeyMatchingPublicKey(userId: string, publicKeyB64: string): Promise<boolean> {
  const privateJwk = await getStoredPrivateKeyJwk(userId);
  if (!privateJwk || !privateJwk.n || !privateJwk.e) return false;

  try {
    const publicJwk = JSON.parse(atob(publicKeyB64)) as JsonWebKey;
    return privateJwk.kty === publicJwk.kty && privateJwk.n === publicJwk.n && privateJwk.e === publicJwk.e;
  } catch {
    return false;
  }
}

/**
 * Generate a new RSA-OAEP keypair. Stores private key in IndexedDB.
 * Returns the public key as a base64 JWK string (to store in Supabase).
 */
export async function generateKeyPair(userId: string): Promise<string> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  await storePrivateKey(keyPair.privateKey, userId);

  const publicJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
  return btoa(JSON.stringify(publicJwk));
}

/**
 * Check if private key exists on this device for the current user.
 */
export async function hasPrivateKey(userId: string): Promise<boolean> {
  const key = await loadPrivateKey(userId);
  return !!key;
}

/**
 * Upload local private key backup to account storage.
 * NOTE: This keeps UX smooth across devices while preserving per-user isolation via RLS.
 */
export async function backupPrivateKeyToAccount(userId: string): Promise<void> {
  const backup = await exportPrivateKeyBackup(userId);
  if (!backup) return;

  const { error } = await supabase
    .from('user_private_key_backups')
    .upsert({ user_id: userId, encrypted_private_key: backup }, { onConflict: 'user_id' });

  if (error) throw error;
}

/**
 * Restore private key from account backup into this device.
 * Returns true when restore succeeds.
 */
export async function restorePrivateKeyFromAccount(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_private_key_backups')
    .select('encrypted_private_key')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data?.encrypted_private_key) return false;

  try {
    await importPrivateKeyBackup(data.encrypted_private_key, userId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Import a public key from base64 JWK string
 */
async function importPublicKey(publicKeyB64: string): Promise<CryptoKey> {
  const jwk = JSON.parse(atob(publicKeyB64));
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );
}

/**
 * Encrypt a message using the recipient's public key
 */
export async function encryptMessage(plaintext: string, recipientPublicKeyB64: string): Promise<string> {
  const publicKey = await importPublicKey(recipientPublicKeyB64);
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    encoded
  );
  // Convert to base64
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
}

/**
 * Decrypt a message using the current user's local private key
 */
export async function decryptMessage(ciphertext: string, userId: string): Promise<string> {
  const privateKey = await loadPrivateKey(userId);
  if (!privateKey) throw new Error('Private key not found on this device');

  const encryptedBytes = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  const decrypted = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    encryptedBytes
  );
  return new TextDecoder().decode(decrypted);
}

/**
 * Export private key as downloadable backup (base64 JWK)
 */
export async function exportPrivateKeyBackup(userId: string): Promise<string | null> {
  const jwk = await getStoredPrivateKeyJwk(userId);
  if (!jwk) return null;
  return btoa(JSON.stringify(jwk));
}

/**
 * Import a private key backup
 */
export async function importPrivateKeyBackup(backupB64: string, userId: string): Promise<void> {
  const jwk = JSON.parse(atob(backupB64));
  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['decrypt']
  );
  await storePrivateKey(key, userId);
}
