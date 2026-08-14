import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export const normalizeEmail = (email: string) => email.trim().toLocaleLowerCase("en-US");
export const randomToken = () => randomBytes(32).toString("base64url");
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const hashNetworkValue = (value: string | null) => value ? createHash("sha256").update(`${process.env.AUTH_PEPPER || "development-pepper"}:${value}`).digest("hex") : null;

export const passwordPolicyError = (password: string) => {
  if (password.length < 10) return "Mật khẩu cần có ít nhất 10 ký tự.";
  if (!/[A-Za-zÀ-ỹ]/.test(password) || !/\d/.test(password) || !/[^A-Za-zÀ-ỹ\d\s]/.test(password)) return "Mật khẩu cần có chữ cái, chữ số và ký tự đặc biệt.";
  if (password.length > 128) return "Mật khẩu không được dài quá 128 ký tự.";
  return null;
};

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEY_LENGTH) as Buffer;
  return `scrypt$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, saltValue, hashValue] = encoded.split("$");
  if (algorithm !== "scrypt" || !saltValue || !hashValue) return false;
  const expected = Buffer.from(hashValue, "base64url");
  const actual = await scrypt(password, Buffer.from(saltValue, "base64url"), expected.length) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

