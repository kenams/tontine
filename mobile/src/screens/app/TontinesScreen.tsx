import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, SafeAreaView, StyleSheet, Text, View } from "react-native";

import { useTontineStore } from "../../store/tontineStore";
import { colors } from "../../theme/colors";
import { useLang } from "../../i18n/useLang";
import type { TontinesScreenProps } from "../../types/navigation";

function fmt(amount: number, currency: string) {
  return amount.toLocaleString("fr-FR", { style: "currency", currency: currency || "EUR" });
}

export function TontinesScreen({ navigation }: TontinesScreenProps) {
  const tontines = useTontineStore((s) => s.tontines);
  const fetchMyTontines = useTontineStore((s) => s.fetchMyTontines);
  const isLoading = useTontineStore((s) => s.isLoading);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useLang();

  useFocusEffect(useCallback(() => { void fetchMyTontines(); }, [fetchMyTontines]));

  function statusLabel(st: string) {
    if (st === "active") return { label: t("tontines.statusActive"), color: colors.primary };
    if (st === "completed") return { label: t("tontines.statusDone"), color: colors.textMuted };
    return { label: t("tontines.statusPending"), color: colors.warning };
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchMyTontines();
    setRefreshing(false);
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>{t("tontines.title")}</Text>
          <Text style={s.sub}>{tontines.length} tontine{tontines.length !== 1 ? "s" : ""}</Text>
        </View>
        <View style={s.headerBtns}>
          <Pressable style={s.iconBtn} onPress={() => navigation.navigate("JoinTontine")}>
            <Ionicons name="enter-outline" size={20} color={colors.primary} />
          </Pressable>
          <Pressable style={[s.iconBtn, s.primaryBtn]} onPress={() => navigation.navigate("CreateTontine")}>
            <Ionicons name="add" size={20} color={colors.dark} />
          </Pressable>
        </View>
      </View>

      {isLoading && tontines.length === 0 ? (
        <View style={s.center}><ActivityIndicator color={colors.primary} size="large" /></View>
      ) : (
        <FlatList
          data={tontines}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} tintColor={colors.primary} />}
          renderItem={({ item }) => {
            const { label, color } = statusLabel(item.status);
            const pct = item.progression
              ? Math.min(100, Math.round((item.progression.paidMembers / Math.max(item.progression.totalMembers, 1)) * 100))
              : 0;
            return (
              <Pressable style={s.card} onPress={() => navigation.navigate("TontineDetail", { tontineId: item.id })}>
                <View style={s.cardTop}>
                  <View style={s.avatar}>
                    <Text style={s.avatarTxt}>{item.name[0]?.toUpperCase()}</Text>
                  </View>
                  <View style={s.info}>
                    <Text style={s.name} numberOfLines={1}>{item.name}</Text>
                    <Text style={s.meta}>
                      {fmt(item.contributionAmount, item.currency)} · {item.membersCount}/{item.maxMembers} {t("tontines.members")}
                    </Text>
                  </View>
                  <View style={[s.badge, { backgroundColor: `${color}20` }]}>
                    <Text style={[s.badgeTxt, { color }]}>{label}</Text>
                  </View>
                </View>
                <View style={s.progressTrack}>
                  <View style={[s.progressFill, { width: `${pct}%` as `${number}%` }]} />
                </View>
                <View style={s.cardBottom}>
                  <Text style={s.cardSub}>{t("tontines.round")} {item.currentRound}/{item.totalRounds}</Text>
                  <Text style={s.cardSub}>{pct}% {t("tontines.funded")}</Text>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="people-outline" size={48} color={colors.textMuted} />
              <Text style={s.emptyTitle}>{t("tontines.empty.title")}</Text>
              <Text style={s.emptyText}>{t("tontines.empty.body")}</Text>
              <Pressable style={s.emptyBtn} onPress={() => navigation.navigate("CreateTontine")}>
                <Text style={s.emptyBtnTxt}>{t("tontines.createGroup")}</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.dark },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 28, color: colors.text, fontWeight: "900" },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  headerBtns: { flexDirection: "row", gap: 10 },
  iconBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: colors.border },
  primaryBtn: { backgroundColor: colors.primary, borderColor: colors.primary },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { paddingHorizontal: 20, paddingBottom: 100, gap: 12 },
  card: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 10 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: `${colors.primary}22`, justifyContent: "center", alignItems: "center" },
  avatarTxt: { color: colors.primary, fontWeight: "900", fontSize: 18 },
  info: { flex: 1 },
  name: { color: colors.text, fontWeight: "900", fontSize: 15 },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTxt: { fontSize: 11, fontWeight: "700" },
  progressTrack: { height: 4, backgroundColor: colors.surfaceCard, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 2 },
  cardBottom: { flexDirection: "row", justifyContent: "space-between" },
  cardSub: { fontSize: 11, color: colors.textMuted },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 20, color: colors.text, fontWeight: "900" },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: "center" },
  emptyBtn: { backgroundColor: colors.primary, borderRadius: 16, paddingHorizontal: 24, paddingVertical: 12, marginTop: 8 },
  emptyBtnTxt: { color: colors.dark, fontWeight: "900", fontSize: 14 },
});
