import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { apiCall } from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import { useTontineStore } from "../../store/tontineStore";
import { colors } from "../../theme/colors";
import { useLang } from "../../i18n/useLang";
import type { Lang } from "../../i18n/translations";
import type { ProfileScreenProps } from "../../types/navigation";

type DashboardData = {
  user: {
    trustScore?: { score: number; paymentReliability: number; fraudRisk: number } | null;
    wallet?: { balanceCents: number; currency: string } | null;
  };
};

function getTrustLevel(score: number, t: (k: string) => string) {
  if (score >= 95) return { label: t("trust.elite"), color: colors.gold };
  if (score >= 85) return { label: t("trust.gold"), color: colors.gold };
  if (score >= 70) return { label: t("trust.advanced"), color: colors.primary };
  if (score >= 50) return { label: t("trust.intermediate"), color: colors.textMuted };
  if (score >= 30) return { label: t("trust.bronze"), color: colors.warning };
  return { label: t("trust.beginner"), color: colors.textMuted };
}

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { t, lang, setLang } = useLang();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const tontines = useTontineStore((s) => s.tontines);

  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiCall<DashboardData>("get", "/api/user/dashboard").then(setDashData).catch(() => {});
  }, []);

  const trust = dashData?.user?.trustScore?.score ?? 0;
  const level = getTrustLevel(trust, t);
  const wallet = dashData?.user?.wallet;
  const [kycStatus, setKycStatus] = useState<string>("NONE");
  const [kycLoading, setKycLoading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("push_enabled").then((v) => setPushEnabled(v === "1"));
  }, []);

  async function registerPushToken() {
    if (!Device.isDevice) return null;
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") return null;
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Kotizy",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: "5e1b5c7a-7b38-4f86-97ff-2e23614f0f95",
    });
    return token.data;
  }

  async function togglePush(val: boolean) {
    setPushLoading(true);
    try {
      if (val) {
        const token = await registerPushToken();
        if (!token) {
          Alert.alert(t("profile.notifications"), t("profile.push.denied"));
          setPushLoading(false);
          return;
        }
        await apiCall("post", "/api/push/expo", { token });
        setPushEnabled(true);
        await AsyncStorage.setItem("push_enabled", "1");
      } else {
        await apiCall("delete", "/api/push").catch(() => {});
        setPushEnabled(false);
        await AsyncStorage.setItem("push_enabled", "0");
      }
    } catch {
      Alert.alert(t("common.error"), t("profile.push.err"));
    }
    setPushLoading(false);
  }

  useEffect(() => {
    apiCall<{ kycStatus: string }>("get", "/api/kyc/status").then((r) => setKycStatus(r.kycStatus)).catch(() => {});
  }, []);

  async function startKyc() {
    setKycLoading(true);
    try {
      const res = await apiCall<{ url?: string; alreadyVerified?: boolean }>("post", "/api/kyc/create-session");
      if (res.alreadyVerified) { setKycStatus("VERIFIED"); return; }
      if (res.url) {
        await WebBrowser.openBrowserAsync(res.url);
        const refreshed = await apiCall<{ kycStatus: string }>("get", "/api/kyc/status");
        setKycStatus(refreshed.kycStatus);
      }
    } catch (err) {
      Alert.alert(t("common.error"), err instanceof Error ? err.message : "Vérification impossible.");
    }
    setKycLoading(false);
  }

  function kycBadge() {
    if (kycStatus === "VERIFIED") return { label: t("profile.kyc.verified"), color: "#22c55e", bg: "rgba(34,197,94,0.12)" };
    if (kycStatus === "PENDING")  return { label: t("profile.kyc.pending"), color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
    if (kycStatus === "REJECTED") return { label: t("profile.kyc.rejected"), color: "#ef4444", bg: "rgba(239,68,68,0.12)" };
    return { label: t("profile.kyc.none"), color: "#6b7a69", bg: "rgba(107,122,105,0.12)" };
  }

  async function saveProfile() {
    if (!fullName.trim()) return;
    setSaving(true);
    try {
      await apiCall("patch", "/api/user/profile", { fullName: fullName.trim(), phone: phone.trim() });
      setEditing(false);
    } catch (err) {
      Alert.alert(t("common.error"), err instanceof Error ? err.message : t("profile.save.err"));
    }
    setSaving(false);
  }

  function confirmLogout() {
    Alert.alert(t("profile.logout.title"), t("profile.logout.msg"), [
      { text: t("profile.logout.cancel"), style: "cancel" },
      { text: t("profile.logout.confirm"), style: "destructive", onPress: () => void logout() },
    ]);
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Text style={s.title}>{t("profile.title")}</Text>
        </View>

        {/* Avatar + identité */}
        <View style={s.avatarCard}>
          <View style={s.avatar}>
            <Text style={s.avatarTxt}>{initials(user?.fullName ?? "KO")}</Text>
          </View>
          <Text style={s.name}>{user?.fullName}</Text>
          <Text style={s.email}>{user?.email}</Text>
          <View style={[s.levelBadge, { backgroundColor: `${level.color}22` }]}>
            <Text style={[s.levelTxt, { color: level.color }]}>{level.label}</Text>
          </View>
        </View>

        {/* Trust score */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <Ionicons name="shield-checkmark" size={18} color={colors.primary} />
            <Text style={s.cardTitle}>{t("profile.trust")}</Text>
            <Text style={[s.cardVal, { color: level.color }]}>{trust}/100</Text>
          </View>
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${trust}%` as `${number}%`, backgroundColor: level.color }]} />
          </View>
          <Text style={s.cardSub}>
            {trust === 0
              ? t("profile.trustSub.zero")
              : `${t("profile.trustSub")} ${level.label} · ${t("profile.trustPts")}`}
          </Text>
        </View>

        {/* Wallet */}
        {wallet && (
          <View style={s.card}>
            <View style={s.cardRow}>
              <Ionicons name="wallet" size={18} color={colors.gold} />
              <Text style={s.cardTitle}>{t("profile.wallet")}</Text>
              <Text style={[s.cardVal, { color: colors.primary }]}>
                {(wallet.balanceCents / 100).toLocaleString("fr-FR", { style: "currency", currency: wallet.currency })}
              </Text>
            </View>
          </View>
        )}

        {/* Stats */}
        <View style={s.statsRow}>
          {[
            { label: t("profile.groups"), val: tontines.length },
            { label: t("profile.active"), val: tontines.filter((t) => t.status === "active").length },
          ].map(({ label, val }) => (
            <View key={label} style={s.statCard}>
              <Text style={s.statVal}>{val}</Text>
              <Text style={s.statLbl}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Édition profil */}
        {editing ? (
          <View style={s.card}>
            <Text style={s.cardTitle}>{t("profile.editProfile")}</Text>
            <Text style={s.inputLbl}>{t("profile.fullName")}</Text>
            <TextInput
              style={s.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder={t("profile.ph.name")}
              placeholderTextColor={colors.textMuted}
            />
            <Text style={s.inputLbl}>{t("profile.phone")}</Text>
            <TextInput
              style={s.input}
              value={phone}
              onChangeText={setPhone}
              placeholder={t("profile.ph.phone")}
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
            />
            <View style={s.editBtns}>
              <Pressable style={s.btnSave} onPress={() => void saveProfile()} disabled={saving}>
                {saving ? <ActivityIndicator color={colors.dark} size="small" /> : <Text style={s.btnSaveTxt}>{t("profile.save")}</Text>}
              </Pressable>
              <Pressable style={s.btnCancel} onPress={() => { setEditing(false); setFullName(user?.fullName ?? ""); setPhone(user?.phone ?? ""); }}>
                <Text style={s.btnCancelTxt}>{t("profile.cancel")}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* KYC */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color={kycBadge().color} />
            <Text style={s.cardTitle}>{t("profile.kyc")}</Text>
            <View style={[s.kycBadge, { backgroundColor: kycBadge().bg }]}>
              <Text style={[s.kycBadgeTxt, { color: kycBadge().color }]}>{kycBadge().label}</Text>
            </View>
          </View>
          {kycStatus !== "VERIFIED" && (
            <Pressable style={s.kycBtn} onPress={() => void startKyc()} disabled={kycLoading || kycStatus === "PENDING"}>
              {kycLoading ? <ActivityIndicator color={colors.dark} size="small" /> : <Text style={s.kycBtnTxt}>{kycStatus === "PENDING" ? t("profile.kyc.pending.btn") : t("profile.kyc.btn")}</Text>}
            </Pressable>
          )}
          <Text style={s.cardSub}>{t("profile.kyc.sub")}</Text>
        </View>

        {/* Notifications push */}
        <View style={s.card}>
          <View style={s.cardRow}>
            <Ionicons name="notifications-outline" size={20} color={colors.primary} />
            <Text style={s.cardTitle}>{t("profile.notifications")}</Text>
            {pushLoading ? <ActivityIndicator size="small" color={colors.primary} /> : (
              <Switch
                value={pushEnabled}
                onValueChange={(v) => void togglePush(v)}
                trackColor={{ false: colors.surfaceCard, true: `${colors.primary}66` }}
                thumbColor={pushEnabled ? colors.primary : colors.textMuted}
              />
            )}
          </View>
          <Text style={s.cardSub}>{pushEnabled ? t("profile.push.on") : t("profile.push.off")}</Text>
        </View>

        {/* Langue */}
        <View style={[s.card, { marginHorizontal: 20, marginBottom: 12 }]}>
          <View style={s.cardRow}>
            <Ionicons name="language-outline" size={18} color={colors.primary} />
            <Text style={s.cardTitle}>{t("settings.language")}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
            {(["fr", "en"] as Lang[]).map((l) => (
              <Pressable
                key={l}
                onPress={() => void setLang(l)}
                style={{
                  flex: 1, borderRadius: 14, paddingVertical: 10, alignItems: "center",
                  backgroundColor: lang === l ? colors.primary : colors.surfaceCard,
                  borderWidth: 1,
                  borderColor: lang === l ? colors.primary : colors.border,
                }}
              >
                <Text style={{ color: lang === l ? colors.dark : colors.textMuted, fontWeight: "800", fontSize: 14 }}>
                  {l === "fr" ? t("settings.french") : t("settings.english")}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={s.actions}>
          {[
            { icon: "create-outline" as const, label: t("profile.action.edit"), onPress: () => setEditing(true), color: colors.text },
            { icon: "share-outline" as const, label: t("profile.action.public"), onPress: () => void WebBrowser.openBrowserAsync("https://tontineapp-web.vercel.app/u/" + (user?.fullName?.toLowerCase().replace(/\s+/g, "-") ?? "")), color: colors.primary },
            { icon: "document-text-outline" as const, label: t("profile.action.legal"), onPress: () => void WebBrowser.openBrowserAsync("https://tontineapp-web.vercel.app/legal/confidentialite"), color: colors.textMuted },
            { icon: "download-outline" as const, label: t("profile.action.rgpd"), onPress: () => void WebBrowser.openBrowserAsync("https://tontineapp-web.vercel.app/api/user/delete"), color: colors.textMuted },
            { icon: "log-out-outline" as const, label: t("profile.action.logout"), onPress: confirmLogout, color: colors.danger },
          ].map((item) => (
            <Pressable key={item.label} style={s.actionRow} onPress={item.onPress}>
              <View style={[s.actionIcon, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
              </View>
              <Text style={[s.actionLbl, { color: item.color }]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.dark },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  title: { fontSize: 28, color: colors.text, fontWeight: "900" },

  avatarCard: { alignItems: "center", padding: 24, gap: 8 },
  avatar: { width: 80, height: 80, borderRadius: 24, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center", marginBottom: 4 },
  avatarTxt: { color: colors.dark, fontSize: 28, fontWeight: "900" },
  name: { fontSize: 22, color: colors.text, fontWeight: "900" },
  email: { fontSize: 14, color: colors.textMuted },
  levelBadge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginTop: 4 },
  levelTxt: { fontSize: 13, fontWeight: "800" },

  card: { marginHorizontal: 20, marginBottom: 12, backgroundColor: colors.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 10 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, color: colors.text, fontWeight: "800" },
  cardVal: { fontSize: 18, fontWeight: "900" },
  cardSub: { fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  progressTrack: { height: 6, backgroundColor: colors.surfaceCard, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },

  statsRow: { flexDirection: "row", gap: 12, marginHorizontal: 20, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 14, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  statVal: { fontSize: 24, color: colors.text, fontWeight: "900" },
  statLbl: { fontSize: 12, color: colors.textMuted, marginTop: 2 },

  inputLbl: { fontSize: 12, color: colors.textMuted, fontWeight: "700", marginBottom: 4 },
  input: { backgroundColor: colors.surfaceCard, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: colors.text, fontSize: 15, borderWidth: 1, borderColor: colors.border },
  editBtns: { flexDirection: "row", gap: 10, marginTop: 4 },
  btnSave: { flex: 1, backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  btnSaveTxt: { color: colors.dark, fontWeight: "900", fontSize: 14 },
  btnCancel: { flex: 1, backgroundColor: colors.surfaceCard, borderRadius: 14, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: colors.border },
  btnCancelTxt: { color: colors.textMuted, fontWeight: "700", fontSize: 14 },

  kycBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  kycBadgeTxt: { fontSize: 11, fontWeight: "700" },
  kycBtn: { backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  kycBtnTxt: { color: colors.dark, fontWeight: "900", fontSize: 14 },

  actions: { marginHorizontal: 20, gap: 8, marginBottom: 8 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: colors.border },
  actionIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  actionLbl: { flex: 1, fontSize: 15, fontWeight: "700" },
});
