import "server-only";
import { cookies } from "next/headers";
import crypto from "node:crypto";

/**
 * Admin authentication — separate from the creator (NextAuth email) login.
 *
 * A single operator logs in at /admin/login with a username + password stored
 * in the environment (ADMIN_USERNAME / ADMIN_PASSWORD). On success we set a
 * signed, httpOnly session cookie. The token is an HMAC over an expiry
 * timestamp using NEXTAUTH_SECRET, so it can't be forged client-side and can't
 * be reused past its lifetime.
 */

export const ADMIN_COOKIE_NAME = "nudge_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12; // 12 hours (seconds)

function getSigningSecret(): string {
  // NEXTAUTH_SECRET is already required for the app to boot, so reuse it rather
  // than introducing another mandatory secret.
  return process.env.NEXTAUTH_SECRET ?? "";
}

function sign(value: string): string {
  return crypto
    .createHmac("sha256", getSigningSecret())
    .update(value)
    .digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/** True when both admin credentials are configured in the environment. */
export function adminCredentialsConfigured(): boolean {
  return Boolean(process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD);
}

/** Constant-time comparison of submitted credentials against the environment. */
export function verifyAdminCredentials(
  username: string,
  password: string
): boolean {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPass) return false;

  // Compare both before returning so the response time does not reveal which
  // of the two fields was wrong.
  const userOk = safeEqual(username, expectedUser);
  const passOk = safeEqual(password, expectedPass);
  return userOk && passOk;
}

/** Create a fresh signed session token that expires ADMIN_SESSION_MAX_AGE from now. */
export function createAdminSessionToken(): string {
  const expiresAt = Date.now() + ADMIN_SESSION_MAX_AGE * 1000;
  const payload = String(expiresAt);
  return `${payload}.${sign(payload)}`;
}

function verifyAdminSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;
  if (!safeEqual(signature, sign(payload))) return false;

  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;
  return true;
}

/** Read the admin session cookie and verify it. Use in server components / route handlers. */
export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return verifyAdminSessionToken(store.get(ADMIN_COOKIE_NAME)?.value);
}
