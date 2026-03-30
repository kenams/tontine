import { StyleSheet, Text, View } from "react-native";

import type { TontineMember } from "../types/entities";
import { colors } from "../theme/colors";
import { Badge } from "./Badge";

type MemberRowProps = {
  member: TontineMember;
};

/**
 * Ligne de membre avec avatar, role et statut de paiement.
 */
export function MemberRow({ member }: MemberRowProps) {
  const initials = member.fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const statusLabel = member.paymentStatus === "paid" ? "Paye" : "En attente";
  const statusSymbol = member.paymentStatus === "paid" ? "✅" : "⏳";

  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{member.fullName}</Text>
        <Text style={styles.meta}>
          {statusSymbol} {statusLabel}
        </Text>
      </View>

      {member.role === "owner" ? <Badge label="Organisateur" variant="warning" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft
  },
  avatarText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "800"
  },
  info: {
    flex: 1
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700"
  },
  meta: {
    color: colors.textMuted,
    marginTop: 4
  }
});

