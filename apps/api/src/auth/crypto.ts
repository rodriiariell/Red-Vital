import { createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
const scrypt = (password: string, salt: Buffer, keylen: number, options: { N: number; r: number; p: number }) => new Promise<Buffer>((resolve, reject) => {
  nodeScrypt(password, salt, keylen, options, (error, derived) => error ? reject(error) : resolve(derived));
});
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;

type PasswordHasher = { hash(password: string): Promise<string>; verify(encoded: string, password: string): Promise<boolean> };
let hasher: PasswordHasher | undefined;

const scryptHasher: PasswordHasher = {
  async hash(password) {
    const salt = randomBytes(16);
    const derived = await scrypt(password, salt, KEY_LENGTH, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P }) as Buffer;
    return `scrypt$v1$${SCRYPT_N},${SCRYPT_R},${SCRYPT_P},${KEY_LENGTH}$${salt.toString("base64url")}$${derived.toString("base64url")}`;
  },
  async verify(encoded, password) {
    const [, version, params, saltText, hashText] = encoded.split("$");
    if (version !== "v1" || !params || !saltText || !hashText) return false;
    const [n, r, p, length] = params.split(",").map(Number);
    if (![n, r, p, length].every(Number.isSafeInteger) || n <= 1 || r <= 0 || p <= 0 || length <= 0) return false;
    try {
      const expected = Buffer.from(hashText, "base64url");
      const actual = await scrypt(password, Buffer.from(saltText, "base64url"), length, { N: n, r, p }) as Buffer;
      return expected.length === actual.length && timingSafeEqual(expected, actual);
    } catch { return false; }
  }
};

export function configurePasswordHasher(kind: string | undefined = process.env.PASSWORD_HASHER) {
  if ((kind ?? "scrypt") === "scrypt") { hasher = scryptHasher; return; }
  if (kind !== "argon2") throw new Error(`Unsupported password hasher: ${kind}`);
  hasher = undefined;
}

async function argon2Hasher(): Promise<PasswordHasher> {
  const module = await import("argon2");
  return { hash: (password) => module.default.hash(password, { type: module.default.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 }), verify: (encoded, password) => module.default.verify(encoded, password) };
}

export async function hashPassword(password: string) {
  if (!hasher) hasher = await argon2Hasher();
  return hasher.hash(password);
}

export async function verifyPassword(hash: string, password: string) {
  if (hash.startsWith("scrypt$")) return scryptHasher.verify(hash, password);
  if (!hasher) hasher = await argon2Hasher();
  return hasher.verify(hash, password);
}

export const randomToken = () => randomBytes(48).toString("base64url");
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
