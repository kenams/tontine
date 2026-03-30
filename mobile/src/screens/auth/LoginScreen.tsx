import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "../../components/Button";
import { ErrorMessage } from "../../components/ErrorMessage";
import { Input } from "../../components/Input";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { useAuthStore } from "../../store/authStore";
import { colors } from "../../theme/colors";
import type { LoginScreenProps } from "../../types/navigation";

/**
 * Ecran de connexion recentré sur un usage téléphone.
 */
export function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const storeError = useAuthStore((state) => state.errorMessage);

  const emailError = useMemo(() => {
    if (!email.length) {
      return null;
    }

    return /^\S+@\S+\.\S+$/.test(email.trim()) ? null : "Format d'email invalide.";
  }, [email]);

  const passwordError = useMemo(() => {
    if (!password.length) {
      return null;
    }

    return password.trim().length >= 6 ? null : "Le mot de passe doit contenir au moins 6 caracteres.";
  }, [password]);

  const isFormDisabled =
    !email.trim() || !password.trim() || Boolean(emailError) || Boolean(passwordError) || isLoading;

  /**
   * Valide les champs localement puis déclenche la connexion.
   */
  async function handleSubmit() {
    if (emailError || passwordError) {
      setError(emailError ?? passwordError);
      return;
    }

    setError(null);

    const success = await login(email.trim(), password);

    if (!success) {
      setError(useAuthStore.getState().errorMessage ?? "Impossible de vous connecter.");
    }
  }

  return (
    <ScreenContainer tone="dark" scrollable={false}>
      <KeyboardAvoidingView
        style={styles.wrapper}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.brandBlock}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>T</Text>
          </View>
          <Text style={styles.brand}>TontineApp</Text>
          <Text style={styles.brandSubtitle}>
            Votre cercle d’épargne, pensé d’abord pour le mobile, simple à suivre et rassurant au quotidien.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connexion</Text>
          <Text style={styles.cardDescription}>
            Entrez dans votre espace pour retrouver vos tontines, vos cotisations et les messages du groupe.
          </Text>

          <Input
            label="Email"
            placeholder="kenams@tontineapp.fr"
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              setError(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            error={emailError}
          />

          <Input
            label="Mot de passe"
            placeholder="Votre mot de passe"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setError(null);
            }}
            secureTextEntry={!showPassword}
            onToggleSecure={() => setShowPassword((current) => !current)}
            autoCapitalize="none"
            error={passwordError}
          />

          {error || storeError ? <ErrorMessage message={error ?? storeError ?? ""} /> : null}

          <Button onPress={() => void handleSubmit()} loading={isLoading} disabled={isFormDisabled}>
            Se connecter
          </Button>

          <Pressable onPress={() => navigation.navigate("Register")}>
            <Text style={styles.link}>Pas encore de compte ? S'inscrire</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: 24,
    paddingBottom: 12,
    gap: 22
  },
  brandBlock: {
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 4,
    paddingTop: 6
  },
  brandBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary
  },
  brandBadgeText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "800"
  },
  brand: {
    color: colors.primary,
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 0.3
  },
  brandSubtitle: {
    color: "rgba(255,255,255,0.72)",
    textAlign: "left",
    lineHeight: 22
  },
  card: {
    borderRadius: 28,
    padding: 22,
    gap: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 30,
    elevation: 8
  },
  cardTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800"
  },
  cardDescription: {
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: 4
  },
  link: {
    color: colors.primary,
    textAlign: "center",
    fontWeight: "700"
  }
});

