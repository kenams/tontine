import type { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

type Props = PropsWithChildren<{
  scrollable?: boolean;
  tone?: "dark" | "light";
}>;

/**
 * Conteneur principal pensé d'abord pour une lecture confortable sur mobile.
 */
export function ScreenContainer({ children, scrollable = true, tone = "dark" }: Props) {
  const content = scrollable ? (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.contentInner}>{children}</View>
    </ScrollView>
  ) : (
    <View style={styles.content}>
      <View style={styles.contentInner}>{children}</View>
    </View>
  );

  return (
    <LinearGradient
      colors={tone === "light" ? ["#f4f6f4", "#edf2ed", "#e6ede6"] : ["#080b07", "#0d1509", "#080b07"]}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.overlay, tone === "light" ? styles.overlayLight : styles.overlayDark]}>
          {content}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1
  },
  safeArea: {
    flex: 1
  },
  overlay: {
    flex: 1
  },
  overlayDark: {
    backgroundColor: "transparent"
  },
  overlayLight: {
    backgroundColor: "rgba(255,243,238,0.88)"
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20
  },
  contentInner: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    gap: 18
  }
});

