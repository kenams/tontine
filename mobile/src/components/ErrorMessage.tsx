import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";

type ErrorMessageProps = {
  message: string;
};

/**
 * Bloc d'erreur reutilisable sous les formulaires ou dans les vues.
 */
export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <View style={styles.wrapper}>
      <Ionicons name="warning-outline" size={18} color={colors.danger} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(201,75,75,0.08)"
  },
  message: {
    flex: 1,
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18
  }
});

