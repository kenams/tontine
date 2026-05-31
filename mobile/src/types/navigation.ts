import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps, NavigatorScreenParams } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  CreateTontine: undefined;
  JoinTontine: undefined;
  TontineDetail: { tontineId: string };
  Chat: { tontineId: string };
  Payment: { tontineId: string; amount: number; tontineName: string };
  Notifications: undefined;
};

export type TontinesStackParamList = {
  Tontines: undefined;
  CreateTontine: undefined;
  JoinTontine: undefined;
  TontineDetail: { tontineId: string };
  Chat: { tontineId: string };
  Payment: { tontineId: string; amount: number; tontineName: string };
};

export type WalletStackParamList = {
  Wallet: undefined;
};

export type MainTabParamList = {
  HomeStack: NavigatorScreenParams<HomeStackParamList>;
  GroupesStack: NavigatorScreenParams<TontinesStackParamList>;
  WalletStack: NavigatorScreenParams<WalletStackParamList>;
  Notifications: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  AuthStack: NavigatorScreenParams<AuthStackParamList>;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
};

export type SplashScreenProps = NativeStackScreenProps<AuthStackParamList, "Splash">;
export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, "Login">;
export type RegisterScreenProps = NativeStackScreenProps<AuthStackParamList, "Register">;

export type HomeScreenProps = NativeStackScreenProps<HomeStackParamList, "Home">;
export type CreateTontineScreenProps = NativeStackScreenProps<HomeStackParamList, "CreateTontine"> | NativeStackScreenProps<TontinesStackParamList, "CreateTontine">;
export type JoinTontineScreenProps = NativeStackScreenProps<HomeStackParamList, "JoinTontine"> | NativeStackScreenProps<TontinesStackParamList, "JoinTontine">;
export type TontineDetailScreenProps = NativeStackScreenProps<HomeStackParamList, "TontineDetail"> | NativeStackScreenProps<TontinesStackParamList, "TontineDetail">;
export type ChatScreenProps = NativeStackScreenProps<HomeStackParamList, "Chat"> | NativeStackScreenProps<TontinesStackParamList, "Chat">;
export type PaymentScreenProps = NativeStackScreenProps<HomeStackParamList, "Payment">;
export type NotificationsScreenProps = NativeStackScreenProps<HomeStackParamList, "Notifications">;

export type TontinesScreenProps = NativeStackScreenProps<TontinesStackParamList, "Tontines">;
export type WalletScreenProps = NativeStackScreenProps<WalletStackParamList, "Wallet">;

export type ProfileScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Profile">,
  NativeStackScreenProps<RootStackParamList>
>;
