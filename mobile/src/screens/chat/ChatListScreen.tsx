import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useCallback, useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "../../components/AppHeader";
import { EmptyState } from "../../components/EmptyState";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { useChatStore } from "../../store/chatStore";
import { useTontineStore } from "../../store/tontineStore";
import { colors } from "../../theme/colors";
import type { MainTabParamList } from "../../types/navigation";
import type { NavigationProp } from "@react-navigation/native";

/**
 * Liste principale des conversations avec une lecture plus proche d'une app mobile.
 */
export function ChatListScreen() {
  const navigation = useNavigation<NavigationProp<MainTabParamList>>();
  const unreadByTontine = useChatStore((state) => state.unreadByTontine);
  const messagesByTontine = useChatStore((state) => state.messagesByTontine);
  const fetchMessages = useChatStore((state) => state.fetchMessages);
  const tontines = useTontineStore((state) => state.tontines);
  const fetchMyTontines = useTontineStore((state) => state.fetchMyTontines);

  useFocusEffect(
    useCallback(() => {
      void fetchMyTontines();

      if (tontines[0]) {
        void fetchMessages(tontines[0].id);
      }
    }, [fetchMessages, fetchMyTontines, tontines])
  );

  const activeTontines = useMemo(
    () => tontines.filter((tontine) => tontine.status === "active"),
    [tontines]
  );

  return (
    <ScreenContainer tone="light">
      <AppHeader title="Conversations" showAvatar />

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Gardez le lien avec vos groupes.</Text>
        <Text style={styles.heroText}>
          Retrouvez les derniers échanges, les rappels utiles et les confirmations de versement au
          même endroit.
        </Text>
      </View>

      <FlatList
        data={activeTontines}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => {
          const lastMessage = messagesByTontine[item.id]?.slice(-1)[0];
          const unread = unreadByTontine[item.id] ?? 0;

          return (
            <Pressable
              style={styles.row}
              onPress={() =>
                navigation.navigate("HomeStack", {
                  screen: "Chat",
                  params: { tontineId: item.id }
                })
              }
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.name.slice(0, 1).toUpperCase()}</Text>
              </View>

              <View style={styles.info}>
                <View style={styles.infoTop}>
                  <Text style={styles.name} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.time}>
                    {lastMessage ? formatConversationTime(lastMessage.createdAt) : ""}
                  </Text>
                </View>
                <Text style={styles.preview} numberOfLines={2}>
                  {lastMessage?.content ?? "Commencez la première conversation du groupe."}
                </Text>
              </View>

              {unread > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text>
                </View>
              ) : null}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            title="Aucune conversation"
            description="Rejoignez une tontine pour accéder au chat."
          />
        }
      />
    </ScreenContainer>
  );
}

function formatConversationTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const isSameDay = date.toDateString() === now.toDateString();

  if (isSameDay) {
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short"
  }).format(date);
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8
  },
  heroTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800"
  },
  heroText: {
    color: colors.textMuted,
    lineHeight: 22
  },
  listContent: {
    paddingBottom: 24
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14
  },
  separator: {
    height: 1,
    backgroundColor: colors.border
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary
  },
  avatarText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "800"
  },
  info: {
    flex: 1,
    gap: 4
  },
  infoTop: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 10
  },
  name: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: "700"
  },
  preview: {
    color: colors.textMuted,
    lineHeight: 20
  },
  time: {
    color: colors.textMuted,
    fontSize: 12
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.danger
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "800"
  }
});
