import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";

const SCRYPT_N = 32_768;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const MAX_MEMORY = 64 * 1024 * 1024;
const USERNAME_PATTERN = new RegExp("^[\\p{L}\\p{N}._-]+$", "u");
const DUMMY_HASH = [
  "scrypt",
  SCRYPT_N,
  SCRYPT_R,
  SCRYPT_P,
  Buffer.alloc(SALT_LENGTH, 17).toString("base64url"),
  Buffer.alloc(KEY_LENGTH).toString("base64url"),
].join("$");
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_FAILURES = 8;

type FailureBucket = { count: number; resetAt: number; blockedUntil: number };
const failedLogins = new Map<string, FailureBucket>();

function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      KEY_LENGTH,
      {
        N: SCRYPT_N,
        r: SCRYPT_R,
        p: SCRYPT_P,
        maxmem: MAX_MEMORY,
      },
      (error, derivedKey) => {
        if (error) reject(error);
        else resolve(derivedKey);
      }
    );
  });
}

export function normalizeUsername(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("en-US");
}

export function isValidUsername(value: string): boolean {
  const normalized = normalizeUsername(value);
  return (
    normalized.length >= 3 &&
    normalized.length <= 64 &&
    USERNAME_PATTERN.test(normalized)
  );
}

export async function hashLocalPassword(password: string): Promise<string> {
  if (password.length < 12 || password.length > 128) {
    throw new Error("يجب أن تكون كلمة المرور بين 12 و128 محرفًا.");
  }
  const salt = randomBytes(SALT_LENGTH);
  const key = await deriveKey(password, salt);
  return [
    "scrypt",
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}

export async function verifyLocalPassword(
  password: string,
  encodedHash: string | null | undefined
): Promise<boolean> {
  if (password.length > 128) return false;
  const storedHash = encodedHash || DUMMY_HASH;
  const parts = storedHash.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltValue, keyValue] = parts;
  if (
    Number(n) !== SCRYPT_N ||
    Number(r) !== SCRYPT_R ||
    Number(p) !== SCRYPT_P
  ) {
    return false;
  }

  try {
    const salt = Buffer.from(saltValue, "base64url");
    const expected = Buffer.from(keyValue, "base64url");
    if (salt.length !== SALT_LENGTH || expected.length !== KEY_LENGTH) {
      return false;
    }
    const actual = await deriveKey(password, salt);
    const matches = timingSafeEqual(actual, expected);
    return Boolean(encodedHash) && matches;
  } catch {
    return false;
  }
}

function pruneFailureBuckets(now: number) {
  if (failedLogins.size < 5_000) return;
  failedLogins.forEach((bucket, key) => {
    if (bucket.resetAt <= now && bucket.blockedUntil <= now) {
      failedLogins.delete(key);
    }
  });
}

export function isLocalLoginBlocked(key: string): boolean {
  const now = Date.now();
  pruneFailureBuckets(now);
  const bucket = failedLogins.get(key);
  if (!bucket) return false;
  if (bucket.blockedUntil > now) return true;
  if (bucket.resetAt <= now) failedLogins.delete(key);
  return false;
}

export function recordLocalLoginFailure(key: string): boolean {
  const now = Date.now();
  const current = failedLogins.get(key);
  const bucket =
    !current || current.resetAt <= now
      ? { count: 0, resetAt: now + LOGIN_WINDOW_MS, blockedUntil: 0 }
      : current;
  bucket.count += 1;
  if (bucket.count >= LOGIN_MAX_FAILURES) {
    bucket.blockedUntil = now + LOGIN_WINDOW_MS;
  }
  failedLogins.set(key, bucket);
  pruneFailureBuckets(now);
  return bucket.blockedUntil > now;
}

export function clearLocalLoginFailures(key: string) {
  failedLogins.delete(key);
}
