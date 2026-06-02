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

const STRIPE_PK = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const APP_URL = process.env.EXPO_PUBLIC_APP_URL ?? "https://tontineapp-web.vercel.app";

type WalletData = { balanceCents: number; currency: string };
type Transaction = {
  id: string; type: string; status: string;
  amountCents: number; currency: string; provider: string | null;
  createdAt: string; tontineGroup?: { name: string } | null;
};
type DashboardResponse = {
  user: { wallet: WalletData | null };
  transactions: Transaction[];
};

const STRIPE_PRESETS = [
  { label: "10 €", cents: 1000 },
  { label: "25 €", cents: 2500 },
  { label: "50 €", cents: 5000 },
  { label: "100 €", cents: 10000 },
  { label: "200 €", cents: 20000 },
  { label: "500 €", cents: 50000 },
];

const MOBILE_PRESETS = [
  { label: "1 000 XOF", cents: 100000 },
  { label: "2 500 XOF", cents: 250000 },
  { label: "5 000 XOF", cents: 500000 },
  { label: "10 000 XOF", cents: 1000000 },
  { label: "25 000 XOF", cents: 2500000 },
  { label: "50 000 XOF", cents: 5000000 },
];

function fmt(cents: number, currency: string) {
  try {
    return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: currency || "XOF" });
  } catch {
    return `${(cents / 100).toLocaleString("fr-FR")} ${currency}`;
  }
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
  const [method, setMethod] = useState<DepositMethod>("mobile_money");
  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presets = method === "stripe" ? STRIPE_PRESETS : MOBILE_PRESETS;
  const minCents = method === "stripe" ? 100 : 30000;
  const amountCents = selected ?? (custom ? Math.round(parseFloat(custom.replace(",", ".")) * 100) : null);

  function reset() { setSelected(null); setCustom(""); setError(null); }

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
    if (!amountCents || amountCents < minCents) {
      setError("Montant minimum : 300 XOF");
      return;
    }
    setLoading(true); setError(null);
    try {
      const res = await apiCall<{ ok: boolean; paymentUrl?: string; error?: string }>(
        "post", "/api/wallet/deposit/cinetpay", { amountCents, currency: "XOF" }
      );
      if (!res.ok || !res.paymentUrl) {
        setError(res.error ?? t("common.unavailable"));
        setLoading(false);
        return;
      }
      const result = await WebBrowser.openBrowserAsync(res.paymentUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        toolbarColor: "#080b07",
      });
      setLoading(false);
      if (result.type === "opened" || result.type === "dismiss") {
        Alert.alert("Mobile Money", "Paiement en cours de vérification.", [
          { text: "Vérifier", onPress: () => { onClose(); reset(); onSuccess(); } },
          { text: "Fermer", style: "cancel" },
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
            { id: "mobile_money" as DepositMethod, label: "Mobile Money (Orange/MTN/Wave)", icon: "phone-portrait-outline" },
            { id: "stripe" as DepositMethod, label: t("wallet.deposit.stripe"), icon: "card-outline" },
          ] as { id: DepositMethod; label: string; icon: string }[]).map((opt) => (
            <Pressable
              key={opt.id}
              style={[m.methodBtn, method === opt.id && m.methodBtnActive]}
              onPress={() => { setMethod(opt.id); setSelected(null); setCustom(""); setError(null); }}
            >
              <Ionicons name={opt.icon as never} size={18} color={method === opt.id ? colors.dark : colors.primary} />
              <Text style={[m.methodBtnTxt, method === opt.id && m.methodBtnTxtActive]}>{opt.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Montant */}
        <Text style={m.label}>{t("wallet.deposit.amountLabel")}</Text>
        <View style={m.presets}>
          {presets.map((p) => (
            <Pressable key={p.cents} style={[m.preset, selected === p.cents && !custom && m.presetActive]}
              onPress={() => { setSelected(p.cents); setCustom(""); setError(null); }}>
              <Text style={[m.presetTxt, selected === p.cents && !custom && m.presetTxtActive]}>{p.label}</Text>
            </Pressable>
          ))}
        </View>

        {amountCents && amountCents >= minCents ? (
          <View style={m.summary}>
            <Ionicons name="flash" size={14} color={colors.primary} />
            <Text style={m.summaryTxt}>
              {method === "stripe" ? fmt(amountCents, "EUR") : `${(amountCents / 100).toLocaleString("fr-FR")} XOF`} · Crédit immédiat
            </Text>
          </View>
        ) : null}

        {error ? (
          <View style={m.errorBox}>
            <Ionicons name="alert-circle-outline" size={15} color={colors.danger} />
            <Text style={m.errorTxt}>{error}</Text>
          </View>
        ) : null}

        <Pressable
          style={[m.payBtn, (loading || !amountCents || amountCents < minCents) && m.payBtnDisabled]}
          onPress={() => void (method === "stripe" ? handleStripeDeposit() : handleMobileMoneyDeposit())}
          disabled={loading || !amountCents || amountCents < minCents}
        >
          {loading
            ? <ActivityIndicator color={colors.dark} size="small" />
            : method === "stripe"
              ? <><Ionicons name="card" size={20} color={colors.dark} /><Text style={m.payBtnTxt}>{t("wallet.deposit.payStripe")}</Text></>
              : <><Ionicons name="phone-portrait" size={20} color={colors.dark} /><Text style={m.payBtnTxt}>Payer via Mobile Money</Text></>
          }
        </Pressable>

        <Text style={m.secureNote}>
          {method === "stripe" ? t("wallet.deposit.secureStripe") : "Orange Money · MTN · Wave · Moov — CI, SN, BF, ML et plus"}
        </Text>
      </View>
    </Modal>
  );
}

function TxActions({ tx, onRefresh }: { tx: Transaction; onRefresh: () => void }) {
  const [loading, setLoading] = useState<"cancel" | "retry" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (tx.type !== "WALLET_DEPOSIT") return null;
  if (tx.status !== "PENDING" && tx.status !== "FAILED") return null;

  async function removeOrCancel() {
    setLoading("cancel");
    setErr(null);
    try {
      const endpoint = tx.status === "PENDING"
        ? `/api/transactions/${tx.id}/cancel`
        : `/api/transactions/${tx.id}/delete`;
      await apiCall("post", endpoint, {});
      onRefresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setLoading(null);
    }
  }

  async function retry() {
    setLoading("retry");
    const url = tx.provider === "CINETPAY"
      ? `${APP_URL}/wallet/deposit/cinetpay?amount=${tx.amountCents}`
      : `${APP_URL}/wallet/deposit`;
    const result = await WebBrowser.openBrowserAsync(url, { toolbarColor: "#080b07" });
    setLoading(null);
    if (result.type === "opened" || result.type === "dismiss") onRefresh();
  }

  return (
    <View style={a.row}>
      {tx.status === "PENDING" && (
        <Pressable style={[a.btn, a.btnGreen]} onPress={() => void retry()} disabled={loading !== null}>
          {loading === "retry"
            ? <ActivityIndicator size={10} color={colors.primary} />
            : <Ionicons name="play" size={10} color={colors.primary} />}
          <Text style={[a.txt, { color: colors.primary }]}>Continuer</Text>
        </Pressable>
      )}
      {tx.status === "FAILED" && (
        <Pressable style={[a.btn, a.btnGray]} onPress={() => void retry()} disabled={loading !== null}>
          {loading === "retry"
            ? <ActivityIndicator size={10} color={colors.textMuted} />
            : <Ionicons name="refresh" size={10} color={colors.textMuted} />}
          <Text style={[a.txt, { color: colors.textMuted }]}>Réessayer</Text>
        </Pressable>
      )}
      {tx.status === "PENDING" && (
        <Pressable style={[a.btn, a.btnRed]} onPress={() => void removeOrCancel()} disabled={loading !== null}>
          {loading === "cancel"
            ? <ActivityIndicator size={10} color={colors.danger} />
            : <Ionicons name="trash-outline" size={10} color={colors.danger} />}
          <Text style={[a.txt, { color: colors.danger }]}>{tx.status === "PENDING" ? "Annuler" : "Supprimer"}</Text>
        </Pressable>
      )}
      {err && <Text style={{ fontSize: 10, color: colors.danger, marginTop: 4 }}>{err}</Text>}
    </View>
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
  const currency = wallet?.currency ?? "XOF";
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

  return (
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

        {/* Actions */}
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
            onPress={() => void WebBrowser.openBrowserAsync(`${APP_URL}/wallet/withdraw`, { toolbarColor: "#080b07" })}
          >
            <View style={[s.actionIcon, { backgroundColor: `${colors.gold}22` }]}>
              <Ionicons name="arrow-up-circle" size={28} color={colors.gold} />
            </View>
            <Text style={s.actionLbl}>{t("wallet.withdraw")}</Text>
            <Text style={s.actionSub}>{t("wallet.withdrawSub")}</Text>
          </Pressable>
        </View>

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
                <View key={tx.id} style={s.txBlock}>
                  <View style={s.txRow}>
                    <View style={[s.txIcon, { backgroundColor: isIn ? `${colors.primary}22` : `${colors.textMuted}22` }]}>
                      <Ionicons name={isIn ? "arrow-down" : "arrow-up"} size={18} color={isIn ? colors.primary : colors.textMuted} />
                    </View>
                    <View style={s.txInfo}>
                      <Text style={s.txLabel}>{label}</Text>
                      <Text style={s.txDate}>{fmtDate(tx.createdAt)} · {tx.provider ?? "—"}</Text>
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
                  <TxActions tx={tx} onRefresh={() => void load()} />
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
}

const a = StyleSheet.create({
  row: { flexDirection: "row", gap: 6, paddingLeft: 54, marginTop: 4, marginBottom: 6 },
  btn: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  btnGreen: { backgroundColor: `${colors.primary}18` },
  btnGray: { backgroundColor: `${colors.textMuted}18` },
  btnRed: { backgroundColor: `${colors.danger}18` },
  txt: { fontSize: 10, fontWeight: "700" },
});

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
  preset: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  presetActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  presetTxt: { color: colors.textMuted, fontWeight: "700", fontSize: 13 },
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
  txBlock: { marginBottom: 14 },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  txIcon: { width: 42, height: 42, borderRadius: 13, justifyContent: "center", alignItems: "center" },
  txInfo: { flex: 1 },
  txLabel: { fontSize: 14, color: colors.text, fontWeight: "700" },
  txDate: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  txAmt: { fontSize: 14, fontWeight: "900" },
  txStatus: { fontSize: 10, fontWeight: "700", marginTop: 2 },
});
