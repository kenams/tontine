import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer } from "@react-navigation/native";
import { StripeProvider } from "@stripe/stripe-react-native";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { OfflineBanner } from "./src/components/OfflineBanner";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { appNavigationTheme } from "./src/theme/theme";
import { STRIPE_PUBLISHABLE_KEY } from "./src/config/constants";

function AppProviders() {
  return (
    <NavigationContainer theme={appNavigationTheme}>
      <StatusBar style="dark" />
      <OfflineBanner />
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("onboarding_done").then((v) => setOnboardingDone(v === "1"));
  }, []);

  if (onboardingDone === null) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY} merchantIdentifier="merchant.com.kahdigital.kotizy">
          {onboardingDone ? (
            <AppProviders />
          ) : (
            <OnboardingScreen onDone={() => setOnboardingDone(true)} />
          )}
        </StripeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
