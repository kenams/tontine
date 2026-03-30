export type MemberRole = "owner" | "member";
export type TontineStatus = "draft" | "open" | "active" | "completed";
export type ContributionStatus = "pending" | "paid" | "late";
export type PayoutStatus = "scheduled" | "sent" | "received";
export type MessageSenderType = "user" | "system";

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
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
  frequency: "monthly";
  membersCount: number;
  currentRound: number;
  totalRounds: number;
  nextPayoutDate: string;
  status: TontineStatus;
  isPrivate: boolean;
};

export type TontineMember = {
  id: string;
  tontineId: string;
  userId: string;
  role: MemberRole;
  payoutOrder: number;
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
};
