import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer, type LinkingOptions } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { OfflineBanner } from "./src/components/OfflineBanner";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { appNavigationTheme } from "./src/theme/theme";
import { STRIPE_PUBLISHABLE_KEY } from "./src/config/constants";
import { useLang } from "./src/i18n/useLang";
import type { RootStackParamList } from "./src/types/navigation";

// Stripe is native-only — import conditionally to avoid web bundler crash
const StripeWrapper = Platform.OS !== "web"
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ? require("@stripe/stripe-react-native").StripeProvider
  : ({ children }: { children: React.ReactNode }) => <>{children}</>;

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ["kotizy://", "https://tontineapp-web.vercel.app"],
  config: {
    screens: {
      MainTabs: {
        screens: {
          GroupesStack: {
            screens: {
              JoinTontine: "g/:code",
              TontineDetail: "tontines/:tontineId",
            },
          },
          HomeStack: {
            screens: {
              JoinTontine: "join/:code",
            },
          },
        },
      },
      AuthStack: {
        screens: {
          Login: "login",
          Register: "register",
        },
      },
    },
  },
};

function AppProviders() {
  return (
    <NavigationContainer theme={appNavigationTheme} linking={linking}>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      <OfflineBanner />
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const loadLang = useLang((s) => s.loadLang);

  useEffect(() => {
    void loadLang();
    AsyncStorage.getItem("onboarding_done").then((v) => setOnboardingDone(v === "1"));
  }, [loadLang]);

  if (onboardingDone === null) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StripeWrapper publishableKey={STRIPE_PUBLISHABLE_KEY} merchantIdentifier="merchant.com.kahdigital.kotizy">
          {onboardingDone ? (
            <AppProviders />
          ) : (
            <OnboardingScreen onDone={() => setOnboardingDone(true)} />
          )}
        </StripeWrapper>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
