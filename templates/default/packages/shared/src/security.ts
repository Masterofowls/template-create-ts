import CryptoJS from "crypto-js";
import isUnsafe from "is-unsafe";
import DOMPurify from "isomorphic-dompurify";
import secureJsonParse from "secure-json-parse";
import xss from "xss";

function getSecretKey(): string {
  const fromEnv =
    typeof process !== "undefined" ? process.env.APP_SECRET : import.meta.env?.VITE_APP_SECRET;
  return fromEnv ?? "dev-secret-change-me-in-production-32chars";
}

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, { USE_PROFILES: { html: true } });
}

export function sanitizeText(input: string): string {
  return xss(input, { whiteList: {}, stripIgnoreTag: true });
}

export function safeJsonParse<T = unknown>(input: string): T {
  return secureJsonParse.parse(input) as T;
}

export function hashValue(value: string): string {
  return CryptoJS.SHA256(value).toString(CryptoJS.enc.Hex);
}

export function encryptValue(value: string): string {
  return CryptoJS.AES.encrypt(value, getSecretKey()).toString();
}

export function decryptValue(encrypted: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, getSecretKey());
  return bytes.toString(CryptoJS.enc.Utf8);
}

export function isUnsafeInput(input: string): boolean {
  return isUnsafe(input);
}

export function assertSafeInput(input: string, fieldName = "input"): void {
  if (isUnsafe(input)) {
    throw new Error(`Unsafe content detected in ${fieldName}`);
  }
}
