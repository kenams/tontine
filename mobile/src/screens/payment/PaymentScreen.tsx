import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "../../components/AppHeader";
import { Button } from "../../components/Button";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { initializePayment, processPayment, confirmPayment as confirmPaymentService } from "../../services/paymentService";
import { useContributionStore } from "../../store/contributionStore";
import { colors } from "../../theme/colors";
import type { PaymentScreenProps } from "../../types/navigation";

export function PaymentScreen({ navigation, route }: PaymentScreenProps) {
  const { tontineId, amount, tontineName } = route.params;
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchContributions = useContributionStore((state) => state.fetchContributions);

  const dueDate = useMemo(() => {
    return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
  }, []);

  async function handlePayment() {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const payment = await initializePayment(tontineId, amount);
      const result = await processPayment(payment.clientSecret, payment.paymentIntentId);
      if (!result.success || !result.paymentIntentId) throw new Error(result.error ?? "Paiement interrompu.");
      await confirmPaymentService(result.paymentIntentId, tontineId, amount);
      await fetchContributions(tontineId);
      setIsSuccess(true);
      Alert.alert("Paiement confirmé", "Votre cotisation a bien été enregistrée.", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erreur de paiement.");
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <ScreenContainer tone="dark">
      <AppHeader title="Paiement" showBack onBack={() => navigation.goBack()} />

      <View style={s.card}>
        <Text style={s.eyebrow}>Paiement sécurisé</Text>
        <Text style={s.title}>{tontineName}</Text>
        <Text style={s.amount}>{amount} EUR</Text>
        <Text style={s.meta}>Date de cotisation : {dueDate}</Text>
      </View>

      {isSuccess && (
        <View style={[s.feedback, s.feedbackOk]}>
          <Text style={s.feedbackTitle}>✅ Paiement confirmé</Text>
          <Text style={s.feedbackText}>Votre cotisation a bien été enregistrée.</Text>
        </View>
      )}

      {errorMessage && (
        <View style={[s.feedback, s.feedbackErr]}>
          <Text style={s.feedbackTitle}>Paiement non abouti</Text>
          <Text style={s.feedbackText}>{errorMessage}</Text>
        </View>
      )}

      <Button onPress={() => void handlePayment()} disabled={isProcessing}>
        {isProcessing ? "Traitement..." : `Payer ${amount} EUR`}
      </Button>

      {isProcessing && (
        <View style={s.loader}>
          <ActivityIndicator color={colors.primary} />
          <Text style={s.loaderTxt}>Traitement du paiement...</Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 24, padding: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 10, marginBottom: 20 },
  eyebrow: { color: colors.primary, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  title: { fontSize: 24, fontWeight: "900", color: colors.text },
  amount: { fontSize: 30, fontWeight: "900", color: colors.primary },
  meta: { color: colors.textMuted },
  feedback: { borderRadius: 20, padding: 16, marginBottom: 16, gap: 6 },
  feedbackOk: { backgroundColor: `${colors.primary}15`, borderWidth: 1, borderColor: `${colors.primary}30` },
  feedbackErr: { backgroundColor: `${colors.danger}15`, borderWidth: 1, borderColor: `${colors.danger}30` },
  feedbackTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  feedbackText: { color: colors.textMuted, lineHeight: 20 },
  loader: { marginTop: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  loaderTxt: { color: colors.textMuted },
});
