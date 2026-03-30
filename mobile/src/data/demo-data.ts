import type {
  AppNotification,
  Tontine,
  TontineContribution,
  TontineMember,
  TontineMessage,
  TontinePayout,
  UserProfile
} from "../types/entities";

export const demoUser: UserProfile = {
  id: "user-001",
  email: "kenams@tontineapp.fr",
  fullName: "Kenams Diarra",
  phone: "+33 6 12 34 56 78",
  phoneNumber: "+33 6 12 34 56 78",
  city: "Lyon",
  avatarUrl: "https://i.pravatar.cc/160?img=12",
  createdAt: "2026-03-01T08:00:00.000Z"
};

export const demoTontines: Tontine[] = [
  {
    id: "t-001",
    name: "Tontine Famille",
    description: "Un cercle familial mensuel pour preparer les projets de la maison et les imprévus importants.",
    contributionAmount: 200,
    currency: "EUR",
    frequency: "monthly",
    membersCount: 8,
    currentRound: 3,
    totalRounds: 8,
    nextPayoutDate: "2026-04-03T09:00:00.000Z",
    status: "active",
    isPrivate: true,
    maxMembers: 8,
    totalPot: 1600,
    currentBeneficiary: "Mamadou",
    myTurn: 3,
    startDate: "2026-01-03T09:00:00.000Z",
    joinCode: "FAM-2026"
  },
  {
    id: "t-002",
    name: "Tontine Amis Lyon",
    description: "Une tontine souple entre amis pour financer voyages, projets persos et achats importants.",
    contributionAmount: 100,
    currency: "EUR",
    frequency: "monthly",
    membersCount: 5,
    currentRound: 1,
    totalRounds: 5,
    nextPayoutDate: "2026-04-10T18:30:00.000Z",
    status: "active",
    isPrivate: false,
    maxMembers: 5,
    totalPot: 500,
    currentBeneficiary: "Sophie",
    myTurn: 1,
    startDate: "2026-03-10T18:30:00.000Z",
    joinCode: "LYON-AMI"
  },
  {
    id: "t-003",
    name: "Tontine Colleagues",
    description: "Un groupe professionnel bimensuel pour epargner ensemble autour de petits objectifs de securite.",
    contributionAmount: 50,
    currency: "EUR",
    frequency: "biweekly",
    membersCount: 10,
    currentRound: 5,
    totalRounds: 10,
    nextPayoutDate: "2026-04-01T12:00:00.000Z",
    status: "active",
    isPrivate: true,
    maxMembers: 10,
    totalPot: 500,
    currentBeneficiary: "Tu es le prochain !",
    myTurn: 0,
    startDate: "2026-02-01T12:00:00.000Z",
    joinCode: "WORK-50"
  }
];

export const demoMembersByTontine: Record<string, TontineMember[]> = {
  "t-001": [
    {
      id: "tm-001",
      tontineId: "t-001",
      userId: "user-001",
      fullName: "Kenams Diarra",
      avatarUrl: "https://i.pravatar.cc/120?img=12",
      role: "member",
      payoutOrder: 3,
      paymentStatus: "paid",
      joinedAt: "2026-01-03T09:00:00.000Z"
    },
    {
      id: "tm-002",
      tontineId: "t-001",
      userId: "user-002",
      fullName: "Mamadou Diarra",
      avatarUrl: "https://i.pravatar.cc/120?img=15",
      role: "owner",
      payoutOrder: 1,
      paymentStatus: "paid",
      joinedAt: "2026-01-03T09:00:00.000Z"
    },
    {
      id: "tm-003",
      tontineId: "t-001",
      userId: "user-003",
      fullName: "Sophie Traore",
      avatarUrl: "https://i.pravatar.cc/120?img=32",
      role: "member",
      payoutOrder: 2,
      paymentStatus: "pending",
      joinedAt: "2026-01-03T09:00:00.000Z"
    },
    {
      id: "tm-004",
      tontineId: "t-001",
      userId: "user-004",
      fullName: "Ali Kone",
      avatarUrl: "https://i.pravatar.cc/120?img=14",
      role: "member",
      payoutOrder: 4,
      paymentStatus: "paid",
      joinedAt: "2026-01-03T09:00:00.000Z"
    }
  ],
  "t-002": [
    {
      id: "tm-005",
      tontineId: "t-002",
      userId: "user-001",
      fullName: "Kenams Diarra",
      avatarUrl: "https://i.pravatar.cc/120?img=12",
      role: "owner",
      payoutOrder: 1,
      paymentStatus: "paid",
      joinedAt: "2026-03-10T18:30:00.000Z"
    },
    {
      id: "tm-006",
      tontineId: "t-002",
      userId: "user-005",
      fullName: "Sophie Martin",
      avatarUrl: "https://i.pravatar.cc/120?img=18",
      role: "member",
      payoutOrder: 2,
      paymentStatus: "paid",
      joinedAt: "2026-03-10T18:30:00.000Z"
    }
  ],
  "t-003": [
    {
      id: "tm-007",
      tontineId: "t-003",
      userId: "user-001",
      fullName: "Kenams Diarra",
      avatarUrl: "https://i.pravatar.cc/120?img=12",
      role: "member",
      payoutOrder: 6,
      paymentStatus: "pending",
      joinedAt: "2026-02-01T12:00:00.000Z"
    }
  ]
};

