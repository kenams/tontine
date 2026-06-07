import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore } from "../store/authStore";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { SplashScreen } from "../screens/SplashScreen";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { RegisterScreen } from "../screens/auth/RegisterScreen";
import { HomeScreen } from "../screens/app/HomeScreen";
import { CreateTontineScreen } from "../screens/app/CreateTontineScreen";
import { JoinTontineScreen } from "../screens/app/JoinTontineScreen";
import { ProfileScreen } from "../screens/app/ProfileScreen";
import { NotificationsScreen } from "../screens/app/NotificationsScreen";
import { WalletScreen } from "../screens/app/WalletScreen";
import { TontinesScreen } from "../screens/app/TontinesScreen";
import { ChatScreen } from "../screens/tontine/ChatScreen";
import { ChatListScreen } from "../screens/chat/ChatListScreen";
import { TontineDetailScreen } from "../screens/tontine/TontineDetailScreen";
import { PaymentScreen } from "../screens/payment/PaymentScreen";
import { colors } from "../theme/colors";
import { useLang } from "../i18n/useLang";
import type {
  AuthStackParamList,
  HomeStackParamList,
  MainTabParamList,
  RootStackParamList,
  TontinesStackParamList,
  WalletStackParamList,
} from "../types/navigation";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const TontinesStack = createNativeStackNavigator<TontinesStackParamList>();
const WalletStack = createNativeStackNavigator<WalletStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function OnboardingWrapper({ navigation }: { navigation: { replace: (s: string) => void } }) {
  return <OnboardingScreen onDone={() => navigation.replace("Splash")} />;
}

function AuthStackNavigator() {
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("onboarding_done").then((v) => setOnboardingDone(v === "1"));
  }, []);

  if (onboardingDone === null) return null;

  return (
    <AuthStack.Navigator initialRouteName={onboardingDone ? "Splash" : "Onboarding"} screenOptions={{ headerShown: false, animation: "fade" }}>
      <AuthStack.Screen name="Onboarding" component={OnboardingWrapper as never} />
      <AuthStack.Screen name="Splash" component={SplashScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="CreateTontine" component={CreateTontineScreen} />
      <HomeStack.Screen name="JoinTontine" component={JoinTontineScreen} />
      <HomeStack.Screen name="TontineDetail" component={TontineDetailScreen} />
      <HomeStack.Screen name="Chat" component={ChatScreen} />
      <HomeStack.Screen name="ChatList" component={ChatListScreen} />
      <HomeStack.Screen name="Payment" component={PaymentScreen} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
    </HomeStack.Navigator>
  );
}

function TontinesStackNavigator() {
  return (
    <TontinesStack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <TontinesStack.Screen name="Tontines" component={TontinesScreen} />
      <TontinesStack.Screen name="CreateTontine" component={CreateTontineScreen} />
      <TontinesStack.Screen name="JoinTontine" component={JoinTontineScreen} />
      <TontinesStack.Screen name="TontineDetail" component={TontineDetailScreen} />
      <TontinesStack.Screen name="Chat" component={ChatScreen} />
      <TontinesStack.Screen name="ChatList" component={ChatListScreen} />
      <TontinesStack.Screen name="Payment" component={PaymentScreen} />
    </TontinesStack.Navigator>
  );
}

function WalletStackNavigator() {
  return (
    <WalletStack.Navigator screenOptions={{ headerShown: false }}>
      <WalletStack.Screen name="Wallet" component={WalletScreen} />
    </WalletStack.Navigator>
  );
}

type TabIconName = React.ComponentProps<typeof Ionicons>["name"];
const TAB_ICONS: Record<string, { active: TabIconName; inactive: TabIconName }> = {
  HomeStack:    { active: "home",          inactive: "home-outline" },
  GroupesStack: { active: "people",        inactive: "people-outline" },
  WalletStack:  { active: "wallet",        inactive: "wallet-outline" },
  Notifications:{ active: "notifications", inactive: "notifications-outline" },
  Profile:      { active: "person",        inactive: "person-outline" },
};

function MainTabsNavigator() {
  const insets = useSafeAreaInsets();
  const { t } = useLang();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 4,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const name = focused ? icons?.active : icons?.inactive;
          return <Ionicons name={name ?? "home-outline"} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeStack"    component={HomeStackNavigator}     options={{ title: t("tabs.home") }} />
      <Tab.Screen name="GroupesStack" component={TontinesStackNavigator} options={{ title: t("tabs.groups") }} />
      <Tab.Screen name="WalletStack"  component={WalletStackNavigator}   options={{ title: t("tabs.wallet") }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen}   options={{ title: t("tabs.alerts") }} />
      <Tab.Screen name="Profile"      component={ProfileScreen}           options={{ title: t("tabs.profile") }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false, animation: "fade" }}>
      {isAuthenticated ? (
        <RootStack.Screen name="MainTabs" component={MainTabsNavigator} />
      ) : (
        <RootStack.Screen name="AuthStack" component={AuthStackNavigator} />
      )}
    </RootStack.Navigator>
  );
}

export function AppNavigator() {
  return <RootNavigator />;
}
