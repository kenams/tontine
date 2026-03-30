import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "../../components/AppHeader";
import { EmptyState } from "../../components/EmptyState";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { StatsCard } from "../../components/StatsCard";
import { TontineCard } from "../../components/TontineCard";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { useAuthStore } from "../../store/authStore";
import { useContributionStore } from "../../store/contributionStore";
import { useNotificationStore } from "../../store/notificationStore";
import { useTontineStore } from "../../store/tontineStore";
import { colors } from "../../theme/colors";
import type { HomeScreenProps } from "../../types/navigation";

/**
 * Tableau de bord principal repensé pour un usage téléphone.
 */
export function HomeScreen({ navigation }: HomeScreenProps) {
  const [refreshing, setRefreshing] = useState(false);

  const user = useAuthStore((state) => state.user);
  const tontines = useTontineStore((state) => state.tontines);
  const fetchMyTontines = useTontineStore((state) => state.fetchMyTontines);
  const isTontineLoading = useTontineStore((state) => state.isLoading);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const contributionsByTontine = useContributionStore((state) => state.contributionsByTontine);

  const totalSaved = useMemo(() => {
    return Object.values(contributionsByTontine)
      .flat()
      .filter((contribution) => contribution.status === "paid")
      .reduce((sum, contribution) => sum + contribution.amount, 0);
  }, [contributionsByTontine]);

  const paidCountByTontine = useMemo(() => {
    return Object.fromEntries(
      Object.entries(contributionsByTontine).map(([tontineId, contributions]) => [
        tontineId,
        contributions.filter((contribution) => contribution.status === "paid").length
      ])
    ) as Record<string, number>;
  }, [contributionsByTontine]);

  /**
   * Recharge les données visibles sur le tableau de bord.
   */
  const loadDashboard = useCallback(async () => {
    await Promise.all([fetchMyTontines(), fetchNotifications()]);
  }, [fetchMyTontines, fetchNotifications]);

  useFocusEffect(
    useCallback(() => {
      void loadDashboard();
    }, [loadDashboard])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }

  return (
    <ScreenContainer tone="light">
      <FlatList
        data={tontines}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} tintColor={colors.primary} />
        }
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <AppHeader
              title="Accueil"
              showNotification
              showAvatar
              onNotificationPress={() => navigation.navigate("Notifications")}
              onAvatarPress={() => navigation.getParent()?.navigate("Profile")}
            />

            <View>
              <Text style={styles.greeting}>Bonjour, {user?.fullName ?? "Kenams"} 👋</Text>
              <Text style={styles.subtitle}>Voici la vue d'ensemble de vos tontines actives.</Text>
            </View>

            <View style={styles.heroCard}>
              <View style={styles.heroTextBlock}>
                <Text style={styles.heroLabel}>Ce mois-ci</Text>
                <Text style={styles.heroValue}>
                  {tontines.length > 0 ? `${tontines.length} groupes suivis` : "Aucun groupe actif"}
                </Text>
                <Text style={styles.heroDescription}>
                  Suivez vos paiements, vos tours de passage et les rappels importants depuis un seul espace.
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <StatsCard label="Total epargne" value={`${totalSaved}€`} icon="wallet-outline" />
              <StatsCard label="Tontines actives" value={`${tontines.length}`} icon="people-outline" />
            </View>

            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Mes tontines</Text>
              <Pressable>
                <Text style={styles.sectionLink}>Voir tout</Text>
              </Pressable>
            </View>

            {isTontineLoading && !tontines.length ? <LoadingSpinner message="Chargement des tontines..." /> : null}
          </View>
        }
        renderItem={({ item }) => (
          <TontineCard
            tontine={item}
            paidCount={paidCountByTontine[item.id] ?? 0}
            onPress={() => navigation.navigate("TontineDetail", { tontineId: item.id })}
          />
        )}
        ListEmptyComponent={
          !isTontineLoading ? (
            <EmptyState
              title="Aucune tontine pour l'instant"
              description={"Creez votre premiere tontine !"}
              ctaLabel="Creer une tontine"
              onPress={() => navigation.navigate("CreateTontine")}
            />
          ) : null
        }
      />

      <Pressable style={styles.floatingButton} onPress={() => navigation.navigate("CreateTontine")}>
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    gap: 0,
    paddingBottom: 120
  },
  headerContent: {
    gap: 16,
    marginBottom: 14
  },
  greeting: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800"
  },
  subtitle: {
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 21
  },
  heroCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: colors.dark,
    gap: 10
  },
  heroTextBlock: {
    gap: 6
  },
  heroLabel: {
    color: "rgba(255,255,255,0.72)",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 12,
    fontWeight: "700"
  },
  heroValue: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "800"
  },
  heroDescription: {
    color: "rgba(255,255,255,0.76)",
    lineHeight: 20
  },
  statsRow: {
    flexDirection: "row",
    gap: 12
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800"
  },
  sectionLink: {
    color: colors.primary,
    fontWeight: "700"
  },
  floatingButton: {
    position: "absolute",
    right: 20,
    bottom: 26,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8
  }
});

