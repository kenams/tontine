import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";

type LoadingSpinnerProps = {
  message?: string;
};

/**
 * Indicateur de chargement centralise pour les vues asynchrones.
 */
export function LoadingSpinner({ message = "Chargement en cours..." }: LoadingSpinnerProps) {
  return (
    <View style={styles.wrapper}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 24
  },
  message: {
    color: colors.textMuted,
    fontSize: 14
  }
});

