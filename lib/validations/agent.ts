import { z } from "zod";

export const agentStatusSchema = z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]);

export const agentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Agent name must be at least 2 characters.")
    .max(100, "Agent name is too long."),

  mobile: z
    .string()
    .trim()
    .min(7, "Mobile number is required.")
    .max(20, "Mobile number is too long."),

  address: z
    .string()
    .trim()
    .min(5, "Address is required.")
    .max(500, "Address is too long."),

  promoCode: z
    .string()
    .trim()
    .min(3, "Promo code must be at least 3 characters.")
    .max(50, "Promo code is too long.")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Promo code can only contain letters, numbers, hyphens, and underscores.",
    ),

  status: agentStatusSchema,
});

export type AgentInput = z.infer<typeof agentSchema>;
