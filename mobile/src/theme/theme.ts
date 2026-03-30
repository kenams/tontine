import { DefaultTheme, type Theme } from "@react-navigation/native";

import { colors } from "./colors";

export const appNavigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    background: colors.dark,
    card: colors.dark,
    text: colors.white,
    border: "rgba(255,255,255,0.08)",
    notification: colors.primary
  }
};
