import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { Button } from "./Button";

type EmptyStateProps = {
  title: string;
  description: string;
  ctaLabel?: string;
  onPress?: () => void;
};

/**
 * Etat vide stylise avec illustration simple et appel a l'action.
 */
export function EmptyState({ title, description, ctaLabel, onPress }: EmptyStateProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconShell}>
        <Ionicons name="wallet-outline" size={28} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {ctaLabel && onPress ? (
        <View style={styles.cta}>
          <Button onPress={onPress}>{ctaLabel}</Button>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 24,
    alignItems: "center",
    gap: 10
  },
  iconShell: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center"
  },
  description: {
    color: colors.textMuted,
    lineHeight: 22,
    textAlign: "center"
  },
  cta: {
    width: "100%",
    marginTop: 10
  }
});

