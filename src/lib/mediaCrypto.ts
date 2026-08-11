/**
 * Media encryption for chat/club media.
 *
 * Standard primitives only:
 *  - AES-GCM 256 (Web Crypto) encrypts the file bytes on device.
 *  - The AES key is wrapped with the recipient's existing RSA-OAEP public key
 *    using the app's existing E2EE helpers (src/lib/e2ee.ts).
 *
 * The server never sees the AES key material in plaintext form and B2 only ever
 * stores ciphertext.
 */
import { encryptMessage, decryptMessage } from './e2ee';

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToBytes(b64: string) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

export interface EncryptedMedia {
  /** Ciphertext wrapped in a File so it can go through the existing upload pipeline. */
  file: File;
  /** AES key wrapped for the recipient (RSA-OAEP, base64). */
  wrappedKey: string;
  /** Base64 IV. */
  iv: string;
  /** Original mime type (needed to rebuild the blob after decryption). */
  contentType: string;
}

export async function encryptMediaFile(
  file: File,
  recipientPublicKeyB64: string
): Promise<EncryptedMedia> {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plainBuffer = await file.arrayBuffer();
  const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plainBuffer);

  const rawKey = new Uint8Array(await crypto.subtle.exportKey('raw', key));
  const wrappedKey = await encryptMessage(bytesToBase64(rawKey), recipientPublicKeyB64);

  return {
    file: new File([cipher], file.name, { type: 'application/octet-stream' }),
    wrappedKey,
    iv: bytesToBase64(iv),
    contentType: file.type || 'application/octet-stream',
  };
}

export async function decryptMediaToBlob(
  ciphertext: ArrayBuffer,
  wrappedKey: string,
  ivB64: string,
  userId: string,
  contentType: string
): Promise<Blob> {
  const rawKeyB64 = await decryptMessage(wrappedKey, userId);
  const key = await crypto.subtle.importKey(
    'raw',
    base64ToBytes(rawKeyB64),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(ivB64) },
    key,
    ciphertext
  );
  return new Blob([plain], { type: contentType || 'application/octet-stream' });
}
