import crypto from "crypto";

export function generateOtp() {
  return crypto.randomInt(10000, 100000).toString();
}

export function hashOtp(otp: string, phone: string) {
  const secret = process.env.OTP_SECRET;

  if (!secret) {
    throw new Error("OTP_SECRET is missing in .env");
  }

  return crypto
    .createHash("sha256")
    .update(`${otp}:${phone}:${secret}`)
    .digest("hex");
}

export function getOtpExpiryDate() {
  return new Date(Date.now() + 5 * 60 * 1000);
}
