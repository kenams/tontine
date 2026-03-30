import { useMemo } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "../../components/AppHeader";
import { EmptyState } from "../../components/EmptyState";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { useNotifications } from "../../hooks/useNotifications";
import { useNotificationStore } from "../../store/notificationStore";
import { colors } from "../../theme/colors";
import type { NotificationsScreenProps } from "../../types/navigation";

/**
 * Centre de notifications avec marquage individuel ou global.
 */
export function NotificationsScreen({ navigation }: NotificationsScreenProps) {
  const notifications = useNotificationStore((state) => state.notifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const { markAllAsRead } = useNotifications();

  const sortedNotifications = useMemo(
    () => [...notifications].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
    [notifications]
  );

  return (
    <ScreenContainer tone="light">
      <AppHeader
        title="Notifications"
        showBack
        onBack={() => navigation.goBack()}
        rightComponent={
          <Pressable onPress={() => void markAllAsRead()}>
            <Text style={styles.readAll}>Tout lire</Text>
          </Pressable>
        }
      />

      <FlatList
        data={sortedNotifications}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, !item.read ? styles.cardUnread : null]}
            onPress={() => void markAsRead(item.id)}
          >
            <Text style={styles.icon}>{getNotificationIcon(item.type)}</Text>
            <View style={styles.info}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.body}>{item.body}</Text>
            </View>
            <Text style={styles.time}>{formatRelativeTime(item.createdAt)}</Text>
          </Pressable>
        )}
        ListEmptyComponent={
          <EmptyState title="Aucune notification" description="Tout est calme pour le moment." />
        }
      />
    </ScreenContainer>
  );
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "payment_due":
      return "⏰";
    case "payment_received":
      return "✅";
    case "member_joined":
      return "👋";
    case "payout_turn":
      return "🎉";
    default:
      return "🔔";
  }
}

function formatRelativeTime(value: string) {
  const date = new Date(value).getTime();
  const deltaHours = Math.max(1, Math.round((Date.now() - date) / (1000 * 60 * 60)));

  if (deltaHours < 24) {
    return `il y a ${deltaHours}h`;
  }

  if (deltaHours < 48) {
    return "hier";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short"
  }).format(new Date(value));
}

const styles = StyleSheet.create({
  readAll: {
    color: colors.primary,
    fontWeight: "700"
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  cardUnread: {
    backgroundColor: colors.primarySoft
  },
  icon: {
    fontSize: 22
  },
  info: {
    flex: 1,
    gap: 4
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700"
  },
  body: {
    color: colors.textMuted,
    lineHeight: 20
  },
  time: {
    color: colors.textMuted,
    fontSize: 12
  }
});

