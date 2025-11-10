// utils/crypto.ts
const FIXED_SALT = "hedgium-salt"; // can still keep if needed elsewhere

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

  // Convert to Base64 for storage
  const publicKeyBase64 = arrayBufferToBase64(publicKey);
  const privateKeyBase64 = arrayBufferToBase64(privateKey);

  // Optionally store in localStorage
  localStorage.setItem("hedgium_public_key", publicKeyBase64);
  localStorage.setItem("hedgium_private_key", privateKeyBase64);

  return { publicKey:publicKeyBase64, privateKey:privateKeyBase64 };
}

// --- 2️⃣ Encrypt Plaintext with Public Key ---
export async function encryptWithPublicKey(publicKeyPemOrBase64: string, plaintext: string) {
  const enc = new TextEncoder();

  // detect if it's PEM or plain Base64
  let binaryDer;
  if (publicKeyPemOrBase64.includes("-----BEGIN")) {
    binaryDer = pemToArrayBuffer(publicKeyPemOrBase64);
  } else {
    binaryDer = base64ToArrayBuffer(publicKeyPemOrBase64);
  }

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

// --- 3️⃣ Decrypt Data with Stored Private Key ---
export async function decryptPassword(encryptedBase64: string) {
  const privateKeyBase64 = localStorage.getItem("hedgium_private_key");
  if (!privateKeyBase64) throw new Error("Private key not found in localStorage");

  const privateKeyBuffer = base64ToArrayBuffer(privateKeyBase64);

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

  return new TextDecoder().decode(decrypted);
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
