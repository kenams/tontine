import { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
// Kotizy splash

import { useAppStore } from "../store/appStore";
import { useAuthStore } from "../store/authStore";
import { colors } from "../theme/colors";
import type { SplashScreenProps } from "../types/navigation";

/**
 * Splash screen anime chargeant l'etat reseau puis la session locale.
 */
export function SplashScreen({ navigation }: SplashScreenProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const isBackendAvailable = useAppStore((state) => state.isBackendAvailable);
  const checkBackendHealth = useAppStore((state) => state.checkBackendHealth);

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let isMounted = true;

    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 700,
        delay: 300,
        useNativeDriver: true
      }),
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 700,
        delay: 500,
        useNativeDriver: true
      }),
      Animated.timing(progress, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false
      })
    ]).start();

    async function bootstrap() {
      const minimumDelay = new Promise((resolve) => setTimeout(resolve, 2000));

      await checkBackendHealth();
      await initializeAuth();
      await minimumDelay;

      if (!isMounted) {
        return;
      }

      if (!useAuthStore.getState().isAuthenticated) {
        navigation.replace("Login");
      }
    }

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, [checkBackendHealth, initializeAuth, logoOpacity, logoScale, navigation, progress, subtitleOpacity, titleOpacity]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"]
  });

  return (
    <LinearGradient colors={["#080b07" as const, "#111a10" as const]} style={styles.container}>
      <View style={styles.centerContent}>
        <Animated.View style={[styles.logoShell, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <Text style={styles.logoText}>K</Text>
        </Animated.View>

        <Animated.Text style={[styles.title, { opacity: titleOpacity }]}>Kotizy</Animated.Text>
        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          L'épargne collective, réinventée.
        </Animated.Text>

        <View style={styles.metaRow}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.metaText}>
            {isAuthenticated
              ? "Reprise de votre session..."
              : isBackendAvailable
                ? "Connexion au serveur..."
                : "Chargement du mode hors ligne..."}
          </Text>
        </View>
      </View>

      <View style={styles.loaderTrack}>
        <Animated.View style={[styles.loaderFill, { width: progressWidth }]} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24
  },
  centerContent: {
    alignItems: "center",
    gap: 16
  },
  logoShell: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center"
  },
  logoText: {
    color: colors.white,
    fontSize: 80,
    fontWeight: "800",
    lineHeight: 88
  },
  title: {
    color: colors.white,
    fontSize: 32,
    fontWeight: "800"
  },
  subtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 16
  },
  metaRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  metaText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13
  },
  loaderTrack: {
    position: "absolute",
    left: 32,
    right: 32,
    bottom: 56,
    height: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
    overflow: "hidden"
  },
  loaderFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary
  }
});
