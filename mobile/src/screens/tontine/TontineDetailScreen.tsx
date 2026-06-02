import { Ionicons } from "@expo/vector-icons";
import { getTierFromCents } from "../../utils/tiers";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Share, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTontineStore } from "../../store/tontineStore";
import { colors } from "../../theme/colors";
import { useLang } from "../../i18n/useLang";
import type { TontineDetailScreenProps } from "../../types/navigation";

function fmtMoney(amount: number, currency: string) {
  return amount.toLocaleString("fr-FR", { style: "currency", currency: currency || "EUR" });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function TontineDetailScreen({ navigation, route }: TontineDetailScreenProps) {
  const { t } = useLang();
  const { tontineId } = route.params;
  const tontine = useTontineStore((s) => s.currentTontine);
  const fetchTontineById = useTontineStore((s) => s.fetchTontineById);
  const contribute = useTontineStore((s) => s.contribute);
  const toggleAutoPay = useTontineStore((s) => s.toggleAutoPay);

  const [paying, setPaying] = useState(false);
  const [autoPayOn, setAutoPayOn] = useState(false);
  const [autoPayLoading, setAutoPayLoading] = useState(false);

  useFocusEffect(useCallback(() => {
    void fetchTontineById(tontineId);
  }, [fetchTontineById, tontineId]));

  if (!tontine) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const tontineDetail = tontine;

  const progress = tontineDetail.progression
    ? (tontineDetail.progression.paidMembers / Math.max(tontineDetail.progression.totalMembers, 1)) * 100
    : 0;

  async function handlePay() {
    setPaying(true);
    try {
      const res = await contribute(tontineId, "WALLET");
      if (res.status === "PAID") {
        Alert.alert(t("detail.paySuccess"), t("detail.paySuccessMsg"));
      } else if (res.checkoutUrl) {
        Alert.alert(t("common.stripe"), t("detail.payStripeMsg"));
      } else {
        Alert.alert(t("detail.payPendingMsg"), t("detail.payPending"));
      }
      void fetchTontineById(tontineId);
    } catch (err) {
      Alert.alert(t("common.error"), err instanceof Error ? err.message : t("detail.payErr"));
    }
    setPaying(false);
  }

  const joinLink = `https://tontineapp-web.vercel.app/g/${tontineDetail.joinCode}`;

  async function handleShare() {
    await Share.share({
      message: `🤝 Rejoins *${tontineDetail.name}* sur Kotizy !\nCode : ${tontineDetail.joinCode}\n${joinLink}`,
      url: joinLink,
      title: `${t("detail.invite")} — ${tontineDetail.name}`,
    });
  }

  async function handleWhatsApp() {
    const msg = encodeURIComponent(
      `🤝 Rejoins *${tontineDetail.name}* sur Kotizy, l'app de tontine pour la diaspora 🌍\n\nCode : *${tontineDetail.joinCode}*\n→ ${joinLink}`
    );
    const url = `whatsapp://send?text=${msg}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      await handleShare();
    }
  }

  async function handleToggleAutoPay(val: boolean) {
    setAutoPayLoading(true);
    try {
      await toggleAutoPay(tontineId, val);
      setAutoPayOn(val);
    } catch {}
    setAutoPayLoading(false);
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={s.header}>
          <Pressable style={s.back} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
          <Text style={s.headerTitle} numberOfLines={1}>{tontine.name}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable style={s.shareBtn} onPress={() => void handleWhatsApp()}>
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            </Pressable>
            <Pressable style={s.shareBtn} onPress={() => void handleShare()}>
              <Ionicons name="share-social-outline" size={20} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        {/* Badge gem */}
        {(() => {
          const tier = getTierFromCents(Math.round(tontine.contributionAmount * 100));
          return (
            <View style={{ marginHorizontal: 20, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <View style={{ borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: tier.bg, flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ fontSize: 14 }}>{tier.emoji}</Text>
                <Text style={{ fontSize: 12, fontWeight: "900", color: tier.color }}>{t("detail.circle")} {tier.name}</Text>
              </View>
              <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{tier.tagline}</Text>
            </View>
          );
        })()}

        {/* Carte principale */}
        <View style={s.mainCard}>
          <Text style={s.mainCode}>{tontine.joinCode}</Text>
          <Text style={s.mainAmt}>{fmtMoney(tontine.contributionAmount, tontine.currency)}</Text>
          <Text style={s.mainSub}>{t("detail.nextPayment")} {fmtDate(tontine.nextPayoutDate)}</Text>
          <View style={s.pb}><View style={[s.pbFill, { width: `${Math.min(progress, 100)}%` as `${number}%` }]} /></View>
          <Text style={s.pbTxt}>{progress.toFixed(0)}% {t("detail.round")} {tontine.currentRound}/{tontine.totalRounds}</Text>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          {[
            { label: t("detail.members"), val: `${tontine.membersCount}/${tontine.maxMembers ?? tontine.membersCount}` },
            { label: t("detail.paid"), val: String(tontine.progression?.paidMembers ?? 0) },
            { label: t("detail.totalPot"), val: fmtMoney(tontine.totalPot ?? 0, tontine.currency) },
          ].map(({ label, val }) => (
            <View key={label} style={s.statCard}>
              <Text style={s.statVal}>{val}</Text>
              <Text style={s.statLbl}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={s.section}>
          {/* Payer */}
          <Pressable style={[s.payBtn, paying && s.payBtnDisabled]} onPress={() => void handlePay()} disabled={paying}>
            {paying
              ? <ActivityIndicator color={colors.dark} size="small" />
              : <><Ionicons name="card" size={20} color={colors.dark} /><Text style={s.payBtnTxt}>{t("detail.payNow")}</Text></>
            }
          </Pressable>

          {/* Auto-pay */}
          <View style={s.autoPayCard}>
            <View style={s.autoPayLeft}>
              <Ionicons name="flash" size={20} color={autoPayOn ? colors.primary : colors.textMuted} />
              <View>
                <Text style={s.autoPayTitle}>{t("detail.autoPay")}</Text>
                <Text style={s.autoPaySub}>{autoPayOn ? t("detail.autoPaySub") : t("detail.autoPayOff")}</Text>
              </View>
            </View>
            {autoPayLoading
              ? <ActivityIndicator color={colors.primary} size="small" />
              : <Switch value={autoPayOn} onValueChange={(v) => void handleToggleAutoPay(v)} trackColor={{ false: colors.border, true: `${colors.primary}66` }} thumbColor={autoPayOn ? colors.primary : colors.textMuted} />
            }
          </View>
        </View>

        {/* Membres */}
        {tontine.members && tontine.members.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Ordre de passage</Text>
            {tontine.members.map((m) => (
              <View key={m.id} style={s.memberRow}>
                <View style={s.memberAvatar}>
                  <Text style={s.memberAvatarTxt}>{initials(m.fullName)}</Text>
                </View>
                <View style={s.memberInfo}>
                  <Text style={s.memberName}>{m.payoutOrder}. {m.fullName}</Text>
                </View>
                <View style={[s.memberStatus,
                  m.paymentStatus === "paid" ? s.statusPaid :
                  m.paymentStatus === "late" ? s.statusLate : s.statusPending
                ]}>
                  <Text style={[s.memberStatusTxt,
                    m.paymentStatus === "paid" ? { color: colors.primary } :
                    m.paymentStatus === "late" ? { color: colors.danger } : { color: colors.textMuted }
                  ]}>
                    {m.paymentStatus === "paid" ? "Payé" : m.paymentStatus === "late" ? "Retard" : "En attente"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Description */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Description</Text>
          <View style={s.descCard}>
            <Text style={s.descTxt}>{tontine.description}</Text>
          </View>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.dark },

  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 12 },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: colors.border },
  headerTitle: { flex: 1, fontSize: 18, color: colors.text, fontWeight: "900" },
  statusBadge: { backgroundColor: `${colors.primary}22`, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  shareBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: `${colors.primary}15`, justifyContent: "center", alignItems: "center" },
  statusTxt: { color: colors.primary, fontSize: 12, fontWeight: "700" },

  mainCard: { marginHorizontal: 20, marginBottom: 12, backgroundColor: colors.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border, gap: 8 },
  mainCode: { fontSize: 11, color: colors.textMuted, fontWeight: "700", letterSpacing: 2 },
  mainAmt: { fontSize: 36, color: colors.text, fontWeight: "900" },
  mainSub: { fontSize: 13, color: colors.textMuted },
  pb: { height: 6, backgroundColor: colors.surfaceCard, borderRadius: 3, overflow: "hidden", marginTop: 4 },
  pbFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 3 },
  pbTxt: { fontSize: 12, color: colors.textMuted },

  statsRow: { flexDirection: "row", gap: 8, marginHorizontal: 20, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 12, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  statVal: { fontSize: 16, color: colors.text, fontWeight: "900", textAlign: "center" },
  statLbl: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  section: { paddingHorizontal: 20, marginBottom: 16 },
  sectionTitle: { fontSize: 15, color: colors.text, fontWeight: "900", marginBottom: 10 },

  payBtn: { backgroundColor: colors.primary, borderRadius: 18, paddingVertical: 16, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, marginBottom: 10 },
  payBtnDisabled: { opacity: 0.5 },
  payBtnTxt: { color: colors.dark, fontSize: 16, fontWeight: "900" },

  autoPayCard: { backgroundColor: colors.surface, borderRadius: 18, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: colors.border },
  autoPayLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  autoPayTitle: { fontSize: 14, color: colors.text, fontWeight: "800" },
  autoPaySub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  memberRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  memberAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: `${colors.primary}22`, justifyContent: "center", alignItems: "center" },
  memberAvatarTxt: { color: colors.primary, fontWeight: "900", fontSize: 15 },
  memberInfo: { flex: 1 },
  memberName: { color: colors.text, fontWeight: "700", fontSize: 14 },
  memberStatus: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusPaid: { backgroundColor: `${colors.primary}22` },
  statusLate: { backgroundColor: `${colors.danger}22` },
  statusPending: { backgroundColor: colors.surfaceCard },
  memberStatusTxt: { fontSize: 11, fontWeight: "700" },

  descCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border },
  descTxt: { color: colors.textMuted, fontSize: 14, lineHeight: 22 },
});
