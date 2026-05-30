import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthStore } from "../store/authStore";
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
import { TontineDetailScreen } from "../screens/tontine/TontineDetailScreen";
import { colors } from "../theme/colors";
import type {
  AuthStackParamList,
  HomeStackParamList,
  MainTabParamList,
  RootStackParamList,
  WalletStackParamList,
} from "../types/navigation";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const WalletStack = createNativeStackNavigator<WalletStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function AuthStackNavigator() {
  return (
    <AuthStack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false, animation: "fade" }}>
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
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
    </HomeStack.Navigator>
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
  HomeStack:     { active: "home",          inactive: "home-outline" },
  Groupes:       { active: "people",        inactive: "people-outline" },
  WalletStack:   { active: "wallet",        inactive: "wallet-outline" },
  Notifications: { active: "notifications", inactive: "notifications-outline" },
  Profile:       { active: "person",        inactive: "person-outline" },
};

function MainTabsNavigator() {
  const insets = useSafeAreaInsets();
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
      <Tab.Screen name="HomeStack"     component={HomeStackNavigator}  options={{ title: "Accueil" }} />
      <Tab.Screen name="Groupes"       component={TontinesScreen}      options={{ title: "Groupes" }} />
      <Tab.Screen name="WalletStack"   component={WalletStackNavigator} options={{ title: "Wallet" }} />
      <Tab.Screen name="Notifications" component={NotificationsScreen}  options={{ title: "Alertes" }} />
      <Tab.Screen name="Profile"       component={ProfileScreen}        options={{ title: "Profil" }} />
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
