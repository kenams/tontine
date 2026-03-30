import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../../theme/colors";
import type { Tontine } from "../../types/entities";

type Props = {
  tontine: Tontine;
  onPress?: () => void;
};

export function TontinePreviewCard({ tontine, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{getStatusLabel(tontine.status)}</Text>
        </View>
        <Text style={styles.amount}>{tontine.contributionAmount} EUR / mois</Text>
      </View>

      <Text style={styles.title}>{tontine.name}</Text>
      <Text style={styles.description}>{tontine.description}</Text>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(tontine.currentRound / tontine.totalRounds) * 100}%` }]} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.meta}>{tontine.membersCount} membres</Text>
        <Text style={styles.meta}>Tour {tontine.currentRound}/{tontine.totalRounds}</Text>
      </View>
    </Pressable>
  );
}

function getStatusLabel(status: Tontine["status"]) {
  switch (status) {
    case "active":
      return "Active";
    case "open":
      return "Ouverte";
    case "completed":
      return "Cloturee";
    default:
      return "Brouillon";
  }
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 28,
    padding: 20,
    backgroundColor: "rgba(35, 35, 61, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    gap: 14
  },
  pressed: {
    opacity: 0.97,
    transform: [{ scale: 0.994 }]
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  badge: {
    backgroundColor: "rgba(232, 80, 10, 0.14)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999
  },
  badgeText: {
    color: "#FFB088",
    textTransform: "uppercase",
    fontSize: 11,
    fontWeight: "700"
  },
  amount: {
    color: colors.white,
    fontWeight: "700"
  },
  title: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "800"
  },
  description: {
    color: "rgba(255,255,255,0.72)",
    lineHeight: 22
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden"
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between"
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13
  }
});
