import crypto from "crypto";

export function deriveKey({ nativePart, jsPart, buildSalt, keyVersion }) {
  return crypto
    .createHash("sha256")
    .update(nativePart + jsPart + buildSalt + keyVersion)
    .digest(); // 32 bytes
}
