import crypto from "crypto";

export const SESSION_COOKIE_NAME =
  process.env.SESSION_COOKIE_NAME || "jrp_session";

export function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string) {
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    throw new Error("SESSION_SECRET is missing in .env");
  }

  return crypto.createHash("sha256").update(`${token}:${secret}`).digest("hex");
}

export function getSessionExpiryDate() {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}
