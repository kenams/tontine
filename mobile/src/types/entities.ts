export type MemberRole = "owner" | "member";
export type TontineStatus = "draft" | "open" | "active" | "completed" | "cancelled";
export type ContributionStatus = "pending" | "paid" | "late";
export type PayoutStatus = "scheduled" | "sent" | "received";
export type MessageSenderType = "user" | "system";
export type TontineFrequency = "weekly" | "biweekly" | "monthly";
export type NotificationType = "payment_due" | "payment_received" | "member_joined" | "payout_turn";

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  city?: string;
  createdAt: string;
};

export type Tontine = {
  id: string;
  name: string;
  description: string;
  contributionAmount: number;
  currency: "EUR";
  frequency: TontineFrequency;
  membersCount: number;
  currentRound: number;
  totalRounds: number;
  nextPayoutDate: string;
  status: TontineStatus;
  isPrivate: boolean;
  maxMembers?: number;
  totalPot?: number;
  currentBeneficiary?: string;
  myTurn?: number;
  startDate?: string;
  joinCode?: string;
  members?: TontineMember[];
  contributions?: TontineContribution[];
  distributions?: TontinePayout[];
  progression?: {
    paidMembers: number;
    totalMembers: number;
  };
};

export type TontineMember = {
  id: string;
  tontineId: string;
  userId: string;
  fullName: string;
  avatarUrl?: string;
  role: MemberRole;
  payoutOrder: number;
  paymentStatus?: ContributionStatus;
  joinedAt: string;
};

export type TontineContribution = {
  id: string;
  tontineId: string;
  memberId: string;
  amount: number;
  dueDate: string;
  paidAt?: string;
  status: ContributionStatus;
};

export type TontinePayout = {
  id: string;
  tontineId: string;
  beneficiaryId: string;
  amount: number;
  scheduledAt: string;
  status: PayoutStatus;
};

export type TontineMessage = {
  id: string;
  tontineId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  senderType: MessageSenderType;
  avatarUrl?: string;
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  tontineId?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
};

export type UpdateProfilePayload = Partial<Pick<UserProfile, "fullName" | "email" | "phone" | "phoneNumber" | "avatarUrl" | "city">>;

export type CreateTontinePayload = {
  name: string;
  contributionAmount: number;
  frequency: TontineFrequency;
  membersCount: number;
  description?: string;
  startDate?: string;
  isPrivate?: boolean;
};
