import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "../../components/Button";
import { ErrorMessage } from "../../components/ErrorMessage";
import { Input } from "../../components/Input";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { useAuthStore } from "../../store/authStore";
import { colors } from "../../theme/colors";
import { useLang } from "../../i18n/useLang";
import type { LoginScreenProps } from "../../types/navigation";

export function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLang();

  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const storeError = useAuthStore((state) => state.errorMessage);

  const emailError = useMemo(() => {
    if (!email.length) return null;
    return /^\S+@\S+\.\S+$/.test(email.trim()) ? null : t("auth.login.emailInvalid");
  }, [email, t]);

  const passwordError = useMemo(() => {
    if (!password.length) return null;
    return password.trim().length >= 6 ? null : t("auth.login.pwdShort");
  }, [password, t]);

  const isFormDisabled =
    !email.trim() || !password.trim() || Boolean(emailError) || Boolean(passwordError) || isLoading;

  async function handleSubmit() {
    if (emailError || passwordError) { setError(emailError ?? passwordError); return; }
    setError(null);
    const success = await login(email.trim(), password);
    if (!success) setError(useAuthStore.getState().errorMessage ?? t("auth.login.errConnect"));
  }

  return (
    <ScreenContainer tone="dark" scrollable>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={styles.brandBlock}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>K</Text>
          </View>
          <Text style={styles.brand}>Kotizy</Text>
          <Text style={styles.brandSubtitle}>{t("auth.tagline")}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("auth.login.title")}</Text>

          <Input
            label={t("auth.label.email")}
            placeholder={t("auth.login.placeholder.email")}
            value={email}
            onChangeText={(value) => { setEmail(value); setError(null); }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
          />

          <Input
            label="Mot de passe"
            placeholder={t("auth.login.placeholder.pwd")}
            value={password}
            onChangeText={(value) => { setPassword(value); setError(null); }}
            secureTextEntry={!showPassword}
            onToggleSecure={() => setShowPassword((c) => !c)}
            autoCapitalize="none"
            error={passwordError}
          />

          {(error ?? storeError) ? <ErrorMessage message={error ?? storeError ?? ""} /> : null}

          <Button onPress={() => void handleSubmit()} loading={isLoading} disabled={isFormDisabled}>
            {t("auth.login.btn")}
          </Button>

          <Pressable onPress={() => navigation.navigate("Register")} style={styles.linkWrapper}>
            <Text style={styles.link}>{t("auth.login.noAccount")} <Text style={styles.linkBold}>{t("auth.login.signUp")}</Text></Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  brandBlock: { alignItems: "flex-start", gap: 8, paddingHorizontal: 4, paddingTop: 16, paddingBottom: 24 },
  brandBadge: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary, marginBottom: 4 },
  brandBadgeText: { color: "#080b07", fontSize: 26, fontWeight: "900" },
  brand: { color: colors.text, fontSize: 32, fontWeight: "900", letterSpacing: -0.5 },
  brandSubtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  card: { borderRadius: 24, padding: 20, gap: 14, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  cardTitle: { color: colors.text, fontSize: 22, fontWeight: "900", marginBottom: 2 },
  linkWrapper: { paddingVertical: 6, alignItems: "center" },
  link: { color: colors.textMuted, textAlign: "center", fontSize: 14 },
  linkBold: { color: colors.primary, fontWeight: "700" },
});
