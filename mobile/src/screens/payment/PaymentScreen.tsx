import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "../../components/AppHeader";
import { Button } from "../../components/Button";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { initializePayment, processPayment, confirmPayment as confirmPaymentService } from "../../services/paymentService";
import { useContributionStore } from "../../store/contributionStore";
import { useAppStore } from "../../store/appStore";
import { colors } from "../../theme/colors";
import type { PaymentScreenProps } from "../../types/navigation";

/**
 * Ecran de paiement d'une cotisation avec fallback demo sur web.
 */
export function PaymentScreen({ navigation, route }: PaymentScreenProps) {
  const { tontineId, amount, tontineName } = route.params;
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchContributions = useContributionStore((state) => state.fetchContributions);
  const isDemoMode = useAppStore((state) => state.isDemoMode);

  const dueDate = useMemo(() => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date());
  }, []);

  async function handlePayment() {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const payment = await initializePayment(tontineId, amount);
      const paymentResult = await processPayment(
        payment.clientSecret,
        payment.paymentIntentId
      );

      if (!paymentResult.success || !paymentResult.paymentIntentId) {
        throw new Error(paymentResult.error ?? "Paiement interrompu.");
      }

      await confirmPaymentService(paymentResult.paymentIntentId, tontineId, amount);
      await fetchContributions(tontineId);

      setIsSuccess(true);
      Alert.alert("Paiement confirme", "Votre cotisation a bien ete enregistree.", [
        {
          text: "OK",
          onPress: () => navigation.goBack()
        }
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur de paiement.";
      setErrorMessage(message);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <ScreenContainer tone="light">
      <AppHeader title="Paiement" showBack onBack={() => navigation.goBack()} />

      <View style={styles.card}>
        <Text style={styles.eyebrow}>{isDemoMode ? "Mode demo" : "Paiement securise"}</Text>
        <Text style={styles.title}>{tontineName}</Text>
        <Text style={styles.amount}>{amount} EUR</Text>
        <Text style={styles.meta}>Date de cotisation : {dueDate}</Text>
        <Text style={styles.description}>
          Confirmez votre participation pour cette tontine. En environnement web actuel, le flux
          peut basculer en simulation propre.
        </Text>
      </View>

      {isSuccess ? (
        <View style={[styles.feedbackCard, styles.feedbackSuccess]}>
          <Text style={styles.feedbackTitle}>Paiement confirme ✅</Text>
          <Text style={styles.feedbackText}>Votre cotisation a bien ete enregistree.</Text>
        </View>
      ) : null}

      {errorMessage ? (
        <View style={[styles.feedbackCard, styles.feedbackError]}>
          <Text style={styles.feedbackTitle}>Paiement non abouti</Text>
          <Text style={styles.feedbackText}>{errorMessage}</Text>
        </View>
      ) : null}

      <Button onPress={() => void handlePayment()} disabled={isProcessing}>
        {isProcessing ? "Paiement en cours..." : `Payer ${amount} EUR`}
      </Button>

      {isProcessing ? (
        <View style={styles.loaderRow}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loaderText}>Traitement du paiement...</Text>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
    marginBottom: 20
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text
  },
  amount: {
    fontSize: 30,
    fontWeight: "800",
    color: colors.primary
  },
  meta: {
    color: colors.textMuted
  },
  description: {
    color: colors.textMuted,
    lineHeight: 22
  },
  feedbackCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    gap: 6
  },
  feedbackSuccess: {
    backgroundColor: "#EAF8EE"
  },
  feedbackError: {
    backgroundColor: "#FFF0F0"
  },
  feedbackTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700"
  },
  feedbackText: {
    color: colors.textMuted,
    lineHeight: 20
  },
  loaderRow: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10
  },
  loaderText: {
    color: colors.textMuted
  }
});
