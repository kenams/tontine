import { create } from "zustand";

import { cloneDemoMessages, demoUser } from "../data/demo-data";
import { getMessages as getMessagesService, sendMessage as sendMessageService } from "../services/chatService";
import { useAppStore } from "./appStore";
import { useAuthStore } from "./authStore";
import type { TontineMessage } from "../types/entities";
import { createDemoId } from "./store-utils";
import { devLog } from "../utils/logger";

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

function computeUnreadCount(unreadByTontine: Record<string, number>) {
  return Object.values(unreadByTontine).reduce((sum, count) => sum + count, 0);
}

const initialMessages = cloneDemoMessages();

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  messagesByTontine: initialMessages,
  unreadByTontine: {
    "t-001": 3,
    "t-002": 1,
    "t-003": 0
  },
  unreadCount: 4,
  activeTontineId: null,
  isLoading: false,
  errorMessage: null,

  fetchMessages: async (tontineId) => {
    set({ isLoading: true, errorMessage: null });

    try {
      const payload = await getMessagesService(tontineId);
      const unreadByTontine = {
        ...get().unreadByTontine,
        [tontineId]: 0
      };

      set((state) => ({
        messages: payload.messages,
        messagesByTontine: {
          ...state.messagesByTontine,
          [tontineId]: payload.messages
        },
        activeTontineId: tontineId,
        unreadByTontine,
        unreadCount: computeUnreadCount(unreadByTontine),
        isLoading: false,
        errorMessage: null
      }));
      useAppStore.setState({ isBackendAvailable: true, isDemoMode: false });

      return payload.messages;
    } catch {
      const messages = get().messagesByTontine[tontineId]?.map((message) => ({ ...message })) ?? [];
      const unreadByTontine = {
        ...get().unreadByTontine,
        [tontineId]: 0
      };
      devLog("Mode demo active pour le chat");

      set({
        messages,
        activeTontineId: tontineId,
        unreadByTontine,
        unreadCount: computeUnreadCount(unreadByTontine),
        isLoading: false,
        errorMessage: null
      });
      useAppStore.setState({ isBackendAvailable: false, isDemoMode: true });

      return messages;
    }
  },

  sendMessage: async (tontineId, content) => {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      set({ errorMessage: "Le message ne peut pas etre vide." });
      throw new Error("Le message ne peut pas etre vide.");
    }

    const user = useAuthStore.getState().user ?? demoUser;
    const temporaryMessage: TontineMessage = {
      id: `temp-${Date.now()}`,
      tontineId,
      senderId: user.id,
      senderName: user.fullName.split(" ")[0] ?? user.fullName,
      content: trimmedContent,
      createdAt: new Date().toISOString(),
      senderType: "user",
      avatarUrl: user.avatarUrl
    };

    const currentMessages = get().messagesByTontine[tontineId] ?? [];
    const optimisticMessages = [...currentMessages, temporaryMessage];

    set({
      messagesByTontine: {
        ...get().messagesByTontine,
        [tontineId]: optimisticMessages
      },
      messages: optimisticMessages,
      activeTontineId: tontineId,
      isLoading: true,
      errorMessage: null
    });

    try {
      const persistedMessage = await sendMessageService(tontineId, trimmedContent);
      const syncedMessages = optimisticMessages.map((message) =>
        message.id === temporaryMessage.id ? persistedMessage : message
      );
      const unreadByTontine = {
        ...get().unreadByTontine,
        [tontineId]: 0
      };

      set({
        messagesByTontine: {
          ...get().messagesByTontine,
          [tontineId]: syncedMessages
        },
        messages: syncedMessages,
        unreadByTontine,
        unreadCount: computeUnreadCount(unreadByTontine),
        isLoading: false,
        errorMessage: null
      });
      useAppStore.setState({ isBackendAvailable: true, isDemoMode: false });

      return persistedMessage;
    } catch {
      const unreadByTontine = {
        ...get().unreadByTontine,
        [tontineId]: 0
      };
      devLog("Mode demo active pour l'envoi de message");

      set({
        messagesByTontine: {
          ...get().messagesByTontine,
          [tontineId]: optimisticMessages
        },
        messages: optimisticMessages,
        unreadByTontine,
        unreadCount: computeUnreadCount(unreadByTontine),
        isLoading: false,
        errorMessage: null
      });
      useAppStore.setState({ isBackendAvailable: false, isDemoMode: true });

      return temporaryMessage;
    }
  },

  addMessage: (tontineId, message) => {
    const currentMessages = get().messagesByTontine[tontineId] ?? [];

    if (currentMessages.some((existingMessage) => existingMessage.id === message.id)) {
      return;
    }

    const nextMessages = [...currentMessages, message];
    const isActive = get().activeTontineId === tontineId;
    const unreadByTontine = {
      ...get().unreadByTontine,
      [tontineId]: isActive ? 0 : (get().unreadByTontine[tontineId] ?? 0) + 1
    };

    set({
      messagesByTontine: {
        ...get().messagesByTontine,
        [tontineId]: nextMessages
      },
      messages: isActive ? nextMessages : get().messages,
      unreadByTontine,
      unreadCount: computeUnreadCount(unreadByTontine)
    });
  }
}));
