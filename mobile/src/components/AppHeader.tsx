import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useAuthStore } from "../store/authStore";
import { useNotificationStore } from "../store/notificationStore";
import { colors } from "../theme/colors";

type AppHeaderProps = {
  title: string;
  showBack?: boolean;
  showNotification?: boolean;
  showAvatar?: boolean;
  onBack?: () => void;
  onNotificationPress?: () => void;
  onAvatarPress?: () => void;
  rightComponent?: ReactNode;
};

/**
 * Header applicatif plus léger et plus naturel sur téléphone.
 */
export function AppHeader({
  title,
  showBack = false,
  showNotification = false,
  showAvatar = false,
  onBack,
  onNotificationPress,
  onAvatarPress,
  rightComponent
}: AppHeaderProps) {
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const user = useAuthStore((state) => state.user);

  const initials = (user?.fullName ?? "TU")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={styles.container}>
      <View style={styles.side}>
        {showBack ? (
          <Pressable onPress={onBack} style={styles.iconButton}>
            <Text style={styles.iconLabel}>←</Text>
          </Pressable>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>

      <Text style={styles.title}>{title}</Text>

      <View style={[styles.side, styles.sideRight]}>
        {rightComponent}

        {showNotification ? (
          <Pressable onPress={onNotificationPress} style={styles.iconButton}>
            <Text style={styles.iconLabel}>🔔</Text>
            {unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
        ) : null}

        {showAvatar ? (
          <Pressable onPress={onAvatarPress} style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </Pressable>
        ) : null}

        {!rightComponent && !showNotification && !showAvatar ? <View style={styles.placeholder} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    paddingHorizontal: 4,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4
  },
  side: {
    minWidth: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  sideRight: {
    justifyContent: "flex-end"
  },
  placeholder: {
    width: 40,
    height: 40
  },
  title: {
    flex: 1,
    textAlign: "center",
    color: colors.text,
    fontSize: 19,
    fontWeight: "800"
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  iconLabel: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "800"
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.danger
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "800"
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary
  },
  avatarText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "800"
  }
});

