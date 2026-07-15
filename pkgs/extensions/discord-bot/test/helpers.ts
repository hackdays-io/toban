/**
 * Test helpers — generate ephemeral key material at runtime so no real
 * keys ever live in the repo.
 */
import { exportPKCS8, exportSPKI, generateKeyPair } from "jose";

export interface Es256Pair {
  privateKeyPem: string;
  publicKeyPem: string;
}

export async function generateEs256Pair(): Promise<Es256Pair> {
  const { publicKey, privateKey } = await generateKeyPair("ES256", {
    extractable: true,
  });
  return {
    privateKeyPem: await exportPKCS8(privateKey),
    publicKeyPem: await exportSPKI(publicKey),
  };
}

export async function generateEd25519Pair(): Promise<{
  publicKeyHex: string;
  privateKey: CryptoKey;
}> {
  const keyPair = (await crypto.subtle.generateKey({ name: "Ed25519" }, true, [
    "sign",
    "verify",
  ])) as CryptoKeyPair;
  const exported = await crypto.subtle.exportKey("raw", keyPair.publicKey);
  const raw = new Uint8Array(exported as ArrayBuffer);
  let hex = "";
  for (const b of raw) hex += b.toString(16).padStart(2, "0");
  return { publicKeyHex: hex, privateKey: keyPair.privateKey };
}

export async function signEd25519(
  privateKey: CryptoKey,
  message: string,
): Promise<string> {
  const sig = new Uint8Array(
    await crypto.subtle.sign(
      { name: "Ed25519" },
      privateKey,
      new TextEncoder().encode(message),
    ),
  );
  let hex = "";
  for (const b of sig) hex += b.toString(16).padStart(2, "0");
  return hex;
}
