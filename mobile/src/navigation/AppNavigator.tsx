import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { TabBarIcon } from "../components/TabBarIcon";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import { ChatListScreen } from "../screens/chat/ChatListScreen";
import { SplashScreen } from "../screens/SplashScreen";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { RegisterScreen } from "../screens/auth/RegisterScreen";
import { HomeScreen } from "../screens/app/HomeScreen";
import { CreateTontineScreen } from "../screens/app/CreateTontineScreen";
import { ProfileScreen } from "../screens/app/ProfileScreen";
import { NotificationsScreen } from "../screens/app/NotificationsScreen";
import { PaymentScreen } from "../screens/payment/PaymentScreen";
import { ChatScreen } from "../screens/tontine/ChatScreen";
import { TontineDetailScreen } from "../screens/tontine/TontineDetailScreen";
import { colors } from "../theme/colors";
import type {
  AuthStackParamList,
  HomeStackParamList,
  MainTabParamList,
  RootStackParamList
} from "../types/navigation";

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function AuthStackNavigator() {
  return (
    <AuthStack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false, animation: "fade" }}
    >
      <AuthStack.Screen name="Splash" component={SplashScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false, animation: "fade" }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="CreateTontine" component={CreateTontineScreen} />
      <HomeStack.Screen name="TontineDetail" component={TontineDetailScreen} />
      <HomeStack.Screen name="Chat" component={ChatScreen} />
      <HomeStack.Screen name="Payment" component={PaymentScreen} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} />
    </HomeStack.Navigator>
  );
}

function MainTabsNavigator() {
  const unreadMessages = useChatStore((state) => state.unreadCount);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "#888888",
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64,
          paddingTop: 8,
          paddingBottom: 10,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
          elevation: 10
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600"
        },
        tabBarIcon: ({ focused }) => (
          <TabBarIcon
            name={route.name === "HomeStack" ? "home" : route.name === "ChatList" ? "chat" : "profile"}
            focused={focused}
            badge={route.name === "ChatList" ? unreadMessages : 0}
          />
        )
      })}
    >
      <Tab.Screen
        name="HomeStack"
        component={HomeStackNavigator}
        options={{ title: "Accueil" }}
      />
      <Tab.Screen name="ChatList" component={ChatListScreen} options={{ title: "Chat" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profil" }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

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