export const demoContributionsByTontine: Record<string, TontineContribution[]> = {
  "t-001": [
    {
      id: "con-001",
      tontineId: "t-001",
      memberId: "tm-001",
      amount: 200,
      dueDate: "2026-03-30T00:00:00.000Z",
      paidAt: "2026-03-22T11:00:00.000Z",
      status: "paid"
    },
    {
      id: "con-002",
      tontineId: "t-001",
      memberId: "tm-003",
      amount: 200,
      dueDate: "2026-03-30T00:00:00.000Z",
      status: "pending"
    },
    {
      id: "con-003",
      tontineId: "t-001",
      memberId: "tm-004",
      amount: 200,
      dueDate: "2026-03-30T00:00:00.000Z",
      paidAt: "2026-03-23T09:30:00.000Z",
      status: "paid"
    }
  ],
  "t-002": [
    {
      id: "con-004",
      tontineId: "t-002",
      memberId: "tm-005",
      amount: 100,
      dueDate: "2026-04-08T00:00:00.000Z",
      paidAt: "2026-03-25T12:15:00.000Z",
      status: "paid"
    },
    {
      id: "con-005",
      tontineId: "t-002",
      memberId: "tm-006",
      amount: 100,
      dueDate: "2026-04-08T00:00:00.000Z",
      status: "pending"
    }
  ],
  "t-003": [
    {
      id: "con-006",
      tontineId: "t-003",
      memberId: "tm-007",
      amount: 50,
      dueDate: "2026-03-31T00:00:00.000Z",
      status: "pending"
    }
  ]
};

export const demoPayoutsByTontine: Record<string, TontinePayout[]> = {
  "t-001": [
    {
      id: "pay-001",
      tontineId: "t-001",
      beneficiaryId: "user-002",
      amount: 1600,
      scheduledAt: "2026-02-03T09:00:00.000Z",
      status: "received"
    },
    {
      id: "pay-002",
      tontineId: "t-001",
      beneficiaryId: "user-003",
      amount: 1600,
      scheduledAt: "2026-03-03T09:00:00.000Z",
      status: "received"
    }
  ],
  "t-002": [
    {
      id: "pay-003",
      tontineId: "t-002",
      beneficiaryId: "user-005",
      amount: 500,
      scheduledAt: "2026-03-10T18:30:00.000Z",
      status: "sent"
    }
  ],
  "t-003": []
};

