import { gzipDecode, gzipEncode } from "https://deno.land/x/wasm_gzip/mod.ts";
import { config } from "../config.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function fromBase64Url(base64url: string): Uint8Array {
  const base64 = base64url
    .replace(/-/g, "+")
    .replace(/_/g, "/") +
    "===".slice(0, (4 - base64url.length % 4) % 4);
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}

function toBase64Url(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function encrypt(text: string): Promise<string> {
  const compressed = await gzipEncode(encoder.encode(text));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(config.salt),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(config.salt),
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    compressed,
  );

  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return toBase64Url(combined);
}

export async function decrypt(slug: string): Promise<string> {
  const combined = fromBase64Url(slug);
  const iv = combined.slice(0, 12);
  const encrypted = combined.slice(12);

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(config.salt),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(config.salt),
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted,
  );

  const uncompressed = await gzipDecode(new Uint8Array(decrypted));
  return decoder.decode(uncompressed);
}
