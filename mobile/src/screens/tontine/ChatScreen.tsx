import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { AppHeader } from "../../components/AppHeader";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { ScreenContainer } from "../../components/common/ScreenContainer";

import { subscribeToMessages, unsubscribe } from "../../services/realtimeService";
import { useAuthStore } from "../../store/authStore";
import { useChatStore } from "../../store/chatStore";
import { useTontineStore } from "../../store/tontineStore";
import { colors } from "../../theme/colors";
import type { TontineMessage } from "../../types/entities";
import type { ChatScreenProps } from "../../types/navigation";

/**
 * Chat d'une tontine avec une composition plus compacte et plus naturelle sur mobile.
 */
export function ChatScreen({ navigation, route }: ChatScreenProps) {
  const tontineId = route.params.tontineId;
  const [content, setContent] = useState("");
  const listRef = useRef<FlatList<TontineMessage>>(null);

  const user = useAuthStore((state) => state.user);
  const messages = useChatStore((state) => state.messages);
  const fetchMessages = useChatStore((state) => state.fetchMessages);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const addMessage = useChatStore((state) => state.addMessage);
  const isLoading = useChatStore((state) => state.isLoading);
  const currentTontine = useTontineStore((state) => state.currentTontine);
  const tontines = useTontineStore((state) => state.tontines);
  const fetchTontineById = useTontineStore((state) => state.fetchTontineById);

  const tontine =
    currentTontine?.id === tontineId
      ? currentTontine
      : tontines.find((item) => item.id === tontineId);
  const membersCount = tontine?.members?.length ?? tontine?.membersCount ?? 0;
  const invertedMessages = useMemo(() => [...messages].reverse(), [messages]);

  useFocusEffect(
    useCallback(() => {
      void fetchTontineById(tontineId);
      void fetchMessages(tontineId);
    }, [fetchMessages, fetchTontineById, tontineId])
  );

  useEffect(() => {
    const channel = subscribeToMessages(tontineId, (message) => {
      addMessage(tontineId, message);
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
      });
    });

    return () => {
      unsubscribe(channel);
    };
  }, [addMessage, tontineId]);

  async function handleSend() {
    if (!content.trim()) {
      return;
    }

    await sendMessage(tontineId, content);
    setContent("");
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    });
  }

  function renderMessage({ item }: { item: TontineMessage }) {
    const isMine = item.senderId === user?.id;
    const initials = item.senderName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    return (
      <View style={[styles.messageRow, isMine ? styles.messageRowMine : null]}>
        {!isMine ? (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        ) : null}

        <View style={[styles.bubbleShell, isMine ? styles.bubbleShellMine : null]}>
          {!isMine ? <Text style={styles.sender}>{item.senderName}</Text> : null}
          <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
            <Text style={[styles.messageText, isMine ? styles.messageTextMine : null]}>{item.content}</Text>
          </View>
          <Text style={[styles.time, isMine ? styles.timeMine : null]}>{formatTime(item.createdAt)}</Text>
        </View>
      </View>
    );
  }

  return (
    <ScreenContainer tone="light" scrollable={false}>
      <KeyboardAvoidingView
        style={styles.wrapper}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <AppHeader title={tontine?.name ?? "Chat du groupe"} showBack onBack={() => navigation.goBack()} />

        <View style={styles.headerMeta}>
          <Text style={styles.subtitle}>{membersCount} membres actifs</Text>
        </View>

        {isLoading && !messages.length ? <LoadingSpinner message="Chargement des messages..." /> : null}

        <FlatList
          ref={listRef}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={invertedMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          inverted
          keyboardShouldPersistTaps="handled"
        />

        <View style={styles.composer}>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Votre message..."
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            multiline
          />
          <Pressable
            onPress={() => void handleSend()}
            disabled={!content.trim()}
            style={[styles.sendButton, !content.trim() ? styles.sendButtonDisabled : null]}
          >
            <Ionicons name="arrow-up" size={18} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1
  },
  headerMeta: {
    paddingTop: 8,
    paddingBottom: 8
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13
  },
  list: {
    flex: 1
  },
  listContent: {
    gap: 14,
    paddingVertical: 8
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10
  },
  messageRowMine: {
    justifyContent: "flex-end"
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center"
  },
  avatarText: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 11
  },
  bubbleShell: {
    maxWidth: "80%",
    gap: 4
  },
  bubbleShellMine: {
    alignItems: "flex-end"
  },
  sender: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 12,
    marginLeft: 4
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11
  },
  bubbleMine: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 6
  },
  bubbleOther: {
    backgroundColor: "#F0F0F0",
    borderBottomLeftRadius: 6
  },
  messageText: {
    color: colors.text,
    lineHeight: 20
  },
  messageTextMine: {
    color: colors.white
  },
  time: {
    marginLeft: 4,
    fontSize: 11,
    color: colors.textMuted
  },
  timeMine: {
    color: colors.textMuted
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  input: {
    flex: 1,
    minHeight: 54,
    maxHeight: 120,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    textAlignVertical: "top"
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary
  },
  sendButtonDisabled: {
    opacity: 0.5
  }
});
