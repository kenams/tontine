import type { Request } from "express";

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  message?: string;
  error?: string;
  code?: string;
  pagination?: PaginationMeta;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  fullName: string;
};

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

export enum ErrorCode {
  UNAUTHORIZED = "UNAUTHORIZED",
  NOT_FOUND = "NOT_FOUND",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  FORBIDDEN = "FORBIDDEN",
  INTERNAL_ERROR = "INTERNAL_ERROR"
}

export enum TontineStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

export enum ContributionStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  LATE = "LATE",
  CANCELLED = "CANCELLED"
}

export enum Frequency {
  WEEKLY = "WEEKLY",
  BIWEEKLY = "BIWEEKLY",
  MONTHLY = "MONTHLY"
}

export type DemoUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  avatarUrl: string;
  trustScore: number;
  createdAt: string;
};

export type DemoTontine = {
  id: string;
  name: string;
  description: string;
  amount: number;
  frequency: Frequency;
  startDate: string;
  endDate: string;
  maxMembers: number;
  status: TontineStatus;
  createdBy: string;
  createdAt: string;
};

export type DemoMember = {
  id: string;
  tontineId: string;
  userId: string;
  orderPosition: number;
  joinDate: string;
  status: ContributionStatus;
  user?: DemoUser;
};

export type DemoContribution = {
  id: string;
  tontineId: string;
  userId: string;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  stripePaymentId: string | null;
  status: ContributionStatus;
};

export type DemoDistribution = {
  id: string;
  tontineId: string;
  beneficiaryId: string;
  amount: number;
  scheduledDate: string;
  paidDate: string | null;
  status: "SCHEDULED" | "PAID";
  beneficiary?: DemoUser;
};

export type DemoMessage = {
  id: string;
  tontineId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: DemoUser;
};

export type DemoNotification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: "payment_due" | "payment_received" | "member_joined" | "payout_turn";
  read: boolean;
  createdAt: string;
};

export type JwtPayloadData = AuthenticatedUser & {
  iat?: number;
  exp?: number;
};

