import {
  ContributionStatus,
  Frequency,
  TontineStatus,
  type DemoContribution,
  type DemoDistribution,
  type DemoMember,
  type DemoMessage,
  type DemoNotification,
  type DemoTontine,
  type DemoUser
} from "../types/api.types";

export const DEMO_USERS: DemoUser[] = [
  { id: "user-001", email: "kenams@tontineapp.fr", fullName: "Kenams Diarra", phone: "+33 6 12 34 56 78", avatarUrl: "https://i.pravatar.cc/160?img=12", trustScore: 98, createdAt: "2026-03-01T08:00:00.000Z" },
  { id: "user-002", email: "mamadou@tontineapp.fr", fullName: "Mamadou Diarra", phone: "+33 6 20 12 00 11", avatarUrl: "https://i.pravatar.cc/160?img=15", trustScore: 96, createdAt: "2026-02-11T09:30:00.000Z" },
  { id: "user-003", email: "sophie@tontineapp.fr", fullName: "Sophie Martin", phone: "+33 6 33 22 10 40", avatarUrl: "https://i.pravatar.cc/160?img=32", trustScore: 95, createdAt: "2026-02-18T14:00:00.000Z" },
  { id: "user-004", email: "ali@tontineapp.fr", fullName: "Ali Kone", phone: "+33 6 55 44 12 11", avatarUrl: "https://i.pravatar.cc/160?img=14", trustScore: 93, createdAt: "2026-02-03T11:10:00.000Z" },
  { id: "user-005", email: "fatou@tontineapp.fr", fullName: "Fatou Traore", phone: "+33 6 91 45 33 28", avatarUrl: "https://i.pravatar.cc/160?img=47", trustScore: 97, createdAt: "2026-01-28T17:20:00.000Z" },
  { id: "user-006", email: "nadia@tontineapp.fr", fullName: "Nadia Benali", phone: "+33 6 72 61 90 03", avatarUrl: "https://i.pravatar.cc/160?img=5", trustScore: 92, createdAt: "2026-03-08T10:15:00.000Z" }
];

export const DEMO_TONTINES: DemoTontine[] = [
  { id: "t-001", name: "Tontine Famille", description: "Un cercle familial mensuel pour les projets de la maison et les imprévus importants.", amount: 200, frequency: Frequency.MONTHLY, startDate: "2026-01-03T09:00:00.000Z", endDate: "2026-09-03T09:00:00.000Z", maxMembers: 8, status: TontineStatus.ACTIVE, createdBy: "user-001", createdAt: "2026-01-01T09:00:00.000Z" },
  { id: "t-002", name: "Tontine Amis Lyon", description: "Une tontine souple entre amis pour financer voyages et achats importants.", amount: 100, frequency: Frequency.MONTHLY, startDate: "2026-03-10T18:30:00.000Z", endDate: "2026-08-10T18:30:00.000Z", maxMembers: 5, status: TontineStatus.ACTIVE, createdBy: "user-001", createdAt: "2026-03-02T12:00:00.000Z" },
  { id: "t-003", name: "Tontine Collègues", description: "Un groupe professionnel bimensuel pour se constituer une réserve commune.", amount: 50, frequency: Frequency.BIWEEKLY, startDate: "2026-02-01T12:00:00.000Z", endDate: "2026-06-15T12:00:00.000Z", maxMembers: 10, status: TontineStatus.ACTIVE, createdBy: "user-004", createdAt: "2026-01-28T13:15:00.000Z" }
];

export const DEMO_MEMBERS: DemoMember[] = [
  { id: "m-001", tontineId: "t-001", userId: "user-001", orderPosition: 3, joinDate: "2026-01-03T09:00:00.000Z", status: ContributionStatus.PAID },
  { id: "m-002", tontineId: "t-001", userId: "user-002", orderPosition: 1, joinDate: "2026-01-03T09:00:00.000Z", status: ContributionStatus.PAID },
  { id: "m-003", tontineId: "t-001", userId: "user-003", orderPosition: 2, joinDate: "2026-01-03T09:00:00.000Z", status: ContributionStatus.PENDING },
  { id: "m-004", tontineId: "t-001", userId: "user-004", orderPosition: 4, joinDate: "2026-01-03T09:00:00.000Z", status: ContributionStatus.PAID },
  { id: "m-005", tontineId: "t-002", userId: "user-001", orderPosition: 1, joinDate: "2026-03-10T18:30:00.000Z", status: ContributionStatus.PAID },
  { id: "m-006", tontineId: "t-002", userId: "user-003", orderPosition: 2, joinDate: "2026-03-10T18:30:00.000Z", status: ContributionStatus.PAID },
  { id: "m-007", tontineId: "t-002", userId: "user-005", orderPosition: 3, joinDate: "2026-03-10T18:30:00.000Z", status: ContributionStatus.PENDING },
  { id: "m-008", tontineId: "t-003", userId: "user-001", orderPosition: 6, joinDate: "2026-02-01T12:00:00.000Z", status: ContributionStatus.PENDING },
  { id: "m-009", tontineId: "t-003", userId: "user-004", orderPosition: 1, joinDate: "2026-02-01T12:00:00.000Z", status: ContributionStatus.PAID }
];

