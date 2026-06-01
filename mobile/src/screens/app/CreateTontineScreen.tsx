import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppHeader } from "../../components/AppHeader";
import { Button } from "../../components/Button";
import { ErrorMessage } from "../../components/ErrorMessage";
import { Input } from "../../components/Input";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { useTontineStore } from "../../store/tontineStore";
import { colors } from "../../theme/colors";
import { useLang } from "../../i18n/useLang";
import type { TontineFrequency } from "../../types/entities";
import type { CreateTontineScreenProps } from "../../types/navigation";

type FormErrors = {
  name?: string;
  amount?: string;
  members?: string;
  startDate?: string;
};

/**
 * Ecran de creation d'une tontine pense d'abord pour le mobile.
 */
export function CreateTontineScreen({ navigation }: CreateTontineScreenProps) {
  const { t } = useLang();

  const FREQUENCIES: Array<{ label: string; hint: string; value: TontineFrequency }> = [
    { label: t("create.freqMonthly"), hint: t("create.freqMonthlyHint"), value: "monthly" },
    { label: t("create.freqBiweekly"), hint: t("create.freqBiweeklyHint"), value: "biweekly" },
    { label: t("create.freqWeekly"), hint: t("create.freqWeeklyHint"), value: "weekly" },
  ];

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("200");
  const [frequency, setFrequency] = useState<TontineFrequency>("monthly");
  const [members, setMembers] = useState(8);
  const [startDate, setStartDate] = useState(getTomorrow());
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const createTontine = useTontineStore((state) => state.createTontine);
  const isLoading = useTontineStore((state) => state.isLoading);
  const storeError = useTontineStore((state) => state.errorMessage);

  const parsedAmount = Number(amount.replace(",", "."));
  const totalPot = useMemo(() => {
    return Number.isFinite(parsedAmount) ? parsedAmount * members : 0;
  }, [members, parsedAmount]);

  function validateForm(): FormErrors {
    const nextErrors: FormErrors = {};
    const parsedDate = parseFrenchDate(startDate);

    if (!name.trim()) {
      nextErrors.name = t("create.err.name");
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount < 10 || parsedAmount > 10000) {
      nextErrors.amount = t("create.err.amount");
    }

    if (members < 2 || members > 50) {
      nextErrors.members = t("create.err.members");
    }

    if (!parsedDate || parsedDate.getTime() <= Date.now()) {
      nextErrors.startDate = t("create.err.date");
    }

    return nextErrors;
  }

  async function handleCreate() {
    const nextErrors = validateForm();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await createTontine({
      name: name.trim(),
      description: description.trim() || "Nouvelle tontine Kotizy",
      contributionAmount: parsedAmount,
      currency: "EUR",
      frequency: frequency.toUpperCase(),
      maxMembers: members,
      rules: "Cotisation avant la date limite. Ponctualité obligatoire.",
    });

    if (useTontineStore.getState().errorMessage) {
      return;
    }

    Alert.alert(t("create.successTitle"), t("create.successMsg"));
    navigation.goBack();
  }

  return (
    <ScreenContainer tone="dark" scrollable={false}>
      <View style={styles.wrapper}>
        <AppHeader title={t("create.title")} showBack onBack={() => navigation.goBack()} />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroCard}>
            <Text style={styles.heroEyebrow}>{t("create.eyebrow")}</Text>
            <Text style={styles.heroTitle}>{t("create.heroTitle")}</Text>
            <Text style={styles.heroText}>{t("create.heroText")}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t("create.sectionTitle")}</Text>

            <Input
              label={t("create.nameLabel")}
              placeholder={t("create.namePh")}
              value={name}
              onChangeText={setName}
              maxLength={50}
              error={errors.name}
            />

            <Input
              label={t("create.amountLabel")}
              placeholder="200"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              error={errors.amount}
            />

            <View style={styles.block}>
              <Text style={styles.blockLabel}>{t("create.freqLabel")}</Text>
              <View style={styles.frequencyList}>
                {FREQUENCIES.map((option) => {
                  const isActive = frequency === option.value;

                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setFrequency(option.value)}
                      style={[styles.frequencyCard, isActive ? styles.frequencyCardActive : null]}
                    >
                      <View style={styles.frequencyCopy}>
                        <Text
                          style={[
                            styles.frequencyTitle,
                            isActive ? styles.frequencyTitleActive : null
                          ]}
                        >
                          {option.label}
                        </Text>
                        <Text
                          style={[
                            styles.frequencyHint,
                            isActive ? styles.frequencyHintActive : null
                          ]}
                        >
                          {option.hint}
                        </Text>
                      </View>
                      <View style={[styles.radio, isActive ? styles.radioActive : null]}>
                        {isActive ? <View style={styles.radioDot} /> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.block}>
              <Text style={styles.blockLabel}>{t("create.membersLabel")}</Text>
              <View style={styles.membersShell}>
                <Pressable
                  style={styles.membersButton}
                  onPress={() => setMembers((current) => Math.max(2, current - 1))}
                >
                  <Ionicons name="remove" size={18} color={colors.primary} />
                </Pressable>
                <View style={styles.membersCenter}>
                  <Text style={styles.membersValue}>{members}</Text>
                  <Text style={styles.membersHint}>{t("create.membersHint")}</Text>
                </View>
                <Pressable
                  style={styles.membersButton}
                  onPress={() => setMembers((current) => Math.min(50, current + 1))}
                >
                  <Ionicons name="add" size={18} color={colors.primary} />
                </Pressable>
              </View>
              {errors.members ? <Text style={styles.fieldError}>{errors.members}</Text> : null}
            </View>

            <Input
              label={t("create.startLabel")}
              placeholder={t("create.startPh")}
              value={startDate}
              onChangeText={setStartDate}
              autoCapitalize="none"
              error={errors.startDate}
            />

            <Input
              label={t("create.descLabel")}
              placeholder={t("create.descPh")}
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={200}
            />
          </View>

          <View style={styles.previewCard}>
            <Text style={styles.previewEyebrow}>{t("create.previewLabel")}</Text>
            <Text style={styles.previewName}>{name.trim() || t("create.previewDefault")}</Text>

            <View style={styles.previewGrid}>
              <View style={styles.previewMetric}>
                <Text style={styles.previewMetricLabel}>{t("create.previewPot")}</Text>
                <Text style={styles.previewMetricValue}>{totalPot.toLocaleString("fr-FR")}€</Text>
              </View>
              <View style={styles.previewMetric}>
                <Text style={styles.previewMetricLabel}>{t("create.previewFreq")}</Text>
                <Text style={styles.previewMetricValue}>
                  {FREQUENCIES.find((item) => item.value === frequency)?.label ?? t("create.freqMonthly")}
                </Text>
              </View>
            </View>

            <Text style={styles.previewText}>
              {members} {t("create.previewBody")} {Number.isFinite(parsedAmount) ? parsedAmount : 0}€ {t("create.previewBodyEnd")}
            </Text>
            <Text style={styles.previewDescription}>
              {description.trim() || t("create.previewDescDefault")}
            </Text>
          </View>

          {storeError ? <ErrorMessage message={storeError} /> : null}
        </ScrollView>

        <View style={styles.footer}>
          <Button onPress={() => void handleCreate()} loading={isLoading}>
            {t("create.btn")}
          </Button>
        </View>
      </View>
    </ScreenContainer>
  );
}

