/**
 * End-to-End Encryption utilities using Web Crypto API (RSA-OAEP)
 * Private key stays on device (IndexedDB), public key is stored in Supabase.
 */

const DB_NAME = 'foodyzone_e2ee';
const STORE_NAME = 'keys';
const LEGACY_KEY_ID = 'user_private_key';

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
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const userReq = store.get(getKeyId(userId));
    userReq.onsuccess = async () => {
      if (userReq.result) {
        const key = await importPrivateKeyFromJwk(userReq.result as JsonWebKey);
        return resolve(key);
      }

      // Legacy fallback for previously stored single-device key.
      const legacyReq = store.get(LEGACY_KEY_ID);
      legacyReq.onsuccess = async () => {
        if (!legacyReq.result) return resolve(null);

        const key = await importPrivateKeyFromJwk(legacyReq.result as JsonWebKey);
        if (!key) return resolve(null);

        // Migrate legacy key to user-scoped key for future logins.
        const migrateTx = db.transaction(STORE_NAME, 'readwrite');
        migrateTx.objectStore(STORE_NAME).put(legacyReq.result, getKeyId(userId));
        migrateTx.oncomplete = () => resolve(key);
        migrateTx.onerror = () => resolve(key);
      };
      legacyReq.onerror = () => reject(legacyReq.error);
    };

    userReq.onerror = () => reject(userReq.error);
  });
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
 * Export private key as downloadable backup (encrypted with passphrase would be ideal,
 * but for simplicity we export the JWK as a file)
 */
export async function exportPrivateKeyBackup(userId: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(getKeyId(userId));
    req.onsuccess = () => {
      if (!req.result) return resolve(null);
      resolve(btoa(JSON.stringify(req.result)));
    };
    req.onerror = () => reject(req.error);
  });
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
