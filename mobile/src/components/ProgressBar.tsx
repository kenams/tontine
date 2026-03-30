import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";

type ProgressBarProps = {
  value: number;
  total: number;
  label?: string;
};

/**
 * Barre de progression simple pour l'etat des cotisations.
 */
export function ProgressBar({ value, total, label }: ProgressBarProps) {
  const ratio = total > 0 ? Math.min(1, Math.max(0, value / total)) : 0;

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <Text style={styles.label}>{label ?? "Progression"}</Text>
        <Text style={styles.caption}>
          {value}/{total}
        </Text>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  label: {
    color: colors.textMuted,
    fontSize: 13
  },
  caption: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600"
  },
  track: {
    height: 8,
    backgroundColor: "rgba(26,26,46,0.08)",
    borderRadius: 999,
    overflow: "hidden"
  },
  fill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary
  }
});

