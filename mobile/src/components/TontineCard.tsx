import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Tontine } from "../types/entities";
import { colors } from "../theme/colors";
import { Badge } from "./Badge";
import { ProgressBar } from "./ProgressBar";

type TontineCardProps = {
  tontine: Tontine;
  paidCount: number;
  onPress?: () => void;
};

/**
 * Carte de tontine retravaillée pour une lecture plus fluide sur mobile.
 */
export function TontineCard({ tontine, paidCount, onPress }: TontineCardProps) {
  const frequencyLabel =
    tontine.frequency === "monthly"
      ? "mois"
      : tontine.frequency === "biweekly"
        ? "quinzaine"
        : "semaine";

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]} onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{tontine.name}</Text>
          <Text style={styles.amount}>
            {tontine.contributionAmount}€ / {frequencyLabel}
          </Text>
        </View>
        <Badge
          label={tontine.status === "active" ? "Active" : "En attente"}
          variant={tontine.status === "active" ? "success" : "warning"}
        />
      </View>

      <Text style={styles.description}>{tontine.description}</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={16} color={colors.textMuted} />
          <Text style={styles.metaText}>{tontine.membersCount} membres</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="gift-outline" size={16} color={colors.textMuted} />
          <Text style={styles.metaText}>{tontine.currentBeneficiary ?? "A definir"}</Text>
        </View>
      </View>

      <ProgressBar value={paidCount} total={tontine.membersCount} label="Cotisations recues ce mois" />

      <View style={styles.footerRow}>
        <Text style={styles.footerLabel}>Voir les details</Text>
        <Ionicons name="arrow-forward" size={16} color={colors.primary} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
    shadowColor: "#1A1A2E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 2
  },
  pressed: {
    opacity: 0.96,
    transform: [{ scale: 0.995 }]
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10
  },
  titleBlock: {
    flex: 1,
    gap: 4
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800"
  },
  amount: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700"
  },
  description: {
    color: colors.textMuted,
    lineHeight: 20
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  metaText: {
    color: colors.text,
    fontSize: 13
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 2
  },
  footerLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700"
  }
});

