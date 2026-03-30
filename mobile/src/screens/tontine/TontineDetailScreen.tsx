import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "../../components/AppHeader";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { MemberRow } from "../../components/MemberRow";
import { ProgressBar } from "../../components/ProgressBar";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { demoMembersByTontine, demoPayoutsByTontine } from "../../data/demo-data";
import { useAuthStore } from "../../store/authStore";
import { useContributionStore } from "../../store/contributionStore";
import { useTontineStore } from "../../store/tontineStore";
import { colors } from "../../theme/colors";
import type { TontineDetailScreenProps } from "../../types/navigation";

/**
 * Détail d'une tontine avec une hiérarchie plus lisible sur mobile.
 */
export function TontineDetailScreen({ navigation, route }: TontineDetailScreenProps) {
  const { tontineId } = route.params;

  const user = useAuthStore((state) => state.user);
  const currentTontine = useTontineStore((state) => state.currentTontine);
  const fetchTontineById = useTontineStore((state) => state.fetchTontineById);
  const isTontineLoading = useTontineStore((state) => state.isLoading);

  const contributions = useContributionStore((state) => state.contributions);
  const fetchContributions = useContributionStore((state) => state.fetchContributions);
  const isContributionLoading = useContributionStore((state) => state.isLoading);

  useFocusEffect(
    useCallback(() => {
      void fetchTontineById(tontineId);
      void fetchContributions(tontineId);
    }, [fetchContributions, fetchTontineById, tontineId])
  );

  const members = currentTontine?.members ?? demoMembersByTontine[tontineId] ?? [];
  const payouts = currentTontine?.distributions ?? demoPayoutsByTontine[tontineId] ?? [];

  const paidCount = contributions.filter((contribution) => contribution.status === "paid").length;
  const currentMember = members.find((member) => member.userId === user?.id);
  const alreadyPaid = currentMember
    ? contributions.some(
        (contribution) =>
          (contribution.memberId === currentMember.id || contribution.memberId === currentMember.userId) &&
          contribution.status === "paid"
      )
    : false;

  const estimatedEndDate = useMemo(() => {
    if (!currentTontine?.startDate) {
      return null;
    }

    const start = new Date(currentTontine.startDate);
    const duration =
      currentTontine.frequency === "monthly" ? 30 : currentTontine.frequency === "biweekly" ? 14 : 7;
    start.setDate(start.getDate() + duration * currentTontine.totalRounds);
    return start;
  }, [currentTontine]);

  if (isTontineLoading && !currentTontine) {
    return (
      <ScreenContainer tone="light">
        <LoadingSpinner message="Chargement des details de la tontine..." />
      </ScreenContainer>
    );
  }

  if (!currentTontine) {
    return (
      <ScreenContainer tone="light">
        <EmptyState
          title="Tontine introuvable"
          description="Impossible de retrouver cette tontine dans le mode demonstration."
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer tone="light" scrollable={false}>
      <View style={styles.wrapper}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <AppHeader title="Détail" showBack onBack={() => navigation.goBack()} />

          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={styles.heroCopy}>
                <Text style={styles.title}>{currentTontine.name}</Text>
                <Text style={styles.subtitle}>
                  {currentTontine.contributionAmount}€ / {formatFrequency(currentTontine.frequency)}
                </Text>
              </View>
              <Badge
                label={currentTontine.status === "active" ? "Active" : "Terminée"}
                variant={currentTontine.status === "active" ? "success" : "neutral"}
              />
            </View>

            <Text style={styles.description}>{currentTontine.description}</Text>

            <View style={styles.metricsRow}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Début</Text>
                <Text style={styles.metricValue}>
                  {formatDate(currentTontine.startDate ?? currentTontine.nextPayoutDate)}
                </Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Fin estimée</Text>
                <Text style={styles.metricValue}>
                  {estimatedEndDate ? formatDate(estimatedEndDate.toISOString()) : "A définir"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.highlightCard}>
            <Text style={styles.highlightEyebrow}>Ce mois-ci</Text>
            <Text style={styles.highlightTitle}>
              {currentTontine.currentBeneficiary ?? "Bénéficiaire à définir"}
            </Text>
            <Text style={styles.highlightText}>
              {currentTontine.myTurn === 0
                ? "🎉 C'est votre tour. La cagnotte mensuelle vous est destinée."
                : `Tour ${currentTontine.currentRound} en cours. Le groupe verse actuellement pour ${currentTontine.currentBeneficiary}.`}
            </Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Progression du tour</Text>
            <ProgressBar
              value={currentTontine.progression?.paidMembers ?? paidCount}
              total={currentTontine.progression?.totalMembers ?? currentTontine.membersCount}
              label="Membres ayant payé"
            />
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Membres</Text>
              <Text style={styles.sectionMeta}>{members.length} participants</Text>
            </View>
            {members.map((member) => (
              <MemberRow key={member.id} member={member} />
            ))}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Historique</Text>
              <Text style={styles.sectionMeta}>{payouts.length} distributions</Text>
            </View>
            {payouts.length ? (
              payouts.map((payout) => (
                <View key={payout.id} style={styles.historyRow}>
                  <View style={styles.historyCopy}>
                    <Text style={styles.historyDate}>{formatDate(payout.scheduledAt)}</Text>
                    <Text style={styles.historySubtitle}>Distribution programmée</Text>
                  </View>
                  <Text style={styles.historyAmount}>{payout.amount}€</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>Aucune distribution passée pour l'instant.</Text>
            )}
          </View>

          <Button variant="secondary" onPress={() => navigation.navigate("Chat", { tontineId })}>
            Ouvrir le chat du groupe
          </Button>
        </ScrollView>

        <View style={styles.bottomBar}>
          <Button
            onPress={() =>
              navigation.navigate("Payment", {
                tontineId,
                amount: currentTontine.contributionAmount,
                tontineName: currentTontine.name
              })
            }
            disabled={alreadyPaid}
            loading={isContributionLoading}
          >
            {alreadyPaid ? "Déjà payé ✅" : `Cotiser ${currentTontine.contributionAmount}€`}
          </Button>
        </View>
      </View>
    </ScreenContainer>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(value));
}

function formatFrequency(value: "weekly" | "biweekly" | "monthly") {
  if (value === "weekly") {
    return "semaine";
  }

  if (value === "biweekly") {
    return "quinzaine";
  }

  return "mois";
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1
  },
  scrollContent: {
    gap: 16,
    paddingBottom: 120
  },
  heroCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 14
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12
  },
  heroCopy: {
    flex: 1,
    gap: 4
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800"
  },
  subtitle: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "700"
  },
  description: {
    color: colors.textMuted,
    lineHeight: 22
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10
  },
  metricCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    backgroundColor: colors.surfaceMuted,
    gap: 4
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 12
  },
  metricValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  highlightCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: colors.primary,
    gap: 8
  },
  highlightEyebrow: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  highlightTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "800"
  },
  highlightText: {
    color: "rgba(255,255,255,0.9)",
    lineHeight: 22
  },
  sectionCard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  sectionMeta: {
    color: colors.textMuted,
    fontSize: 12
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 18,
    padding: 14,
    backgroundColor: colors.surfaceMuted
  },
  historyCopy: {
    flex: 1,
    gap: 2
  },
  historyDate: {
    color: colors.text,
    fontWeight: "700"
  },
  historySubtitle: {
    color: colors.textMuted,
    fontSize: 12
  },
  historyAmount: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "800"
  },
  emptyText: {
    color: colors.textMuted
  },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: "rgba(255,243,238,0.98)"
  }
});
