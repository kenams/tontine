import type { RealtimeChannel } from "@supabase/supabase-js";

import { supabase, isSupabaseConfigured } from "./supabase/client";
import type { AppNotification, TontineContribution, TontineMessage } from "../types/entities";

type MessageRow = {
  id: string;
  tontine_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type ContributionRow = {
  id: string;
  tontine_id: string;
  user_id: string;
  amount: number;
  due_date: string;
  paid_date?: string | null;
  status: string;
};

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  created_at: string;
  data?: { tontineId?: string } | null;
};

function mapRealtimeMessage(row: MessageRow): TontineMessage {
  return {
    id: row.id,
    tontineId: row.tontine_id,
    senderId: row.sender_id,
    senderName: "Membre",
    content: row.content,
    createdAt: row.created_at,
    senderType: "user"
  };
}

function mapRealtimeContribution(row: ContributionRow): TontineContribution {
  return {
    id: row.id,
    tontineId: row.tontine_id,
    memberId: row.user_id,
    amount: row.amount,
    dueDate: row.due_date,
    paidAt: row.paid_date ?? undefined,
    status: row.status.toLowerCase() === "paid" ? "paid" : "pending"
  };
}

function mapRealtimeNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    type:
      row.type === "payment_received" ||
      row.type === "member_joined" ||
      row.type === "payout_turn"
        ? row.type
        : "payment_due",
    read: row.read,
    createdAt: row.created_at,
    tontineId: row.data?.tontineId
  };
}

/**
 * Abonnement temps reel aux messages d'une tontine.
 */
export function subscribeToMessages(
  tontineId: string,
  onMessage: (message: TontineMessage) => void
): RealtimeChannel | null {
  if (!isSupabaseConfigured) {
    return null;
  }

  return supabase
    .channel(`messages:${tontineId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `tontine_id=eq.${tontineId}`
      },
      (payload) => {
        onMessage(mapRealtimeMessage(payload.new as MessageRow));
      }
    )
    .subscribe();
}

/**
 * Abonnement temps reel aux cotisations.
 */
export function subscribeToContributions(
  tontineId: string,
  onUpdate: (contribution: TontineContribution) => void
): RealtimeChannel | null {
  if (!isSupabaseConfigured) {
    return null;
  }

  return supabase
    .channel(`contributions:${tontineId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "contributions",
        filter: `tontine_id=eq.${tontineId}`
      },
      (payload) => {
        onUpdate(mapRealtimeContribution(payload.new as ContributionRow));
      }
    )
    .subscribe();
}

/**
 * Abonnement temps reel aux notifications utilisateur.
 */
export function subscribeToNotifications(
  userId: string,
  onNotification: (notification: AppNotification) => void
): RealtimeChannel | null {
  if (!isSupabaseConfigured) {
    return null;
  }

  return supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        onNotification(mapRealtimeNotification(payload.new as NotificationRow));
      }
    )
    .subscribe();
}

/**
 * Detache un abonnement temps reel existant.
 */
export function unsubscribe(channel: RealtimeChannel | null) {
  if (!channel) {
    return;
  }

  void supabase.removeChannel(channel);
}

