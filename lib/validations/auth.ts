import { z } from "zod";

const phoneValidation = z
  .string()
  .min(1, "Mobile number is required")
  .min(7, "Enter a valid mobile number")
  .max(10, "Mobile number is too long");

export const loginSchema = z.object({
  phone: phoneValidation,
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(1, "Full name is required")
    .min(2, "Full name must be at least 2 characters"),

  phone: phoneValidation,
});

export const otpSchema = z.object({
  otp: z
    .string()
    .min(1, "OTP code is required")
    .length(5, "OTP code must be 5 digits")
    .regex(/^\d+$/, "OTP code must contain only numbers"),
});

export const changePhoneStartSchema = z.object({
  oldPhone: phoneValidation,
});

export const changePhoneNewSchema = z.object({
  newPhone: phoneValidation,
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type OtpInput = z.infer<typeof otpSchema>;
export type ChangePhoneStartInput = z.infer<typeof changePhoneStartSchema>;
export type ChangePhoneNewInput = z.infer<typeof changePhoneNewSchema>;
