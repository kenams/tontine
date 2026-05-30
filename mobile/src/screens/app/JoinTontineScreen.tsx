import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTontineStore } from "../../store/tontineStore";
import { colors } from "../../theme/colors";
import type { JoinTontineScreenProps } from "../../types/navigation";

export function JoinTontineScreen({ navigation }: JoinTontineScreenProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const joinTontine = useTontineStore((s) => s.joinTontine);

  async function handleJoin() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed || trimmed.length < 4) { setError("Code invalide."); return; }
    setLoading(true);
    setError(null);
    try {
      await joinTontine(trimmed);
      navigation.goBack();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code introuvable.");
    }
    setLoading(false);
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={s.wrap}>
        <Pressable style={s.back} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>

        <View style={s.content}>
          <View style={s.iconWrap}>
            <Ionicons name="enter-outline" size={36} color={colors.primary} />
          </View>
          <Text style={s.title}>Rejoindre une tontine</Text>
          <Text style={s.subtitle}>Entrez le code du groupe partagé par l'administrateur.</Text>

          <View style={s.inputWrap}>
            <TextInput
              style={s.input}
              value={code}
              onChangeText={(v) => { setCode(v.toUpperCase()); setError(null); }}
              placeholder="ex : KOTIZY-AB12"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus
            />
          </View>

          {error ? (
            <View style={s.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
              <Text style={s.errorTxt}>{error}</Text>
            </View>
          ) : null}

          <Pressable style={[s.btn, (loading || !code.trim()) && s.btnDisabled]} onPress={() => void handleJoin()} disabled={loading || !code.trim()}>
            {loading ? <ActivityIndicator color={colors.dark} size="small" /> : <Text style={s.btnTxt}>Rejoindre</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.dark },
  wrap: { flex: 1, paddingHorizontal: 20 },
  back: { marginTop: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: colors.border },
  content: { flex: 1, justifyContent: "center", gap: 16 },
  iconWrap: { width: 72, height: 72, borderRadius: 22, backgroundColor: `${colors.primary}22`, justifyContent: "center", alignItems: "center", alignSelf: "center", marginBottom: 8 },
  title: { fontSize: 28, color: colors.text, fontWeight: "900", textAlign: "center" },
  subtitle: { fontSize: 15, color: colors.textMuted, textAlign: "center", lineHeight: 22 },
  inputWrap: { backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 20, paddingVertical: 4 },
  input: { fontSize: 22, color: colors.text, fontWeight: "900", letterSpacing: 3, paddingVertical: 16, textAlign: "center" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: `${colors.danger}15`, borderRadius: 12, padding: 12 },
  errorTxt: { color: colors.danger, fontSize: 14, fontWeight: "600" },
  btn: { backgroundColor: colors.primary, borderRadius: 18, paddingVertical: 16, alignItems: "center" },
  btnDisabled: { opacity: 0.4 },
  btnTxt: { color: colors.dark, fontSize: 16, fontWeight: "900" },
});
