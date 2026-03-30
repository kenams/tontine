import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";

type TabBarIconProps = {
  name: "home" | "chat" | "profile";
  focused: boolean;
  badge?: number;
};

/**
 * Icône de tab bar en mode emoji avec badge et indicateur actif.
 */
export function TabBarIcon({ name, focused, badge = 0 }: TabBarIconProps) {
  const icon = name === "home" ? (focused ? "🏠" : "🏡") : name === "chat" ? "💬" : "👤";
  const displayBadge = badge > 9 ? "9+" : `${badge}`;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.icon, focused ? styles.iconFocused : null]}>{icon}</Text>

      {badge > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{displayBadge}</Text>
        </View>
      ) : null}

      {focused ? <View style={styles.dot} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 34
  },
  icon: {
    fontSize: 24
  },
  iconFocused: {
    fontSize: 28
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.danger
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "800"
  },
  dot: {
    marginTop: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary
  }
});

