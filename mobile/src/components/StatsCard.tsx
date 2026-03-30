import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";

type StatsCardProps = {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
};

/**
 * Carte statistique compacte adaptée au dashboard mobile.
 */
export function StatsCard({ label, value, icon }: StatsCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconShell}>
        <Ionicons name={icon} size={18} color={colors.white} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 112,
    borderRadius: 20,
    padding: 16,
    backgroundColor: colors.primary,
    justifyContent: "space-between"
  },
  iconShell: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)"
  },
  value: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "800"
  },
  label: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 12,
    lineHeight: 17
  }
});