export const demoMessagesByTontine: Record<string, TontineMessage[]> = {
  "t-001": [
    {
      id: "msg-001",
      tontineId: "t-001",
      senderId: "user-002",
      senderName: "Mamadou",
      content: "Merci a tous pour ce mois ! 🙏",
      createdAt: "2026-03-25T18:12:00.000Z",
      senderType: "user",
      avatarUrl: "https://i.pravatar.cc/120?img=15"
    },
    {
      id: "msg-002",
      tontineId: "t-001",
      senderId: "user-003",
      senderName: "Sophie",
      content: "Super organisation comme toujours 👏",
      createdAt: "2026-03-26T08:20:00.000Z",
      senderType: "user",
      avatarUrl: "https://i.pravatar.cc/120?img=32"
    },
    {
      id: "msg-003",
      tontineId: "t-001",
      senderId: "user-001",
      senderName: "Kenams",
      content: "Le prochain c'est moi, j'ai hate !",
      createdAt: "2026-03-26T09:02:00.000Z",
      senderType: "user",
      avatarUrl: "https://i.pravatar.cc/120?img=12"
    },
    {
      id: "msg-004",
      tontineId: "t-001",
      senderId: "user-004",
      senderName: "Ali",
      content: "Rappel : cotisation avant le 30 du mois",
      createdAt: "2026-03-27T07:45:00.000Z",
      senderType: "user",
      avatarUrl: "https://i.pravatar.cc/120?img=14"
    },
    {
      id: "msg-005",
      tontineId: "t-001",
      senderId: "user-006",
      senderName: "Fatou",
      content: "Recu, merci Ali pour le rappel ✅",
      createdAt: "2026-03-27T09:05:00.000Z",
      senderType: "user",
      avatarUrl: "https://i.pravatar.cc/120?img=47"
    },
    {
      id: "msg-006",
      tontineId: "t-001",
      senderId: "system",
      senderName: "Systeme",
      content: "Le prochain beneficiaire recevra la cagnotte le 3 avril.",
      createdAt: "2026-03-28T10:15:00.000Z",
      senderType: "system"
    }
  ],
  "t-002": [
    {
      id: "msg-007",
      tontineId: "t-002",
      senderId: "user-005",
      senderName: "Sophie",
      content: "Je confirme mon virement pour demain.",
      createdAt: "2026-03-28T16:30:00.000Z",
      senderType: "user",
      avatarUrl: "https://i.pravatar.cc/120?img=18"
    }
  ],
  "t-003": []
};

export const demoNotifications: AppNotification[] = [
  {
    id: "notif-001",
    title: "Cotisation bientot due",
    body: "⏰ Rappel : votre cotisation de 200€ est due dans 3 jours",
    type: "payment_due",
    read: false,
    createdAt: "2026-03-28T08:00:00.000Z",
    tontineId: "t-001"
  },
  {
    id: "notif-002",
    title: "Paiement confirme",
    body: "✅ Votre paiement de 100€ a ete confirme",
    type: "payment_received",
    read: false,
    createdAt: "2026-03-27T16:30:00.000Z",
    tontineId: "t-002"
  },
  {
    id: "notif-003",
    title: "Nouveau membre",
    body: "👋 Ali Kone a rejoint Tontine Famille",
    type: "member_joined",
    read: true,
    createdAt: "2026-03-26T12:10:00.000Z",
    tontineId: "t-001"
  },
  {
    id: "notif-004",
    title: "Tour de benefice",
    body: "🎉 C'est votre tour ! Vous recevez 500€ ce mois",
    type: "payout_turn",
    read: false,
    createdAt: "2026-03-25T09:00:00.000Z",
    tontineId: "t-003"
  }
];

export function cloneDemoTontines() {
  return demoTontines.map((tontine) => ({ ...tontine }));
}

export function cloneDemoNotifications() {
  return demoNotifications.map((notification) => ({ ...notification }));
}

export function cloneDemoMessages() {
  return Object.fromEntries(
    Object.entries(demoMessagesByTontine).map(([tontineId, messages]) => [
      tontineId,
      messages.map((message) => ({ ...message }))
    ])
  ) as Record<string, TontineMessage[]>;
}

export function cloneDemoContributions() {
  return Object.fromEntries(
    Object.entries(demoContributionsByTontine).map(([tontineId, contributions]) => [
      tontineId,
      contributions.map((contribution) => ({ ...contribution }))
    ])
  ) as Record<string, TontineContribution[]>;
}

