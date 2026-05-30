import { create } from "zustand";

import { getMessages as getMessagesService, sendMessage as sendMessageService } from "../services/chatService";
import { useAuthStore } from "./authStore";
import type { TontineMessage } from "../types/entities";

type ChatStore = {
  messages: TontineMessage[];
  messagesByTontine: Record<string, TontineMessage[]>;
  unreadByTontine: Record<string, number>;
  unreadCount: number;
  activeTontineId: string | null;
  isLoading: boolean;
  errorMessage: string | null;
  fetchMessages: (tontineId: string) => Promise<TontineMessage[]>;
  sendMessage: (tontineId: string, content: string) => Promise<TontineMessage>;
  addMessage: (tontineId: string, message: TontineMessage) => void;
};

function computeUnread(map: Record<string, number>) {
  return Object.values(map).reduce((s, n) => s + n, 0);
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  messagesByTontine: {},
  unreadByTontine: {},
  unreadCount: 0,
  activeTontineId: null,
  isLoading: false,
  errorMessage: null,

  fetchMessages: async (tontineId) => {
    set({ isLoading: true, errorMessage: null });
    try {
      const payload = await getMessagesService(tontineId);
      const unread = { ...get().unreadByTontine, [tontineId]: 0 };
      set((s) => ({
        messages: payload.messages,
        messagesByTontine: { ...s.messagesByTontine, [tontineId]: payload.messages },
        activeTontineId: tontineId,
        unreadByTontine: unread,
        unreadCount: computeUnread(unread),
        isLoading: false,
        errorMessage: null,
      }));
      return payload.messages;
    } catch {
      set({ messages: [], activeTontineId: tontineId, isLoading: false, errorMessage: null });
      return [];
    }
  },

  sendMessage: async (tontineId, content) => {
    const trimmed = content.trim();
    if (!trimmed) throw new Error("Message vide.");
    const user = useAuthStore.getState().user;
    const temp: TontineMessage = {
      id: `temp-${Date.now()}`,
      tontineId,
      senderId: user?.id ?? "unknown",
      senderName: user?.fullName?.split(" ")[0] ?? "Moi",
      content: trimmed,
      createdAt: new Date().toISOString(),
      senderType: "user",
      avatarUrl: user?.avatarUrl,
    };
    const current = get().messagesByTontine[tontineId] ?? [];
    const optimistic = [...current, temp];
    set({
      messagesByTontine: { ...get().messagesByTontine, [tontineId]: optimistic },
      messages: optimistic,
      activeTontineId: tontineId,
      isLoading: true,
    });
    try {
      const persisted = await sendMessageService(tontineId, trimmed);
      const synced = optimistic.map((m) => (m.id === temp.id ? persisted : m));
      set({ messagesByTontine: { ...get().messagesByTontine, [tontineId]: synced }, messages: synced, isLoading: false });
      return persisted;
    } catch {
      set({ isLoading: false });
      return temp;
    }
  },

  addMessage: (tontineId, message) => {
    const current = get().messagesByTontine[tontineId] ?? [];
    if (current.some((m) => m.id === message.id)) return;
    const next = [...current, message];
    const isActive = get().activeTontineId === tontineId;
    const unread = {
      ...get().unreadByTontine,
      [tontineId]: isActive ? 0 : (get().unreadByTontine[tontineId] ?? 0) + 1,
    };
    set({
      messagesByTontine: { ...get().messagesByTontine, [tontineId]: next },
      messages: isActive ? next : get().messages,
      unreadByTontine: unread,
      unreadCount: computeUnread(unread),
    });
  },
}));
