import crypto from "crypto";

const KEY_ENV = process.env.APPLICATION_CREDENTIALS_KEY ?? "";

function loadKey(): Buffer {
  if (!KEY_ENV) {
    throw new Error("APPLICATION_CREDENTIALS_KEY is not configured");
  }

  let key = Buffer.from(KEY_ENV, "base64");
  if (key.length === 0) {
    key = Buffer.from(KEY_ENV, "hex");
  }

  if (key.length !== 32) {
    throw new Error("APPLICATION_CREDENTIALS_KEY must decode to 32 bytes (256 bits)");
  }

  return key;
}

const KEY = loadKey();
const IV_LENGTH = 12; // AES-GCM recommended IV length

type EncryptedSecret = {
  ciphertext: string;
  iv: string;
  tag: string;
};

export function encryptSecret(secret: string): EncryptedSecret {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);

  let encrypted = cipher.update(secret, "utf8", "base64");
  encrypted += cipher.final("base64");
  const tag = cipher.getAuthTag();

  return {
    ciphertext: encrypted,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function decryptSecret({ ciphertext, iv, tag }: EncryptedSecret): string {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    KEY,
    Buffer.from(iv, "base64")
  );
  decipher.setAuthTag(Buffer.from(tag, "base64"));

  let decrypted = decipher.update(ciphertext, "base64", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
