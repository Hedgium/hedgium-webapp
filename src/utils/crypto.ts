// utils/crypto.ts

const FIXED_SALT = "hedgium-salt";

// --- 1️⃣ Generate RSA Key Pair ---
export async function generateKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 4096,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256"
    },
    true,
    ["encrypt", "decrypt"]
  );

  const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const privateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

  return { publicKey, privateKey };
}


// --- 2️⃣ Encrypt Private Key with AES-GCM (using passphrase) ---
export async function encryptPrivateKey(privateKey: ArrayBuffer, passphrase: string) {
  const enc = new TextEncoder();

  // Derive AES key from passphrase
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(FIXED_SALT),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"]
  );

  // Encrypt the private key
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, privateKey);

  return { encrypted, iv };
}


// --- 3️⃣ Encrypt Plaintext with Public Key ---
export async function encryptWithPublicKey(publicKeyPem: string, plaintext: string) {
  const enc = new TextEncoder();
  const binaryDer = pemToArrayBuffer(publicKeyPem);

  const publicKey = await window.crypto.subtle.importKey(
    "spki",
    binaryDer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    enc.encode(plaintext)
  );

  return arrayBufferToBase64(ciphertext);
}


// --- 4️⃣ Decrypt Encrypted Private Key ---
export async function decryptPrivateKey(
  encryptedPrivateKeyBase64: string,
  ivBase64: string,
  passphrase: string
) {
  const enc = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(FIXED_SALT),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  const encryptedPrivateKey = base64ToArrayBuffer(encryptedPrivateKeyBase64);
  const iv = base64ToArrayBuffer(ivBase64);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key,
    encryptedPrivateKey
  );

  return decrypted; // returns ArrayBuffer (original pkcs8 private key)
}


// --- 5️⃣ Decrypt Encrypted Data (like password) using RSA Private Key ---
export async function decryptPassword(privateKeyBuffer: ArrayBuffer, encryptedBase64: string) {
  const privateKey = await window.crypto.subtle.importKey(
    "pkcs8",
    privateKeyBuffer,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["decrypt"]
  );

  const encryptedBytes = base64ToArrayBuffer(encryptedBase64);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedBytes
  );

  const dec = new TextDecoder();
  return dec.decode(decrypted);
}


// --- Helper Functions ---
function pemToArrayBuffer(pem: string) {
  const b64 = pem.replace(/-----.*?-----/g, "").replace(/\s+/g, "");
  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < bytes.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes.buffer;
}

function base64ToArrayBuffer(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < bytes.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes.buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
