import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { OfflineBanner } from "./src/components/OfflineBanner";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { appNavigationTheme } from "./src/theme/theme";

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
        <AppProviders />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
