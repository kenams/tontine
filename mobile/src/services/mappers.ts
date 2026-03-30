import type {
  AppNotification,
  ContributionStatus,
  NotificationType,
  Tontine,
  TontineContribution,
  TontineFrequency,
  TontineMember,
  TontineMessage,
  TontinePayout,
  TontineStatus,
  UserProfile
} from "../types/entities";

type BackendUser = {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  createdAt?: string;
};

type BackendTontineProgression = {
  paidMembers: number;
  totalMembers: number;
};

type BackendMember = {
  id: string;
  tontineId: string;
  userId: string;
  orderPosition: number;
  joinDate: string;
  status: string;
  user?: BackendUser | null;
};

type BackendContribution = {
  id: string;
  tontineId: string;
  userId: string;
  amount: number;
  dueDate: string;
  paidDate?: string | null;
  status: string;
};

type BackendDistribution = {
  id: string;
  tontineId: string;
  beneficiaryId: string;
  amount: number;
  scheduledDate: string;
  paidDate?: string | null;
  status: string;
  beneficiary?: BackendUser | null;
};

type BackendMessage = {
  id: string;
  tontineId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: BackendUser | null;
};

type BackendNotification = {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
  tontineId?: string;
};

type BackendTontine = {
  id: string;
  name: string;
  description: string;
  amount: number;
  frequency: string;
  startDate: string;
  endDate: string;
  maxMembers: number;
  status: string;
  createdBy: string;
  createdAt: string;
  membersCount?: number;
  progression?: BackendTontineProgression;
  members?: BackendMember[];
  contributions?: BackendContribution[];
  distributions?: BackendDistribution[];
};

function mapFrequency(value: string): TontineFrequency {
  switch (value.toUpperCase()) {
    case "WEEKLY":
      return "weekly";
    case "BIWEEKLY":
      return "biweekly";
    default:
      return "monthly";
  }
}

function mapTontineStatus(value: string): TontineStatus {
  switch (value.toUpperCase()) {
    case "ACTIVE":
      return "active";
    case "COMPLETED":
      return "completed";
    case "PENDING":
      return "draft";
    default:
      return "open";
  }
}

function mapContributionStatus(value: string): ContributionStatus {
  switch (value.toUpperCase()) {
    case "PAID":
      return "paid";
    case "LATE":
      return "late";
    default:
      return "pending";
  }
}

function mapNotificationType(value: string): NotificationType {
  switch (value) {
    case "payment_due":
    case "payment_received":
    case "member_joined":
    case "payout_turn":
      return value;
    default:
      return "payment_due";
  }
}

/**
 * Normalise un utilisateur backend vers le type mobile.
 */
export function mapUser(input: BackendUser): UserProfile {
  return {
    id: input.id,
    email: input.email,
    fullName: input.fullName,
    phone: input.phone,
    phoneNumber: input.phone,
    avatarUrl: input.avatarUrl,
    createdAt: input.createdAt ?? new Date().toISOString()
  };
}

/**
 * Normalise un membre backend vers le type mobile.
 */
export function mapMember(input: BackendMember): TontineMember {
  const user = input.user ?? null;

  return {
    id: input.id,
    tontineId: input.tontineId,
    userId: input.userId,
    fullName: user?.fullName ?? "Membre",
    avatarUrl: user?.avatarUrl,
    role: input.orderPosition === 1 ? "owner" : "member",
    payoutOrder: input.orderPosition,
    paymentStatus: mapContributionStatus(input.status),
    joinedAt: input.joinDate
  };
}

/**
 * Normalise une cotisation backend vers le type mobile.
 */
export function mapContribution(input: BackendContribution, members?: TontineMember[]): TontineContribution {
  const matchingMember = members?.find((member) => member.userId === input.userId);

  return {
    id: input.id,
    tontineId: input.tontineId,
    memberId: matchingMember?.id ?? input.userId,
    amount: input.amount,
    dueDate: input.dueDate,
    paidAt: input.paidDate ?? undefined,
    status: mapContributionStatus(input.status)
  };
}

/**
 * Normalise une distribution backend vers le type mobile.
 */
export function mapDistribution(input: BackendDistribution): TontinePayout {
  return {
    id: input.id,
    tontineId: input.tontineId,
    beneficiaryId: input.beneficiaryId,
    amount: input.amount,
    scheduledAt: input.scheduledDate,
    status: input.status === "PAID" ? "received" : "scheduled"
  };
}

/**
 * Normalise un message backend vers le type mobile.
 */
export function mapMessage(input: BackendMessage): TontineMessage {
  return {
    id: input.id,
    tontineId: input.tontineId,
    senderId: input.senderId,
    senderName: input.sender?.fullName ?? "Membre",
    content: input.content,
    createdAt: input.createdAt,
    senderType: "user",
    avatarUrl: input.sender?.avatarUrl
  };
}

/**
 * Normalise une notification backend vers le type mobile.
 */
export function mapNotification(input: BackendNotification): AppNotification {
  return {
    id: input.id,
    title: input.title,
    body: input.body,
    type: mapNotificationType(input.type),
    read: input.read,
    createdAt: input.createdAt,
    tontineId: input.tontineId
  };
}

/**
 * Normalise une tontine backend vers le type mobile.
 */
export function mapTontine(input: BackendTontine, currentUserId?: string): Tontine {
  const members = input.members?.map(mapMember);
  const contributions = input.contributions?.map((contribution) => mapContribution(contribution, members));
  const distributions = input.distributions?.map(mapDistribution);
  const paidMembers =
    input.progression?.paidMembers ??
    contributions?.filter((contribution) => contribution.status === "paid").length ??
    0;
  const totalMembers = input.membersCount ?? members?.length ?? input.maxMembers;
  const currentRound = (distributions?.length ?? 0) + 1;
  const myMember = members?.find((member) => member.userId === currentUserId);
  const nextBeneficiary = members
    ?.slice()
    .sort((left, right) => left.payoutOrder - right.payoutOrder)
    .find((member) => member.payoutOrder >= currentRound);

  return {
    id: input.id,
    name: input.name,
    description: input.description,
    contributionAmount: input.amount,
    currency: "EUR",
    frequency: mapFrequency(input.frequency),
    membersCount: totalMembers,
    currentRound,
    totalRounds: input.maxMembers,
    nextPayoutDate: input.endDate,
    status: mapTontineStatus(input.status),
    isPrivate: true,
    maxMembers: input.maxMembers,
    totalPot: input.amount * totalMembers,
    currentBeneficiary: nextBeneficiary?.fullName,
    myTurn: myMember ? myMember.payoutOrder : 0,
    startDate: input.startDate,
    members,
    contributions,
    distributions,
    progression: {
      paidMembers,
      totalMembers
    }
  };
}
