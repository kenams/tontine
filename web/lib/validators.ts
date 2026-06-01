import { z } from "zod";

import { currencyCodes } from "@/lib/currency";

export const loginSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8)
});

export const registerSchema = z.object({
  fullName: z.string().min(2).max(80),
  email: z.string().email().transform((value) => value.toLowerCase()),
  phone: z.string().min(6).max(24).optional().or(z.literal("")),
  currency: z.enum(currencyCodes).default("XOF"),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/)
});

export const createTontineSchema = z.object({
  name: z.string().min(3).max(80),
  description: z.string().min(8).max(300),
  contributionAmount: z.coerce.number().positive().max(2_000_000),
  currency: z.enum(currencyCodes).default("XOF"),
  frequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]),
  maxMembers: z.coerce.number().int().min(3).max(30),
  rules: z.string().min(10).max(600),
  minTrustScore: z.coerce.number().int().min(0).max(100).default(0),
  requireFullPayment: z.coerce.boolean().default(false),
  autoExcludeDays: z.coerce.number().int().min(7).max(90).default(30),
});

export const updateGroupSettingsSchema = z.object({
  minTrustScore: z.coerce.number().int().min(0).max(100).optional(),
  requireFullPayment: z.coerce.boolean().optional(),
  autoExcludeDays: z.coerce.number().int().min(7).max(90).optional(),
  latePenaltyCents: z.coerce.number().int().min(0).max(5000).optional(),
  emergencyFundBps: z.coerce.number().int().min(0).max(1000).optional(),
});

export const joinSchema = z.object({
  joinCode: z.string().min(4).max(20).transform((value) => value.trim().toUpperCase())
});

export const inviteSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase())
});

export const messageSchema = z.object({
  content: z.string().min(1).max(1000)
});

export const contributionSchema = z.object({
  provider: z
    .enum(["WALLET", "ORANGE_MONEY", "MTN_MOMO", "WAVE", "FLUTTERWAVE", "STRIPE", "CARD_GLOBAL", "BANK_TRANSFER"])
    .default("WALLET")
});

export const adminUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "REVIEW", "SUSPENDED", "BANNED"])
});
