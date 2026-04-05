import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { getGoogleOAuthConfig } from "@/lib/google/config";

function encryptionKeyBytes() {
  const { encryptionKey } = getGoogleOAuthConfig();
  if (!encryptionKey) {
    throw new Error("Missing GOOGLE_TOKEN_ENCRYPTION_KEY.");
  }

  return createHash("sha256").update(encryptionKey).digest();
}

export function encryptToken(token: string) {
  const iv = randomBytes(12);
  const key = encryptionKeyBytes();
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("base64"), encrypted.toString("base64"), authTag.toString("base64")].join(
    "."
  );
}

export function decryptToken(payload: string) {
  const [ivPart, encryptedPart, authTagPart] = payload.split(".");
  if (!ivPart || !encryptedPart || !authTagPart) {
    throw new Error("Invalid encrypted token payload.");
  }

  const key = encryptionKeyBytes();
  const iv = Buffer.from(ivPart, "base64");
  const encrypted = Buffer.from(encryptedPart, "base64");
  const authTag = Buffer.from(authTagPart, "base64");

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