function parseFrenchDate(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  const date = new Date(`${year}-${month}-${day}T09:00:00.000Z`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getTomorrow() {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return `${String(tomorrow.getDate()).padStart(2, "0")}/${String(
    tomorrow.getMonth() + 1
  ).padStart(2, "0")}/${tomorrow.getFullYear()}`;
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
    padding: 20,
    backgroundColor: "rgba(34,197,94,0.08)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.2)",
    gap: 10
  },
  heroEyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  heroTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 28
  },
  heroText: {
    color: colors.textMuted,
    lineHeight: 22
  },
  card: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 16
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  block: {
    gap: 12
  },
  blockLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700"
  },
  frequencyList: {
    gap: 10
  },
  frequencyCard: {
    minHeight: 68,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  frequencyCardActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary
  },
  frequencyCopy: {
    flex: 1,
    gap: 2
  },
  frequencyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700"
  },
  frequencyTitleActive: {
    color: colors.primary
  },
  frequencyHint: {
    color: colors.textMuted,
    fontSize: 13
  },
  frequencyHintActive: {
    color: colors.primary
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  radioActive: {
    borderColor: colors.primary
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary
  },
  membersShell: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12
  },
  membersButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted
  },
  membersCenter: {
    flex: 1,
    minHeight: 68,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surfaceMuted,
    gap: 2
  },
  membersValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800"
  },
  membersHint: {
    color: colors.textMuted,
    fontSize: 12
  },
  fieldError: {
    color: colors.danger,
    fontSize: 13
  },
  previewCard: {
    borderRadius: 24,
    padding: 18,
    backgroundColor: "rgba(34,197,94,0.06)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.2)",
    gap: 12
  },
  previewEyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1
  },
  previewName: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900"
  },
  previewGrid: {
    flexDirection: "row",
    gap: 10
  },
  previewMetric: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    gap: 4
  },
  previewMetricLabel: {
    color: colors.textMuted,
    fontSize: 12
  },
  previewMetricValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800"
  },
  previewText: {
    color: colors.text,
    fontWeight: "700",
    lineHeight: 22
  },
  previewDescription: {
    color: colors.textMuted,
    lineHeight: 22
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: "rgba(8,11,7,0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)"
  }
});
