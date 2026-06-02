import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Button } from "../../components/Button";
import { ErrorMessage } from "../../components/ErrorMessage";
import { Input } from "../../components/Input";
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

export function CreateTontineScreen({ navigation }: CreateTontineScreenProps) {
  const { t } = useLang();

  const FREQUENCIES: Array<{ label: string; hint: string; value: TontineFrequency }> = [
    { label: t("create.freqMonthly"),   hint: t("create.freqMonthlyHint"),   value: "monthly" },
    { label: t("create.freqBiweekly"),  hint: t("create.freqBiweeklyHint"),  value: "biweekly" },
    { label: t("create.freqWeekly"),    hint: t("create.freqWeeklyHint"),     value: "weekly" },
  ];

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("100");
  const [frequency, setFrequency] = useState<TontineFrequency>("monthly");
  const [members, setMembers] = useState(8);
  const [startDate, setStartDate] = useState(getTomorrow());
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});

  const createTontine = useTontineStore((s) => s.createTontine);
  const isLoading = useTontineStore((s) => s.isLoading);
  const storeError = useTontineStore((s) => s.errorMessage);

  const parsedAmount = Number(amount.replace(",", "."));
  const totalPot = useMemo(
    () => (Number.isFinite(parsedAmount) ? parsedAmount * members : 0),
    [parsedAmount, members]
  );

  function validate(): FormErrors {
    const e: FormErrors = {};
    if (!name.trim()) e.name = t("create.err.name");
    if (!Number.isFinite(parsedAmount) || parsedAmount < 10 || parsedAmount > 10000) e.amount = t("create.err.amount");
    if (members < 2 || members > 50) e.members = t("create.err.members");
    const d = parseFrenchDate(startDate);
    if (!d || d.getTime() <= Date.now()) e.startDate = t("create.err.date");
    return e;
  }

  async function handleCreate() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    await createTontine({
      name: name.trim(),
      description: description.trim() || "Nouvelle tontine Kotizy",
      contributionAmount: parsedAmount,
      currency: "EUR",
      frequency: frequency.toUpperCase(),
      maxMembers: members,
      rules: t("create.defaultRules"),
    });

    if (useTontineStore.getState().errorMessage) return;

    Alert.alert(t("create.successTitle"), t("create.successMsg"));
    navigation.goBack();
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={s.headerTitle}>{t("create.title")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <View style={s.heroCard}>
          <Text style={s.heroEyebrow}>{t("create.eyebrow")}</Text>
          <Text style={s.heroTitle}>{t("create.heroTitle")}</Text>
          <Text style={s.heroText}>{t("create.heroText")}</Text>
        </View>

        {/* Formulaire */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>{t("create.sectionTitle")}</Text>

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
            placeholder="100"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            error={errors.amount}
          />

          {/* Fréquence */}
          <View style={s.block}>
            <Text style={s.blockLabel}>{t("create.freqLabel")}</Text>
            <View style={s.freqList}>
              {FREQUENCIES.map((opt) => {
                const active = frequency === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setFrequency(opt.value)}
                    style={[s.freqCard, active && s.freqCardActive]}
                  >
                    <View style={s.freqCopy}>
                      <Text style={[s.freqTitle, active && s.freqTitleActive]}>{opt.label}</Text>
                      <Text style={[s.freqHint, active && s.freqHintActive]}>{opt.hint}</Text>
                    </View>
                    <View style={[s.radio, active && s.radioActive]}>
                      {active && <View style={s.radioDot} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Membres */}
          <View style={s.block}>
            <Text style={s.blockLabel}>{t("create.membersLabel")}</Text>
            <View style={s.membersRow}>
              <Pressable style={s.membersBtn} onPress={() => setMembers((n) => Math.max(2, n - 1))}>
                <Ionicons name="remove" size={20} color={colors.primary} />
              </Pressable>
              <View style={s.membersCenter}>
                <Text style={s.membersVal}>{members}</Text>
                <Text style={s.membersHint}>{t("create.membersHint")}</Text>
              </View>
              <Pressable style={s.membersBtn} onPress={() => setMembers((n) => Math.min(50, n + 1))}>
                <Ionicons name="add" size={20} color={colors.primary} />
              </Pressable>
            </View>
            {errors.members ? <Text style={s.fieldErr}>{errors.members}</Text> : null}
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

        {/* Aperçu */}
        <View style={s.previewCard}>
          <Text style={s.previewEyebrow}>{t("create.previewLabel")}</Text>
          <Text style={s.previewName}>{name.trim() || t("create.previewDefault")}</Text>
          <View style={s.previewGrid}>
            <View style={s.previewMetric}>
              <Text style={s.previewMetricLbl}>{t("create.previewPot")}</Text>
              <Text style={s.previewMetricVal}>{totalPot.toLocaleString("fr-FR")}€</Text>
            </View>
            <View style={s.previewMetric}>
              <Text style={s.previewMetricLbl}>{t("create.previewFreq")}</Text>
              <Text style={s.previewMetricVal}>
                {FREQUENCIES.find((f) => f.value === frequency)?.label ?? t("create.freqMonthly")}
              </Text>
            </View>
          </View>
          <Text style={s.previewText}>
            {members} {t("create.previewBody")} {Number.isFinite(parsedAmount) ? parsedAmount : 0}€ {t("create.previewBodyEnd")}
          </Text>
          <Text style={s.previewDesc}>
            {description.trim() || t("create.previewDescDefault")}
          </Text>
        </View>

        {storeError ? <ErrorMessage message={storeError} /> : null}

        {/* Bouton dans le scroll pour éviter le décalage */}
        <View style={s.btnWrap}>
          <Button onPress={() => void handleCreate()} loading={isLoading}>
            {t("create.btn")}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function parseFrenchDate(value: string) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(`${year}-${month}-${day}T09:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getTomorrow() {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.dark },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: colors.border },
  headerTitle: { fontSize: 18, color: colors.text, fontWeight: "900" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 16 },

  heroCard: { borderRadius: 24, padding: 20, backgroundColor: "rgba(34,197,94,0.08)", borderWidth: 1, borderColor: "rgba(34,197,94,0.2)", gap: 10 },
  heroEyebrow: { color: colors.primary, fontSize: 12, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase" },
  heroTitle: { color: colors.text, fontSize: 20, fontWeight: "900", lineHeight: 26 },
  heroText: { color: colors.textMuted, lineHeight: 20, fontSize: 14 },

  card: { borderRadius: 24, padding: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 16 },
  sectionTitle: { color: colors.text, fontSize: 17, fontWeight: "800" },

  block: { gap: 10 },
  blockLabel: { color: colors.text, fontSize: 14, fontWeight: "700" },

  freqList: { gap: 10 },
  freqCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceCard, paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  freqCardActive: { backgroundColor: `${colors.primary}15`, borderColor: colors.primary },
  freqCopy: { flex: 1, gap: 2 },
  freqTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  freqTitleActive: { color: colors.primary },
  freqHint: { color: colors.textMuted, fontSize: 12 },
  freqHintActive: { color: colors.primary },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },

  membersRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  membersBtn: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.border },
  membersCenter: { flex: 1, height: 64, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceCard, gap: 2 },
  membersVal: { color: colors.text, fontSize: 24, fontWeight: "800" },
  membersHint: { color: colors.textMuted, fontSize: 12 },
  fieldErr: { color: colors.danger, fontSize: 13 },

  previewCard: { borderRadius: 24, padding: 18, backgroundColor: "rgba(34,197,94,0.06)", borderWidth: 1, borderColor: "rgba(34,197,94,0.2)", gap: 12 },
  previewEyebrow: { color: colors.primary, fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1 },
  previewName: { color: colors.text, fontSize: 20, fontWeight: "900" },
  previewGrid: { flexDirection: "row", gap: 10 },
  previewMetric: { flex: 1, borderRadius: 16, padding: 14, backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", gap: 4 },
  previewMetricLbl: { color: colors.textMuted, fontSize: 12 },
  previewMetricVal: { color: colors.text, fontSize: 16, fontWeight: "800" },
  previewText: { color: colors.text, fontWeight: "700", lineHeight: 22 },
  previewDesc: { color: colors.textMuted, lineHeight: 22, fontSize: 13 },

  btnWrap: { marginTop: 8 },
});
