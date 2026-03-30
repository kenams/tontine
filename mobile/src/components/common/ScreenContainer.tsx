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
      colors={tone === "light" ? ["#FFF8F4", "#FFF3EE", "#FDE9DF"] : ["#1A1A2E", "#22233D", "#131320"]}
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
    backgroundColor: "rgba(14, 16, 31, 0.84)"
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

