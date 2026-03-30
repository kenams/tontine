import type { PaginationMeta, TontineMessage } from "../types/entities";
import { PAGINATION } from "../config/constants";
import { apiCall } from "./api";
import { mapMessage } from "./mappers";

type BackendMessage = {
  id: string;
  tontineId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender?: {
    id: string;
    email: string;
    fullName: string;
    phone?: string;
    avatarUrl?: string;
    createdAt?: string;
  } | null;
};

export type MessagesResponse = {
  messages: TontineMessage[];
  pagination: PaginationMeta;
};

type BackendMessagesPayload = {
  messages: BackendMessage[];
  pagination: PaginationMeta;
};

/**
 * Recupere les messages d'une tontine.
 */
export async function getMessages(tontineId: string, page = PAGINATION.DEFAULT_PAGE): Promise<MessagesResponse> {
  const payload = await apiCall<BackendMessagesPayload>(
    "get",
    `/api/tontines/${tontineId}/messages?page=${page}&limit=${PAGINATION.CHAT_LIMIT}`
  );

  return {
    messages: payload.messages.map(mapMessage),
    pagination: payload.pagination
  };
}

/**
 * Envoie un message dans le chat d'une tontine.
 */
export async function sendMessage(tontineId: string, content: string): Promise<TontineMessage> {
  const payload = await apiCall<{ message: BackendMessage }>(
    "post",
    `/api/tontines/${tontineId}/messages`,
    { content }
  );

  return mapMessage(payload.message);
}
