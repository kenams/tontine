import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { apiCall } from "../../services/api";
import { colors } from "../../theme/colors";

type WalletData = {
  balanceCents: number;
  currency: string;
};

type Transaction = {
  id: string;
  type: string;
  status: string;
  amountCents: number;
  currency: string;
  provider: string;
  createdAt: string;
  tontineGroup?: { name: string } | null;
};

type DashboardResponse = {
  user: { wallet: WalletData | null };
  transactions: Transaction[];
};

const TYPE_LABELS: Record<string, string> = {
  CONTRIBUTION: "Cotisation",
  WALLET_DEPOSIT: "Dépôt wallet",
  WALLET_WITHDRAWAL: "Retrait wallet",
  PAYOUT: "Payout reçu",
};

function fmtMoney(cents: number, currency: string) {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: currency || "EUR" });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function WalletScreen() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
  const deposits = txs.filter((t) => t.type === "WALLET_DEPOSIT" && t.status === "PAID");
  const paid = txs.filter((t) => t.type === "CONTRIBUTION" && t.status === "PAID").reduce((s, t) => s + t.amountCents, 0);

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
          <Text style={s.title}>Wallet</Text>
          <Text style={s.subtitle}>Gérez vos fonds Kotizy</Text>
        </View>

        {/* Carte wallet */}
        <LinearGradient colors={["#1a2419" as const, "#243322" as const]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.card}>
          <View style={s.cardTop}>
            <View>
              <Text style={s.cardLabel}>KOTIZY BLACK</Text>
              <Text style={s.cardBal}>{fmtMoney(balance, currency)}</Text>
              <Text style={s.cardSub}>Solde disponible</Text>
            </View>
            <View style={s.cardIcon}>
              <Ionicons name="wallet" size={26} color={colors.gold} />
            </View>
          </View>
          <View style={s.cardStats}>
            <View style={s.stat}><Text style={s.statVal}>{fmtMoney(paid, currency)}</Text><Text style={s.statLbl}>Cotisé</Text></View>
            <View style={s.div} />
            <View style={s.stat}><Text style={s.statVal}>{deposits.length}</Text><Text style={s.statLbl}>Dépôts</Text></View>
          </View>
        </LinearGradient>

        {/* Actions */}
        <View style={s.actions}>
          <Pressable style={s.actionBtn} onPress={() => Linking.openURL("https://tontineapp-web.vercel.app/wallet/deposit")}>
            <View style={[s.actionIcon, { backgroundColor: `${colors.primary}22` }]}>
              <Ionicons name="arrow-down-circle" size={26} color={colors.primary} />
            </View>
            <Text style={s.actionLbl}>Déposer</Text>
            <Text style={s.actionSub}>Stripe</Text>
          </Pressable>
          <Pressable style={s.actionBtn} onPress={() => Linking.openURL("https://tontineapp-web.vercel.app/wallet/withdraw")}>
            <View style={[s.actionIcon, { backgroundColor: `${colors.gold}22` }]}>
              <Ionicons name="arrow-up-circle" size={26} color={colors.gold} />
            </View>
            <Text style={s.actionLbl}>Retirer</Text>
            <Text style={s.actionSub}>SEPA</Text>
          </Pressable>
          <Pressable style={s.actionBtn} onPress={() => Linking.openURL("https://tontineapp-web.vercel.app/transactions")}>
            <View style={[s.actionIcon, { backgroundColor: `${colors.textMuted}22` }]}>
              <Ionicons name="list" size={26} color={colors.textMuted} />
            </View>
            <Text style={s.actionLbl}>Historique</Text>
            <Text style={s.actionSub}>Complet</Text>
          </Pressable>
        </View>

        {/* Transactions récentes */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Transactions récentes</Text>
          {txs.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="receipt-outline" size={36} color={colors.textMuted} />
              <Text style={s.emptyTxt}>Aucune transaction. Rejoignez une tontine.</Text>
            </View>
          ) : (
            txs.slice(0, 15).map((tx) => {
              const isDeposit = tx.type === "WALLET_DEPOSIT";
              const isPayout = tx.type === "PAYOUT";
              const isContrib = tx.type === "CONTRIBUTION";
              const isPaid = tx.status === "PAID";
              const label = tx.tontineGroup?.name ?? TYPE_LABELS[tx.type] ?? tx.type;
              const sign = isDeposit || isPayout ? "+" : "−";
              const amtColor = (isDeposit || isPayout) && isPaid ? colors.primary : colors.text;

              return (
                <View key={tx.id} style={s.txRow}>
                  <View style={[s.txIcon, { backgroundColor: isDeposit ? `${colors.primary}22` : isPayout ? `${colors.gold}22` : `${colors.textMuted}22` }]}>
                    <Ionicons
                      name={isDeposit ? "arrow-down" : isPayout ? "gift" : isContrib ? "people" : "arrow-up"}
                      size={18}
                      color={isDeposit ? colors.primary : isPayout ? colors.gold : colors.textMuted}
                    />
                  </View>
                  <View style={s.txInfo}>
                    <Text style={s.txLabel}>{label}</Text>
                    <Text style={s.txDate}>{fmtDate(tx.createdAt)} · {tx.provider}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[s.txAmt, { color: amtColor }]}>{sign}{fmtMoney(tx.amountCents, tx.currency)}</Text>
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
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.dark },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  title: { fontSize: 28, color: colors.text, fontWeight: "900" },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: 2 },

  card: { marginHorizontal: 20, marginVertical: 16, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  cardLabel: { fontSize: 10, color: `${colors.primary}99`, fontWeight: "800", letterSpacing: 2, marginBottom: 6 },
  cardBal: { fontSize: 32, color: colors.text, fontWeight: "900" },
  cardSub: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  cardIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: `${colors.gold}22`, justifyContent: "center", alignItems: "center" },
  cardStats: { flexDirection: "row", alignItems: "center" },
  stat: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 18, color: colors.text, fontWeight: "900" },
  statLbl: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  div: { width: 1, height: 28, backgroundColor: colors.border },

  actions: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 20, marginBottom: 24 },
  actionBtn: { alignItems: "center", gap: 6 },
  actionIcon: { width: 60, height: 60, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  actionLbl: { fontSize: 13, color: colors.text, fontWeight: "800" },
  actionSub: { fontSize: 11, color: colors.textMuted },

  section: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 16, color: colors.text, fontWeight: "900", marginBottom: 12 },
  empty: { alignItems: "center", paddingVertical: 32, gap: 8 },
  emptyTxt: { fontSize: 14, color: colors.textMuted, textAlign: "center" },

  txRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  txIcon: { width: 42, height: 42, borderRadius: 13, justifyContent: "center", alignItems: "center" },
  txInfo: { flex: 1 },
  txLabel: { fontSize: 14, color: colors.text, fontWeight: "700" },
  txDate: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  txAmt: { fontSize: 14, fontWeight: "900" },
  txStatus: { fontSize: 10, fontWeight: "700", marginTop: 2 },
});
