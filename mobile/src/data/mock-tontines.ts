import type { Tontine, TontineMessage } from "../types/entities";

export const mockTontines: Tontine[] = [
  {
    id: "ton-1",
    name: "Tontine Soleil",
    description: "Un groupe simple pour epargner chaque mois entre amis.",
    contributionAmount: 150,
    currency: "EUR",
    frequency: "monthly",
    membersCount: 8,
    currentRound: 3,
    totalRounds: 8,
    nextPayoutDate: "2026-04-05",
    status: "active",
    isPrivate: true
  },
  {
    id: "ton-2",
    name: "Projet Maison",
    description: "Une cagnotte collective pensee pour les grands projets familiaux.",
    contributionAmount: 250,
    currency: "EUR",
    frequency: "monthly",
    membersCount: 6,
    currentRound: 1,
    totalRounds: 6,
    nextPayoutDate: "2026-04-18",
    status: "open",
    isPrivate: false
  }
];

export const mockMessages: Record<string, TontineMessage[]> = {
  "ton-1": [
    {
      id: "msg-1",
      tontineId: "ton-1",
      senderId: "system",
      senderName: "Systeme",
      content: "Le prochain versement est prevu le 5 avril.",
      createdAt: "2026-03-28T09:00:00.000Z",
      senderType: "system"
    },
    {
      id: "msg-2",
      tontineId: "ton-1",
      senderId: "usr-1",
      senderName: "Nadia",
      content: "Je valide ma participation de ce mois.",
      createdAt: "2026-03-28T09:30:00.000Z",
      senderType: "user"
    }
  ]
};
