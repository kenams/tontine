import { StyleSheet, Text, View } from "react-native";

import { useAppStore } from "../store/appStore";
import { THEME } from "../config/constants";

/**
 * Affiche un bandeau discret lorsque le backend est indisponible.
 */
export function OfflineBanner() {
  const isBackendAvailable = useAppStore((state) => state.isBackendAvailable);

  if (isBackendAvailable) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>📡 Mode hors ligne — donnees en cache</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.ERROR
  },
  label: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600"
  }
});
