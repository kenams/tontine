import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { apiCall } from "../../services/api";
import { colors } from "../../theme/colors";
import { useLang } from "../../i18n/useLang";

type Notif = {
  id: string; title: string; body: string; type: string;
  readAt: string | null; createdAt: string;
};

const TYPE_ICONS: Record<string, { icon: React.ComponentProps<typeof Ionicons>["name"]; color: string }> = {
  PAYMENT:      { icon: "card",           color: colors.primary },
  PAYOUT:       { icon: "gift",           color: colors.gold },
  WELCOME:      { icon: "hand-right",     color: colors.primary },
  DUE_REMINDER: { icon: "alarm",          color: colors.warning },
  FRAUD_ALERT:  { icon: "shield",         color: colors.danger },
  INVITE:       { icon: "people",         color: colors.primary },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function NotificationsScreen() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useLang();

  async function load() {
    try {
      const res = await apiCall<{ notifications: Notif[] }>("get", "/api/notifications");
      setNotifs(res.notifications ?? []);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }

  async function markAll() {
    try {
      await apiCall("post", "/api/notifications/read", {});
      setNotifs((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    } catch {}
  }

  useEffect(() => { void load(); }, []);

  const unread = notifs.filter((n) => !n.readAt).length;

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  const unreadLabel = unread > 0
    ? `${unread} ${unread > 1 ? t("notifs.unreadPlural") : t("notifs.unread")}`
    : t("notifs.allRead");

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <View>
          <Text style={s.title}>{t("notifs.title")}</Text>
          <Text style={s.subtitle}>{unreadLabel}</Text>
        </View>
        {unread > 0 && (
          <Pressable style={s.markBtn} onPress={() => void markAll()}>
            <Text style={s.markTxt}>{t("notifs.markAll")}</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={notifs}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="notifications-outline" size={48} color={colors.textMuted} />
            <Text style={s.emptyTxt}>{t("notifs.empty")}</Text>
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 }}
        renderItem={({ item }) => {
          const cfg = TYPE_ICONS[item.type] ?? { icon: "notifications" as const, color: colors.textMuted };
          const isUnread = !item.readAt;
          return (
            <View style={[s.notifRow, isUnread && s.notifUnread]}>
              <View style={[s.notifIcon, { backgroundColor: `${cfg.color}22` }]}>
                <Ionicons name={cfg.icon} size={20} color={cfg.color} />
              </View>
              <View style={s.notifInfo}>
                <View style={s.notifTop}>
                  <Text style={s.notifTitle}>{item.title}</Text>
                  {isUnread && <View style={s.dot} />}
                </View>
                <Text style={s.notifBody}>{item.body}</Text>
                <Text style={s.notifDate}>{fmtDate(item.createdAt)}</Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.dark },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 28, color: colors.text, fontWeight: "900" },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  markBtn: { backgroundColor: `${colors.primary}22`, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  markTxt: { color: colors.primary, fontSize: 13, fontWeight: "700" },
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyTxt: { color: colors.textMuted, fontSize: 15, textAlign: "center" },
  notifRow: { flexDirection: "row", gap: 12, backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  notifUnread: { borderColor: `${colors.primary}40` },
  notifIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  notifInfo: { flex: 1, gap: 4 },
  notifTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  notifTitle: { fontSize: 14, fontWeight: "800", color: colors.text, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  notifBody: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  notifDate: { fontSize: 11, color: colors.textMuted },
});
