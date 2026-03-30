import { useMemo, useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { AppHeader } from "../../components/AppHeader";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { useAuthStore } from "../../store/authStore";
import { useContributionStore } from "../../store/contributionStore";
import { useTontineStore } from "../../store/tontineStore";
import { colors } from "../../theme/colors";
import type { ProfileScreenProps } from "../../types/navigation";

/**
 * Profil utilisateur avec sections plus respirantes sur mobile.
 */
export function ProfileScreen(props: ProfileScreenProps) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const tontines = useTontineStore((state) => state.tontines);
  const contributionsByTontine = useContributionStore((state) => state.contributionsByTontine);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? user?.phoneNumber ?? "");

  const totalSaved = useMemo(() => {
    return Object.values(contributionsByTontine)
      .flat()
      .filter((contribution) => contribution.status === "paid")
      .reduce((sum, contribution) => sum + contribution.amount, 0);
  }, [contributionsByTontine]);

  const initials = useMemo(() => {
    return (user?.fullName ?? "TU")
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user?.fullName]);

  async function handleSaveProfile() {
    await updateProfile({ fullName: fullName.trim(), phone: phone.trim(), phoneNumber: phone.trim() });
    setIsModalVisible(false);
  }

  function handleLogout() {
    Alert.alert("Se deconnecter", "Voulez-vous vraiment quitter votre espace ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Se deconnecter",
        style: "destructive",
        onPress: () => void logout()
      }
    ]);
  }

  return (
    <ScreenContainer tone="light">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <AppHeader
          title="Mon profil"
          showNotification
          onNotificationPress={() => props.navigation.navigate("HomeStack", { screen: "Notifications" })}
        />

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user?.fullName ?? "Utilisateur"}</Text>
          <Text style={styles.meta}>{user?.email ?? "profil@tontineapp.fr"}</Text>
          <Text style={styles.meta}>{user?.phone ?? user?.phoneNumber ?? "Numero non renseigne"}</Text>
          <View style={styles.buttonWrap}>
            <Button variant="ghost" onPress={() => setIsModalVisible(true)}>
              Modifier
            </Button>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{tontines.length}</Text>
            <Text style={styles.statLabel}>Tontines actives</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalSaved}€</Text>
            <Text style={styles.statLabel}>Total epargne</Text>
          </View>
          <View style={styles.statCardWide}>
            <Text style={styles.statValue}>98%</Text>
            <Text style={styles.statLabel}>Ponctualite</Text>
          </View>
        </View>

        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>Parametres</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              thumbColor={colors.white}
              trackColor={{ false: "rgba(26,26,46,0.16)", true: colors.primary }}
            />
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Langue</Text>
            <Text style={styles.settingValue}>FR</Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Confidentialite</Text>
            <Text style={styles.settingValue}>Standard</Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Aide & Support</Text>
            <Text style={styles.settingValue}>Disponible</Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>A propos de TontineApp</Text>
            <Text style={styles.settingValue}>v1 demo</Text>
          </View>
        </View>

        <Button variant="danger" onPress={handleLogout}>
          Se deconnecter
        </Button>
      </ScrollView>

      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Modifier le profil</Text>
            <Input label="Nom complet" placeholder="Votre nom" value={fullName} onChangeText={setFullName} />
            <Input
              label="Telephone"
              placeholder="+33 6 12 34 56 78"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <Button variant="ghost" onPress={() => setIsModalVisible(false)}>
                Annuler
              </Button>
              <Button onPress={() => void handleSaveProfile()}>Enregistrer</Button>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    gap: 16,
    paddingBottom: 28
  },
  profileCard: {
    borderRadius: 28,
    padding: 22,
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary
  },
  avatarText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "800"
  },
  name: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 4
  },
  meta: {
    color: colors.textMuted
  },
  buttonWrap: {
    width: "100%",
    marginTop: 10
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  statCard: {
    width: "48%",
    borderRadius: 22,
    padding: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6
  },
  statCardWide: {
    width: "100%",
    borderRadius: 22,
    padding: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6
  },
  statValue: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: "800"
  },
  statLabel: {
    color: colors.textMuted,
    lineHeight: 19
  },
  settingsCard: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8
  },
  settingsTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(26,26,46,0.06)"
  },
  settingLabel: {
    color: colors.text,
    fontSize: 15
  },
  settingValue: {
    color: colors.textMuted,
    fontWeight: "600"
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(26,26,46,0.42)",
    justifyContent: "center",
    padding: 20
  },
  modalCard: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: colors.surface,
    gap: 14
  },
  modalTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800"
  },
  modalActions: {
    flexDirection: "row",
    gap: 12
  }
});

