import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "../../components/Button";
import { ErrorMessage } from "../../components/ErrorMessage";
import { Input } from "../../components/Input";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { useAuthStore } from "../../store/authStore";
import { colors } from "../../theme/colors";
import type { RegisterScreenProps } from "../../types/navigation";

export function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const storeError = useAuthStore((state) => state.errorMessage);

  const fullNameError = useMemo(() => {
    if (!fullName.length) return null;
    return fullName.trim().length >= 3 ? null : "Au moins 3 caractères.";
  }, [fullName]);

  const emailError = useMemo(() => {
    if (!email.length) return null;
    return /^\S+@\S+\.\S+$/.test(email.trim()) ? null : "Email invalide.";
  }, [email]);

  const phoneError = useMemo(() => {
    if (!phone.length) return null;
    const digits = phone.replace(/\D/g, "");
    return (phone.startsWith("+") || phone.startsWith("0")) && digits.length >= 10
      ? null : "Numéro invalide (ex: +33 6 12 34 56 78).";
  }, [phone]);

  const passwordError = useMemo(() => {
    if (!password.length) return null;
    return password.trim().length >= 8 ? null : "8 caractères minimum.";
  }, [password]);

  const confirmPasswordError = useMemo(() => {
    if (!confirmPassword.length) return null;
    return confirmPassword === password ? null : "Les mots de passe ne correspondent pas.";
  }, [confirmPassword, password]);

  const isFormDisabled =
    !fullName.trim() || !email.trim() || !phone.trim() || !password.trim() || !confirmPassword.trim() ||
    Boolean(fullNameError) || Boolean(emailError) || Boolean(phoneError) ||
    Boolean(passwordError) || Boolean(confirmPasswordError) || isLoading;

  async function handleSubmit() {
    const err = fullNameError ?? emailError ?? phoneError ?? passwordError ?? confirmPasswordError;
    if (err) { setError(err); return; }
    setError(null);
    const success = await register(email.trim(), password, fullName.trim(), phone.trim());
    if (!success) setError(useAuthStore.getState().errorMessage ?? "Impossible de créer le compte.");
  }

  return (
    <ScreenContainer tone="dark" scrollable>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={s.brandBlock}>
          <View style={s.brandBadge}>
            <Text style={s.brandBadgeText}>K</Text>
          </View>
          <Text style={s.brand}>Kotizy</Text>
          <Text style={s.brandSub}>Créez votre compte en quelques secondes.</Text>
        </View>

        <View style={s.card}>
          <Text style={s.cardTitle}>Inscription</Text>

          <Input label="Prénom + Nom" placeholder="Kenams Diarra" value={fullName}
            onChangeText={(v) => { setFullName(v); setError(null); }} error={fullNameError} />

          <Input label="Email" placeholder="votre@email.com" value={email}
            onChangeText={(v) => { setEmail(v); setError(null); }}
            keyboardType="email-address" autoCapitalize="none" error={emailError} />

          <Input label="Téléphone" placeholder="+33 6 12 34 56 78" value={phone}
            onChangeText={(v) => { setPhone(v); setError(null); }}
            keyboardType="phone-pad" autoCapitalize="none" error={phoneError} />

          <Input label="Mot de passe" placeholder="8 caractères minimum" value={password}
            onChangeText={(v) => { setPassword(v); setError(null); }}
            secureTextEntry={!showPassword} onToggleSecure={() => setShowPassword((c) => !c)}
            autoCapitalize="none" error={passwordError} />

          <Input label="Confirmer le mot de passe" placeholder="Retapez votre mot de passe" value={confirmPassword}
            onChangeText={(v) => { setConfirmPassword(v); setError(null); }}
            secureTextEntry={!showConfirmPassword} onToggleSecure={() => setShowConfirmPassword((c) => !c)}
            autoCapitalize="none" error={confirmPasswordError} />

          {(error ?? storeError) ? <ErrorMessage message={error ?? storeError ?? ""} /> : null}

          <Button onPress={() => void handleSubmit()} loading={isLoading} disabled={isFormDisabled}>
            Créer mon compte
          </Button>

          <Pressable onPress={() => navigation.navigate("Login")} style={s.linkWrapper}>
            <Text style={s.link}>Déjà un compte ? <Text style={s.linkBold}>Se connecter</Text></Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  brandBlock: { alignItems: "flex-start", gap: 8, paddingHorizontal: 4, paddingTop: 16, paddingBottom: 24 },
  brandBadge: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary, marginBottom: 4 },
  brandBadgeText: { color: "#080b07", fontSize: 26, fontWeight: "900" },
  brand: { color: colors.text, fontSize: 32, fontWeight: "900", letterSpacing: -0.5 },
  brandSub: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  card: { borderRadius: 24, padding: 20, gap: 14, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  cardTitle: { color: colors.text, fontSize: 22, fontWeight: "900", marginBottom: 2 },
  linkWrapper: { paddingVertical: 6, alignItems: "center" },
  link: { color: colors.textMuted, textAlign: "center", fontSize: 14 },
  linkBold: { color: colors.primary, fontWeight: "700" },
});
