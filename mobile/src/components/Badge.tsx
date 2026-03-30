import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";

type BadgeVariant = "success" | "warning" | "neutral" | "info";

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
};

/**
 * Petit badge colore pour les statuts et libelles.
 */
export function Badge({ label, variant = "neutral" }: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant]]}>
      <Text style={[styles.label, styles[`${variant}Label`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999
  },
  success: {
    backgroundColor: "rgba(31,143,107,0.12)"
  },
  warning: {
    backgroundColor: "rgba(232,80,10,0.12)"
  },
  neutral: {
    backgroundColor: "rgba(26,26,46,0.08)"
  },
  info: {
    backgroundColor: "rgba(78,115,223,0.12)"
  },
  label: {
    fontSize: 12,
    fontWeight: "700"
  },
  successLabel: {
    color: colors.success
  },
  warningLabel: {
    color: colors.primary
  },
  neutralLabel: {
    color: colors.text
  },
  infoLabel: {
    color: "#4E73DF"
  }
});

