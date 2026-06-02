import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { apiCall } from "../../services/api";
import { useStripeCompat as useStripe } from "../../hooks/useStripeCompat";
import { colors } from "../../theme/colors";
import { useLang } from "../../i18n/useLang";

// Clé publishable Stripe live — à renseigner dans .env : EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY
const STRIPE_PK = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

type WalletData = { balanceCents: number; currency: string };
type Transaction = {
  id: string; type: string; status: string;
  amountCents: number; currency: string; provider: string;
  createdAt: string; tontineGroup?: { name: string } | null;
};
type DashboardResponse = {
  user: { wallet: WalletData | null };
  transactions: Transaction[];
};

const PRESETS = [
  { label: "10 €", cents: 1000 },
  { label: "25 €", cents: 2500 },
  { label: "50 €", cents: 5000 },
  { label: "100 €", cents: 10000 },
  { label: "200 €", cents: 20000 },
  { label: "500 €", cents: 50000 },
];

function fmt(cents: number, currency: string) {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: currency || "EUR" });
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

type DepositMethod = "stripe" | "mobile_money";

function DepositModal({
  visible, onClose, onSuccess, walletCurrency,
}: { visible: boolean; onClose: () => void; onSuccess: () => void; walletCurrency: string }) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { t } = useLang();
  const [method, setMethod] = useState<DepositMethod>("stripe");
  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountCents = selected ?? (custom ? Math.round(parseFloat(custom.replace(",", ".")) * 100) : null);

  function reset() { setSelected(null); setCustom(""); setPhone(""); setError(null); }

  async function handleStripeDeposit() {
    if (!amountCents || amountCents < 100) { setError(t("wallet.deposit.minError")); return; }
    setLoading(true); setError(null);
    try {
      const res = await apiCall<{ clientSecret: string; amountCents: number; currency: string }>(
        "post", "/api/wallet/deposit/native", { amountCents }
      );
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: res.clientSecret,
        merchantDisplayName: "Kotizy",
        applePay: { merchantCountryCode: "FR" },
        googlePay: { merchantCountryCode: "FR", testEnv: false, currencyCode: res.currency.toLowerCase() },
        style: "alwaysDark",
        appearance: {
          colors: { primary: "#22c55e", background: "#111a10", componentBackground: "#1a2419", componentBorder: "#1f2e1e", componentDivider: "#1f2e1e", primaryText: "#f0ede8", secondaryText: "#6b7a69", componentText: "#f0ede8", placeholderText: "#6b7a69", icon: "#6b7a69", error: "#ef4444" },
          shapes: { borderRadius: 16, borderWidth: 0.5 },
        },
      });
      if (initError) { setError(initError.message); setLoading(false); return; }
      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if (presentError.code !== "Canceled") setError(presentError.message);
      } else {
        onClose(); reset(); setTimeout(onSuccess, 2000);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("common.unknownError");
      if (!msg.includes("réseau") && !msg.includes("network")) setError(msg);
    }
    setLoading(false);
  }

  async function handleMobileMoneyDeposit() {
    if (!amountCents || amountCents < 100) { setError(t("wallet.deposit.minError")); return; }
    setLoading(true); setError(null);
    try {
      const res = await apiCall<{ ok: boolean; paymentUrl?: string; error?: string; setup?: string }>(
        "post", "/api/wallet/deposit/cinetpay", { amountCents, phoneNumber: phone }
      );
      if (!res.ok || !res.paymentUrl) {
        setError(res.error ?? t("common.unavailable"));
        if (res.setup) setError((res.error ?? "") + "\n" + res.setup);
        setLoading(false);
        return;
      }
      // Ouvrir CinetPay dans le navigateur in-app
      const result = await WebBrowser.openBrowserAsync(res.paymentUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        toolbarColor: "#080b07",
      });
      setLoading(false);
      if (result.type === "opened" || result.type === "dismiss") {
        Alert.alert(t("wallet.mobilePay.title"), t("wallet.mobilePay.success"), [
          { text: t("wallet.mobilePay.check"), onPress: () => { onClose(); reset(); onSuccess(); } },
          { text: t("common.close"), style: "cancel" },
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.unknownError"));
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={() => { reset(); onClose(); }}>
      <View style={m.modal}>
        <View style={m.handle} />
        <View style={m.modalHeader}>
          <Text style={m.modalTitle}>{t("wallet.deposit.title")}</Text>
          <Pressable style={m.closeBtn} onPress={() => { reset(); onClose(); }}>
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Sélecteur de méthode */}
        <View style={m.methodRow}>
          {([
            { id: "stripe" as DepositMethod, label: t("wallet.deposit.stripe"), icon: "card-outline" },
            { id: "mobile_money" as DepositMethod, label: t("wallet.deposit.mobileMoney"), icon: "phone-portrait-outline" },
          ] as { id: DepositMethod; label: string; icon: string }[]).map((opt) => (
            <Pressable
              key={opt.id}
              style={[m.methodBtn, method === opt.id && m.methodBtnActive]}
              onPress={() => { setMethod(opt.id); setError(null); }}
            >
              <Ionicons name={opt.icon as never} size={18} color={method === opt.id ? colors.dark : colors.primary} />
              <Text style={[m.methodBtnTxt, method === opt.id && m.methodBtnTxtActive]}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Montant */}
        <Text style={m.label}>{t("wallet.deposit.amountLabel")}</Text>
        <View style={m.presets}>
          {PRESETS.map((p) => (
            <Pressable key={p.cents} style={[m.preset, selected === p.cents && !custom && m.presetActive]}
              onPress={() => { setSelected(p.cents); setCustom(""); setError(null); }}>
              <Text style={[m.presetTxt, selected === p.cents && !custom && m.presetTxtActive]}>{p.label}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput style={m.input} value={custom}
          onChangeText={(v) => { setCustom(v); setSelected(null); setError(null); }}
          placeholder={t("wallet.deposit.customPh")} placeholderTextColor={colors.textMuted} keyboardType="decimal-pad" />

        {/* Téléphone pour Mobile Money */}
        {method === "mobile_money" && (
          <TextInput style={m.input} value={phone}
            onChangeText={setPhone}
            placeholder={t("wallet.deposit.phonePh")}
            placeholderTextColor={colors.textMuted} keyboardType="phone-pad" />
        )}

        {amountCents && amountCents >= 100 ? (
          <View style={m.summary}>
            <Ionicons name="flash" size={14} color={colors.primary} />
            <Text style={m.summaryTxt}>{fmt(amountCents, walletCurrency)} · {t("wallet.deposit.creditSub")}</Text>
          </View>
        ) : null}

        {error ? (
          <View style={m.errorBox}>
            <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
            <Text style={m.errorTxt}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          style={[m.payBtn, (loading || !amountCents || amountCents < 100) && m.payBtnDisabled]}
          onPress={() => void (method === "stripe" ? handleStripeDeposit() : handleMobileMoneyDeposit())}
          disabled={loading || !amountCents || amountCents < 100}
        >
          {loading
            ? <ActivityIndicator color={colors.dark} size="small" />
            : method === "stripe"
              ? <><Ionicons name="card" size={20} color={colors.dark} /><Text style={m.payBtnTxt}>{t("wallet.deposit.payStripe")}</Text></>
              : <><Ionicons name="phone-portrait" size={20} color={colors.dark} /><Text style={m.payBtnTxt}>{t("wallet.deposit.payMobile")}</Text></>
          }
        </Pressable>

        <Text style={m.secureNote}>
          {method === "stripe" ? t("wallet.deposit.secureStripe") : t("wallet.deposit.secureMobile")}
        </Text>
      </View>
    </Modal>
  );
}

export function WalletScreen() {
  const { t } = useLang();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);

  const TYPE_LABELS: Record<string, string> = {
    CONTRIBUTION: t("wallet.txContrib"),
    WALLET_DEPOSIT: t("wallet.txDeposit"),
    WALLET_WITHDRAWAL: t("wallet.txWithdraw"),
    PAYOUT: t("wallet.txPayout"),
  };

  async function load() {
    try {
      const res = await apiCall<DashboardResponse>("get", "/api/user/dashboard");
      setData(res);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { void load(); }, []);

  const wallet = data?.user?.wallet;
  const balance = wallet?.balanceCents ?? 0;
  const currency = wallet?.currency ?? "EUR";
  const txs = data?.transactions ?? [];
  const deposited = txs.filter((tx) => tx.type === "WALLET_DEPOSIT" && tx.status === "PAID").reduce((s, tx) => s + tx.amountCents, 0);
  const paid = txs.filter((tx) => tx.type === "CONTRIBUTION" && tx.status === "PAID").reduce((s, tx) => s + tx.amountCents, 0);

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const content = (
    <SafeAreaView style={s.safe}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={colors.primary} />}
      >
        <View style={s.header}>
          <Text style={s.title}>{t("wallet.title")}</Text>
          <Text style={s.subtitle}>{t("wallet.subtitle")}</Text>
        </View>

        {/* Carte wallet */}
        <LinearGradient colors={["#1a2419" as const, "#243322" as const]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.card}>
          <View style={s.cardTop}>
            <View>
              <Text style={s.cardLabel}>{t("wallet.balanceLabel").toUpperCase()}</Text>
              <Text style={s.cardBal}>{fmt(balance, currency)}</Text>
              <Text style={s.cardSub}>{t("wallet.balanceSub")}</Text>
            </View>
            <View style={s.cardIcon}><Ionicons name="wallet" size={26} color={colors.gold} /></View>
          </View>
          <View style={s.cardStats}>
            <View style={s.stat}><Text style={s.statVal}>{fmt(deposited, currency)}</Text><Text style={s.statLbl}>{t("wallet.deposited")}</Text></View>
            <View style={s.div} />
            <View style={s.stat}><Text style={s.statVal}>{fmt(paid, currency)}</Text><Text style={s.statLbl}>{t("wallet.contributed")}</Text></View>
          </View>
        </LinearGradient>

        {/* Actions — Déposer est natif, Retirer ouvre web */}
        <View style={s.actions}>
          <Pressable style={s.actionBtn} onPress={() => setDepositOpen(true)}>
            <View style={[s.actionIcon, { backgroundColor: `${colors.primary}22` }]}>
              <Ionicons name="arrow-down-circle" size={28} color={colors.primary} />
            </View>
            <Text style={s.actionLbl}>{t("wallet.deposit")}</Text>
            <Text style={s.actionSub}>{t("wallet.depositSub")}</Text>
          </Pressable>

          <Pressable
            style={s.actionBtn}
            onPress={() => void WebBrowser.openBrowserAsync("https://tontineapp-web.vercel.app/wallet/withdraw", { toolbarColor: "#080b07" })}
          >
            <View style={[s.actionIcon, { backgroundColor: `${colors.gold}22` }]}>
              <Ionicons name="arrow-up-circle" size={28} color={colors.gold} />
            </View>
            <Text style={s.actionLbl}>{t("wallet.withdraw")}</Text>
            <Text style={s.actionSub}>{t("wallet.withdrawSub")}</Text>
          </Pressable>
        </View>

        {/* Avertissement si clé Stripe manquante */}
        {!STRIPE_PK && (
          <View style={s.warnBox}>
            <Ionicons name="warning" size={16} color={colors.warning} />
            <Text style={s.warnTxt}>{t("wallet.stripeWarning")}</Text>
          </View>
        )}

        {/* Historique */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>{t("wallet.recentTx")}</Text>
          {txs.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="receipt-outline" size={36} color={colors.textMuted} />
              <Text style={s.emptyTxt}>{t("wallet.noTx")}</Text>
            </View>
          ) : (
            txs.slice(0, 15).map((tx) => {
              const isIn = tx.type === "WALLET_DEPOSIT" || tx.type === "PAYOUT";
              const isPaid = tx.status === "PAID";
              const label = tx.tontineGroup?.name ?? TYPE_LABELS[tx.type] ?? tx.type;
              return (
                <View key={tx.id} style={s.txRow}>
                  <View style={[s.txIcon, { backgroundColor: isIn ? `${colors.primary}22` : `${colors.textMuted}22` }]}>
                    <Ionicons name={isIn ? "arrow-down" : "arrow-up"} size={18} color={isIn ? colors.primary : colors.textMuted} />
                  </View>
                  <View style={s.txInfo}>
                    <Text style={s.txLabel}>{label}</Text>
                    <Text style={s.txDate}>{fmtDate(tx.createdAt)} · {tx.provider}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[s.txAmt, { color: isIn && isPaid ? colors.primary : colors.text }]}>
                      {isIn ? "+" : "−"}{fmt(tx.amountCents, tx.currency)}
                    </Text>
                    <Text style={[s.txStatus, { color: isPaid ? colors.primary : tx.status === "FAILED" ? colors.danger : colors.warning }]}>
                      {tx.status}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>

      <DepositModal
        visible={depositOpen}
        onClose={() => setDepositOpen(false)}
        onSuccess={() => void load()}
        walletCurrency={currency}
      />
    </SafeAreaView>
  );

  return content;
}

// Styles modal dépôt
const m = StyleSheet.create({
  modal: { flex: 1, backgroundColor: colors.dark, paddingHorizontal: 20, paddingTop: 12 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: 16 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 22, color: colors.text, fontWeight: "900" },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center" },
  methodRow: { flexDirection: "column", gap: 8, marginBottom: 20 },
  methodBtn: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 12 },
  methodBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  methodBtnTxt: { flex: 1, color: colors.primary, fontWeight: "700", fontSize: 13 },
  methodBtnTxtActive: { color: colors.dark },
  label: { fontSize: 12, color: colors.textMuted, fontWeight: "700", marginBottom: 8 },
  presets: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  preset: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  presetActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  presetTxt: { color: colors.textMuted, fontWeight: "700", fontSize: 14 },
  presetTxtActive: { color: colors.dark },
  input: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 14, color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: 12 },
  summary: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: `${colors.primary}15`, borderRadius: 12, padding: 12, marginBottom: 12 },
  summaryTxt: { color: colors.primary, fontSize: 13, fontWeight: "700" },
  errorBox: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: `${colors.danger}15`, borderRadius: 12, padding: 12, marginBottom: 12 },
  errorTxt: { flex: 1, color: colors.danger, fontSize: 12, lineHeight: 18 },
  payBtn: { backgroundColor: colors.primary, borderRadius: 18, paddingVertical: 16, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, marginBottom: 12 },
  payBtnDisabled: { opacity: 0.4 },
  payBtnTxt: { color: colors.dark, fontSize: 16, fontWeight: "900" },
  secureNote: { textAlign: "center", color: colors.textMuted, fontSize: 11 },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.dark },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  title: { fontSize: 28, color: colors.text, fontWeight: "900" },
  subtitle: { fontSize: 13, color: colors.textMuted },
  card: { marginHorizontal: 20, marginVertical: 16, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  cardLabel: { fontSize: 10, color: `${colors.primary}99`, fontWeight: "800", letterSpacing: 2, marginBottom: 6 },
  cardBal: { fontSize: 32, color: colors.text, fontWeight: "900" },
  cardSub: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  cardIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: `${colors.gold}22`, justifyContent: "center", alignItems: "center" },
  cardStats: { flexDirection: "row", alignItems: "center" },
  stat: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 16, color: colors.text, fontWeight: "900" },
  statLbl: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  div: { width: 1, height: 28, backgroundColor: colors.border },
  actions: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 20, marginBottom: 24 },
  actionBtn: { alignItems: "center", gap: 6 },
  actionIcon: { width: 64, height: 64, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  actionLbl: { fontSize: 14, color: colors.text, fontWeight: "800" },
  actionSub: { fontSize: 11, color: colors.textMuted },
  warnBox: { flexDirection: "row", gap: 8, backgroundColor: `${colors.warning}15`, borderRadius: 12, padding: 12, marginHorizontal: 20, marginBottom: 16 },
  warnTxt: { flex: 1, color: colors.warning, fontSize: 12, lineHeight: 18 },
  section: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 16, color: colors.text, fontWeight: "900", marginBottom: 12 },
  empty: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyTxt: { color: colors.textMuted, fontSize: 14 },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  txIcon: { width: 42, height: 42, borderRadius: 13, justifyContent: "center", alignItems: "center" },
  txInfo: { flex: 1 },
  txLabel: { fontSize: 14, color: colors.text, fontWeight: "700" },
  txDate: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  txAmt: { fontSize: 14, fontWeight: "900" },
  txStatus: { fontSize: 10, fontWeight: "700", marginTop: 2 },
});
