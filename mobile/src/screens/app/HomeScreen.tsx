import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuthStore } from "../../store/authStore";
import { useTontineStore } from "../../store/tontineStore";
import { colors } from "../../theme/colors";
import type { HomeScreenProps } from "../../types/navigation";

export function HomeScreen({ navigation }: HomeScreenProps) {
  const [refreshing, setRefreshing] = useState(false);
  const user = useAuthStore((s) => s.user);
  const tontines = useTontineStore((s) => s.tontines);
  const fetchMyTontines = useTontineStore((s) => s.fetchMyTontines);

  useFocusEffect(useCallback(() => { void fetchMyTontines(); }, [fetchMyTontines]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMyTontines();
    setRefreshing(false);
  }, [fetchMyTontines]);

  const totalSaved = tontines.reduce((s, t) => s + t.contributionAmount * (t.progression?.paidMembers ?? 0), 0);
  const activeGroups = tontines.filter((t) => t.status === "active").length;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Bonjour,</Text>
            <Text style={s.name}>{user?.fullName?.split(" ")[0] ?? "—"}</Text>
          </View>
          <Pressable style={s.notifBtn} onPress={() => navigation.navigate("Notifications" as never)}>
            <Ionicons name="notifications-outline" size={22} color={colors.text} />
          </Pressable>
        </View>

        {/* Wallet card premium */}
        <LinearGradient colors={["#1a2419", "#243322"] as [string, string]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.card}>
          <View style={s.cardTop}>
            <View>
              <Text style={s.cardLabel}>KOTIZY BLACK</Text>
              <Text style={s.cardBalance}>
                {totalSaved.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
              </Text>
              <Text style={s.cardSub}>Épargne collective</Text>
            </View>
            <View style={s.cardIcon}>
              <Ionicons name="wallet" size={24} color={colors.gold} />
            </View>
          </View>
          <View style={s.cardStats}>
            <View style={s.stat}><Text style={s.statVal}>{activeGroups}</Text><Text style={s.statLbl}>Actifs</Text></View>
            <View style={s.divider} />
            <View style={s.stat}><Text style={s.statVal}>{tontines.length}</Text><Text style={s.statLbl}>Total</Text></View>
          </View>
        </LinearGradient>

        {/* Actions rapides */}
        <View style={s.actions}>
          {[
            { icon: "add-circle-outline" as const, label: "Créer", screen: "CreateTontine" },
            { icon: "enter-outline" as const, label: "Rejoindre", screen: "JoinTontine" },
            { icon: "wallet-outline" as const, label: "Wallet", screen: "Wallet" },
            { icon: "person-outline" as const, label: "Profil", screen: "Profile" },
          ].map((a) => (
            <Pressable key={a.label} style={s.actionBtn} onPress={() => navigation.navigate(a.screen as never)}>
              <View style={s.actionIcon}>
                <Ionicons name={a.icon} size={20} color={colors.primary} />
              </View>
              <Text style={s.actionLbl}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Mes tontines */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Mes tontines</Text>
          {tontines.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="people-outline" size={40} color={colors.textMuted} />
              <Text style={s.emptyText}>Aucune tontine. Créez ou rejoignez un groupe.</Text>
              <Pressable style={s.emptyBtn} onPress={() => navigation.navigate("CreateTontine" as never)}>
                <Text style={s.emptyBtnText}>Créer un groupe</Text>
              </Pressable>
            </View>
          ) : (
            tontines.map((t) => {
              const pct = t.progression
                ? (t.progression.paidMembers / Math.max(t.progression.totalMembers, 1)) * 100
                : 0;
              return (
                <Pressable
                  key={t.id}
                  style={s.tCard}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onPress={() => (navigation as any).navigate("TontineDetail", { tontineId: t.id })}
                >
                  <View style={s.tCardTop}>
                    <View style={s.tAvatar}>
                      <Text style={s.tAvatarTxt}>{t.name[0]?.toUpperCase()}</Text>
                    </View>
                    <View style={s.tInfo}>
                      <Text style={s.tName}>{t.name}</Text>
                      <Text style={s.tSub}>
                        {t.contributionAmount.toLocaleString("fr-FR", { style: "currency", currency: t.currency })}
                        {" · "}{t.membersCount} membres
                      </Text>
                    </View>
                    <View style={[s.badge, t.status === "active" ? s.badgeActive : s.badgeOther]}>
                      <Text style={[s.badgeTxt, t.status === "active" ? s.badgeTxtActive : s.badgeTxtOther]}>
                        {t.status === "active" ? "Actif" : t.status === "completed" ? "Terminé" : "Attente"}
                      </Text>
                    </View>
                  </View>
                  <View style={s.pb}><View style={[s.pbFill, { width: `${Math.min(pct, 100)}%` }]} /></View>
                  <Text style={s.pbTxt}>
                    {t.progression?.paidMembers ?? 0}/{t.progression?.totalMembers ?? t.membersCount} · Round {t.currentRound}/{t.totalRounds}
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  greeting: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
  name: { fontSize: 26, color: colors.text, fontWeight: "900", marginTop: 2 },
  notifBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: colors.border },

  card: { marginHorizontal: 20, marginVertical: 12, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  cardLabel: { fontSize: 10, color: `${colors.primary}99`, fontWeight: "800", letterSpacing: 2, marginBottom: 6 },
  cardBalance: { fontSize: 32, color: colors.text, fontWeight: "900" },
  cardSub: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  cardIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: `${colors.gold}22`, justifyContent: "center", alignItems: "center" },
  cardStats: { flexDirection: "row", alignItems: "center" },
  stat: { flex: 1, alignItems: "center" },
  statVal: { fontSize: 20, color: colors.text, fontWeight: "900" },
  statLbl: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  divider: { width: 1, height: 32, backgroundColor: colors.border },

  actions: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 24 },
  actionBtn: { alignItems: "center", gap: 6 },
  actionIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: colors.border },
  actionLbl: { fontSize: 11, color: colors.textMuted, fontWeight: "700" },

  section: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 16, color: colors.text, fontWeight: "900", marginBottom: 12 },
  empty: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, color: colors.textMuted, textAlign: "center" },
  emptyBtn: { backgroundColor: colors.primary, borderRadius: 16, paddingHorizontal: 24, paddingVertical: 12, marginTop: 4 },
  emptyBtnText: { color: colors.dark, fontWeight: "900", fontSize: 14 },

  tCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  tCardTop: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 12 },
  tAvatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: `${colors.primary}22`, justifyContent: "center", alignItems: "center" },
  tAvatarTxt: { color: colors.primary, fontWeight: "900", fontSize: 18 },
  tInfo: { flex: 1 },
  tName: { color: colors.text, fontWeight: "900", fontSize: 15 },
  tSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  badgeActive: { backgroundColor: `${colors.primary}22` },
  badgeOther: { backgroundColor: colors.surfaceCard },
  badgeTxt: { fontSize: 11, fontWeight: "700" },
  badgeTxtActive: { color: colors.primary },
  badgeTxtOther: { color: colors.textMuted },
  pb: { height: 4, backgroundColor: colors.surfaceCard, borderRadius: 4, overflow: "hidden", marginBottom: 8 },
  pbFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 4 },
  pbTxt: { fontSize: 11, color: colors.textMuted },
});
