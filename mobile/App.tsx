import { NavigationContainer } from "@react-navigation/native";
import { StripeProvider } from "@stripe/stripe-react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { OfflineBanner } from "./src/components/OfflineBanner";
import { AppNavigator } from "./src/navigation/AppNavigator";
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
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY} merchantIdentifier="merchant.com.kahdigital.kotizy">
          <AppProviders />
        </StripeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
