import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthStore } from "../../store/authStore";
import { useTontineStore } from "../../store/tontineStore";
import { colors } from "../../theme/colors";
import { useLang } from "../../i18n/useLang";
import type { HomeScreenProps } from "../../types/navigation";

export function HomeScreen({ navigation }: HomeScreenProps) {
  const [refreshing, setRefreshing] = useState(false);
  const user = useAuthStore((s) => s.user);
  const tontines = useTontineStore((s) => s.tontines);
  const fetchMyTontines = useTontineStore((s) => s.fetchMyTontines);
  const { t } = useLang();

  useFocusEffect(useCallback(() => { void fetchMyTontines(); }, [fetchMyTontines]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMyTontines();
    setRefreshing(false);
  }, [fetchMyTontines]);

  const totalSaved = tontines.reduce((s, t) => s + t.contributionAmount * (t.progression?.paidMembers ?? 0), 0);
  const activeGroups = tontines.filter((t) => t.status === "active").length;

  function statusLabel(status: string) {
    if (status === "active") return t("home.statusActive");
    if (status === "completed") return t("home.statusDone");
    return t("home.statusPending");
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>{t("home.greeting")}</Text>
            <Text style={s.name}>{user?.fullName?.split(" ")[0] ?? "—"}</Text>
          </View>
          <Pressable style={s.notifBtn} onPress={() => navigation.navigate("Notifications")}>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
          </Pressable>
        </View>

        <LinearGradient colors={["#1a2419", "#243322"] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.card}>
          <View style={s.cardTop}>
            <View>
              <Text style={s.cardLabel}>{t("home.cardLabel").toUpperCase()}</Text>
              <Text style={s.cardBalance}>
                {totalSaved.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
              </Text>
              <Text style={s.cardSub}>{t("home.cardSub")}</Text>
            </View>
            <View style={s.cardIcon}>
              <Ionicons name="wallet" size={24} color={colors.gold} />
            </View>
          </View>
          <View style={s.cardStats}>
            <View style={s.stat}><Text style={s.statVal}>{activeGroups}</Text><Text style={s.statLbl}>{t("home.statActive")}</Text></View>
            <View style={s.divider} />
            <View style={s.stat}><Text style={s.statVal}>{tontines.length}</Text><Text style={s.statLbl}>{t("home.statTotal")}</Text></View>
          </View>
        </LinearGradient>

        <View style={s.actions}>
          {[
            { icon: "add-circle-outline" as const, label: t("home.action.create"),    screen: "CreateTontine" },
            { icon: "enter-outline" as const,      label: t("home.action.join"),      screen: "JoinTontine" },
            { icon: "wallet-outline" as const,     label: t("home.action.wallet"),    screen: "WalletStack" },
            { icon: "person-outline" as const,     label: t("home.action.profile"),   screen: "Profile" },
          ].map((a) => (
            <Pressable key={a.label} style={s.actionBtn} onPress={() => (navigation as any).navigate(a.screen)}>
              <View style={s.actionIcon}>
                <Ionicons name={a.icon} size={20} color={colors.primary} />
              </View>
              <Text style={s.actionLbl}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>{t("home.myTontines")}</Text>
          {tontines.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="people-outline" size={40} color={colors.textMuted} />
              <Text style={s.emptyText}>{t("home.noTontine")}</Text>
              <Pressable style={s.emptyBtn} onPress={() => navigation.navigate("CreateTontine")}>
                <Text style={s.emptyBtnText}>{t("home.createGroup")}</Text>
              </Pressable>
            </View>
          ) : (
            tontines.map((tontine) => {
              const pct = tontine.progression
                ? (tontine.progression.paidMembers / Math.max(tontine.progression.totalMembers, 1)) * 100
                : 0;
              return (
                <Pressable
                  key={tontine.id}
                  style={s.tCard}
                  onPress={() => (navigation as any).navigate("TontineDetail", { tontineId: tontine.id })}
                >
                  <View style={s.tCardTop}>
                    <View style={s.tAvatar}>
                      <Text style={s.tAvatarTxt}>{tontine.name[0]?.toUpperCase()}</Text>
                    </View>
                    <View style={s.tInfo}>
                      <Text style={s.tName}>{tontine.name}</Text>
                      <Text style={s.tSub}>
                        {tontine.contributionAmount.toLocaleString("fr-FR", { style: "currency", currency: tontine.currency })}
                        {" · "}{tontine.membersCount} {t("home.members")}
                      </Text>
                    </View>
                    <View style={[s.badge, tontine.status === "active" ? s.badgeActive : s.badgeOther]}>
                      <Text style={[s.badgeTxt, tontine.status === "active" ? s.badgeTxtActive : s.badgeTxtOther]}>
                        {statusLabel(tontine.status)}
                      </Text>
                    </View>
                  </View>
                  <View style={s.pb}><View style={[s.pbFill, { width: `${Math.min(pct, 100)}%` }]} /></View>
                  <Text style={s.pbTxt}>
                    {tontine.progression?.paidMembers ?? 0}/{tontine.progression?.totalMembers ?? tontine.membersCount} · {t("home.round")} {tontine.currentRound}/{tontine.totalRounds}
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.dark },
  scroll: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  greeting: { fontSize: 13, color: colors.textMuted, fontWeight: "600", letterSpacing: 0.5 },
  name: { fontSize: 28, color: colors.text, fontWeight: "900", marginTop: 2, letterSpacing: -0.5 },
  notifBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: colors.border },
  card: { marginHorizontal: 20, marginVertical: 16, borderRadius: 28, padding: 22, borderWidth: 1, borderColor: colors.border },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  cardLabel: { fontSize: 10, color: `${colors.primary}99`, fontWeight: "800", letterSpacing: 2.5, marginBottom: 8, textTransform: "uppercase" },
  cardBalance: { fontSize: 34, color: colors.text, fontWeight: "900", letterSpacing: -1 },
  cardSub: { fontSize: 12, color: colors.textMuted, marginTop: 6 },
  cardIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: `${colors.gold}20`, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: `${colors.gold}30` },
  cardStats: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  stat: { flex: 1, alignItems: "center", paddingVertical: 4 },
  statVal: { fontSize: 22, color: colors.text, fontWeight: "900" },
  statLbl: { fontSize: 11, color: colors.textMuted, marginTop: 3, fontWeight: "600" },
  divider: { width: 1, height: 36, backgroundColor: colors.border },
  actions: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 24, marginBottom: 28 },
  actionBtn: { alignItems: "center", gap: 8 },
  actionIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: colors.border },
  actionLbl: { fontSize: 11, color: colors.textMuted, fontWeight: "700", letterSpacing: 0.3 },
  section: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 17, color: colors.text, fontWeight: "900", marginBottom: 14, letterSpacing: -0.3 },
  empty: { alignItems: "center", paddingVertical: 48, gap: 14 },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: "center", lineHeight: 22 },
  emptyBtn: { backgroundColor: colors.primary, borderRadius: 18, paddingHorizontal: 28, paddingVertical: 14, marginTop: 4 },
  emptyBtnText: { color: colors.dark, fontWeight: "900", fontSize: 15 },
  tCard: { backgroundColor: colors.surface, borderRadius: 22, padding: 18, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  tCardTop: { flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 14 },
  tAvatar: { width: 46, height: 46, borderRadius: 15, backgroundColor: `${colors.primary}20`, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: `${colors.primary}30` },
  tAvatarTxt: { color: colors.primary, fontWeight: "900", fontSize: 18 },
  tInfo: { flex: 1 },
  tName: { color: colors.text, fontWeight: "900", fontSize: 15, letterSpacing: -0.2 },
  tSub: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  badgeActive: { backgroundColor: `${colors.primary}20` },
  badgeOther: { backgroundColor: colors.surfaceCard },
  badgeTxt: { fontSize: 11, fontWeight: "700" },
  badgeTxtActive: { color: colors.primary },
  badgeTxtOther: { color: colors.textMuted },
  pb: { height: 5, backgroundColor: `${colors.primary}20`, borderRadius: 5, overflow: "hidden", marginBottom: 8 },
  pbFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 5 },
  pbTxt: { fontSize: 11, color: colors.textMuted },
});