export const DEMO_CONTRIBUTIONS: DemoContribution[] = [
  { id: "c-001", tontineId: "t-001", userId: "user-001", amount: 200, dueDate: "2026-03-30T00:00:00.000Z", paidDate: "2026-03-22T11:00:00.000Z", stripePaymentId: "pi_demo_001", status: ContributionStatus.PAID },
  { id: "c-002", tontineId: "t-001", userId: "user-003", amount: 200, dueDate: "2026-03-30T00:00:00.000Z", paidDate: null, stripePaymentId: null, status: ContributionStatus.PENDING },
  { id: "c-003", tontineId: "t-001", userId: "user-004", amount: 200, dueDate: "2026-03-30T00:00:00.000Z", paidDate: "2026-03-23T09:30:00.000Z", stripePaymentId: "pi_demo_002", status: ContributionStatus.PAID },
  { id: "c-004", tontineId: "t-002", userId: "user-001", amount: 100, dueDate: "2026-04-08T00:00:00.000Z", paidDate: "2026-03-25T12:15:00.000Z", stripePaymentId: "pi_demo_003", status: ContributionStatus.PAID },
  { id: "c-005", tontineId: "t-002", userId: "user-005", amount: 100, dueDate: "2026-04-08T00:00:00.000Z", paidDate: null, stripePaymentId: null, status: ContributionStatus.PENDING },
  { id: "c-006", tontineId: "t-003", userId: "user-001", amount: 50, dueDate: "2026-03-31T00:00:00.000Z", paidDate: null, stripePaymentId: null, status: ContributionStatus.PENDING }
];

export const DEMO_DISTRIBUTIONS: DemoDistribution[] = [
  { id: "d-001", tontineId: "t-001", beneficiaryId: "user-002", amount: 1600, scheduledDate: "2026-02-03T09:00:00.000Z", paidDate: "2026-02-03T10:00:00.000Z", status: "PAID" },
  { id: "d-002", tontineId: "t-001", beneficiaryId: "user-003", amount: 1600, scheduledDate: "2026-03-03T09:00:00.000Z", paidDate: "2026-03-03T10:00:00.000Z", status: "PAID" },
  { id: "d-003", tontineId: "t-002", beneficiaryId: "user-003", amount: 500, scheduledDate: "2026-03-10T18:30:00.000Z", paidDate: "2026-03-10T18:45:00.000Z", status: "PAID" }
];

export const DEMO_MESSAGES: DemoMessage[] = [
  { id: "msg-001", tontineId: "t-001", senderId: "user-002", content: "Merci à tous pour ce mois ! 🙏", createdAt: "2026-03-25T18:12:00.000Z" },
  { id: "msg-002", tontineId: "t-001", senderId: "user-003", content: "Super organisation comme toujours 👏", createdAt: "2026-03-26T08:20:00.000Z" },
  { id: "msg-003", tontineId: "t-001", senderId: "user-001", content: "Le prochain c'est moi, j'ai hâte !", createdAt: "2026-03-26T09:02:00.000Z" },
  { id: "msg-004", tontineId: "t-001", senderId: "user-004", content: "Rappel : cotisation avant le 30 du mois", createdAt: "2026-03-27T07:45:00.000Z" },
  { id: "msg-005", tontineId: "t-001", senderId: "user-005", content: "Reçu, merci Ali pour le rappel ✅", createdAt: "2026-03-27T09:05:00.000Z" },
  { id: "msg-006", tontineId: "t-002", senderId: "user-003", content: "Je confirme mon virement pour demain.", createdAt: "2026-03-28T16:30:00.000Z" }
];

export const DEMO_NOTIFICATIONS: DemoNotification[] = [
  { id: "n-001", userId: "user-001", title: "Cotisation bientôt due", body: "⏰ Rappel : votre cotisation de 200€ est due dans 3 jours", type: "payment_due", read: false, createdAt: "2026-03-28T08:00:00.000Z" },
  { id: "n-002", userId: "user-001", title: "Paiement confirmé", body: "✅ Votre paiement de 100€ a été confirmé", type: "payment_received", read: false, createdAt: "2026-03-27T16:30:00.000Z" },
  { id: "n-003", userId: "user-001", title: "Nouveau membre", body: "👋 Ali Koné a rejoint Tontine Famille", type: "member_joined", read: true, createdAt: "2026-03-26T12:10:00.000Z" },
  { id: "n-004", userId: "user-001", title: "Tour de bénéfice", body: "🎉 C'est votre tour ! Vous recevez 500€ ce mois", type: "payout_turn", read: false, createdAt: "2026-03-25T09:00:00.000Z" }
];

/**
 * Retourne un utilisateur de démonstration par identifiant.
 */
export function findDemoUser(userId: string) {
  return DEMO_USERS.find((user) => user.id === userId) ?? null;
}

/**
 * Génère un identifiant simple pour le mode démonstration.
 */
export function createDemoId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

