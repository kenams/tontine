import { StyleSheet, Text, View } from "react-native";

import { colors } from "../../theme/colors";

type Props = {
  eyebrow: string;
  title: string;
  description?: string;
};

export function SectionHeader({ eyebrow, title, description }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8
  },
  eyebrow: {
    color: "#FFB088",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2.2,
    textTransform: "uppercase"
  },
  title: {
    color: colors.white,
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 40
  },
  description: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 15,
    lineHeight: 25
  }
});
