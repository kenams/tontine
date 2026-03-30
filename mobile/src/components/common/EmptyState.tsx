import { StyleSheet, Text, View } from "react-native";

import { colors } from "../../theme/colors";

type Props = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)"
  },
  title: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "700"
  },
  description: {
    color: "rgba(255,255,255,0.68)",
    marginTop: 8,
    lineHeight: 22
  }
});
