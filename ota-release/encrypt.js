const fs = require("fs");
const crypto = require("crypto");
const path = require("path");

const NATIVE_PART = "A9x_Q!";
const JS_PART = "Zm9@";
const BUILD_SALT = "2026-01-android-prod";
const KEY_VERSION = "1";

// 🔐 read env
//const { NATIVE_PART, JS_PART, BUILD_SALT, KEY_VERSION } = process.env;

if (!NATIVE_PART || !JS_PART || !BUILD_SALT || !KEY_VERSION) {
  throw new Error("❌ Missing encryption env variables");
}

// paths
const INPUT = "dist/index.android.bundle";
const OUTPUT = "dist/index.android.bundle.enc";

// 1️⃣ derive native fragment (must match Android)
const nativeKey = crypto
  .createHash("sha256")
  .update(NATIVE_PART)
  .digest("base64");

// 2️⃣ derive final AES key
const finalKey = crypto
  .createHash("sha256")
  .update(nativeKey + JS_PART + BUILD_SALT + KEY_VERSION)
  .digest(); // 32 bytes

// 3️⃣ read plain bundle
const plainBundle = fs.readFileSync(INPUT);

// 4️⃣ encrypt (AES-256-GCM)
const iv = crypto.randomBytes(12);
const cipher = crypto.createCipheriv("aes-256-gcm", finalKey, iv);

const encrypted = Buffer.concat([cipher.update(plainBundle), cipher.final()]);

const tag = cipher.getAuthTag();

// 5️⃣ payload layout
// [IV | TAG | ENCRYPTED]
const payload = Buffer.concat([iv, tag, encrypted]);
fs.writeFileSync(OUTPUT, payload);

// 6️⃣ integrity hash
const hash = crypto.createHash("sha256").update(payload).digest("hex");

fs.writeFileSync("dist/bundle.hash", hash);

// 7️⃣ metadata (optional but recommended)
fs.writeFileSync(
  "dist/bundle.meta.json",
  JSON.stringify(
    {
      version: KEY_VERSION,
      salt: BUILD_SALT,
      algo: "AES-256-GCM",
      ivSize: 12,
      tagSize: 16,
      createdAt: new Date().toISOString(),
    },
    null,
    2,
  ),
);

console.log("✅ OTA bundle encrypted successfully");
