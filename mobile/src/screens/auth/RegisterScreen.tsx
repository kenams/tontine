import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "../../components/Button";
import { ErrorMessage } from "../../components/ErrorMessage";
import { Input } from "../../components/Input";
import { ScreenContainer } from "../../components/common/ScreenContainer";
import { useAuthStore } from "../../store/authStore";
import { colors } from "../../theme/colors";
import type { RegisterScreenProps } from "../../types/navigation";

/**
 * Ecran d'inscription optimisé pour une saisie mobile simple.
 */
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
    if (!fullName.length) {
      return null;
    }

    return fullName.trim().length >= 3 ? null : "Le nom complet doit contenir au moins 3 caracteres.";
  }, [fullName]);

  const emailError = useMemo(() => {
    if (!email.length) {
      return null;
    }

    return /^\S+@\S+\.\S+$/.test(email.trim()) ? null : "Format d'email invalide.";
  }, [email]);

  const phoneError = useMemo(() => {
    if (!phone.length) {
      return null;
    }

    const digits = phone.replace(/\D/g, "");
    const hasValidStart = phone.startsWith("+") || phone.startsWith("0");

    return hasValidStart && digits.length >= 10
      ? null
      : "Le numero doit commencer par + ou 0 et contenir au moins 10 chiffres.";
  }, [phone]);

  const passwordError = useMemo(() => {
    if (!password.length) {
      return null;
    }

    return password.trim().length >= 8 ? null : "Le mot de passe doit contenir au moins 8 caracteres.";
  }, [password]);

  const confirmPasswordError = useMemo(() => {
    if (!confirmPassword.length) {
      return null;
    }

    return confirmPassword === password ? null : "La confirmation ne correspond pas au mot de passe.";
  }, [confirmPassword, password]);

  const isFormDisabled =
    !fullName.trim() ||
    !email.trim() ||
    !phone.trim() ||
    !password.trim() ||
    !confirmPassword.trim() ||
    Boolean(fullNameError) ||
    Boolean(emailError) ||
    Boolean(phoneError) ||
    Boolean(passwordError) ||
    Boolean(confirmPasswordError) ||
    isLoading;

  /**
   * Vérifie les champs puis appelle le store d'inscription.
   */
  async function handleSubmit() {
    const currentError =
      fullNameError ?? emailError ?? phoneError ?? passwordError ?? confirmPasswordError;

    if (currentError) {
      setError(currentError);
      return;
    }

    setError(null);

    const success = await register(email.trim(), password, fullName.trim(), phone.trim());

    if (!success) {
      setError(useAuthStore.getState().errorMessage ?? "Impossible de creer le compte.");
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
            Creez votre compte en quelques instants et suivez vos groupes depuis votre telephone.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Inscription</Text>
          <Text style={styles.cardDescription}>
            Votre espace sera pret a accueillir vos groupes, vos paiements et vos messages.
          </Text>

          <Input
            label="Prenom + Nom"
            placeholder="Kenams Diarra"
            value={fullName}
            onChangeText={(value) => {
              setFullName(value);
              setError(null);
            }}
            error={fullNameError}
          />

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
            label="Telephone"
            placeholder="+33 6 12 34 56 78"
            value={phone}
            onChangeText={(value) => {
              setPhone(value);
              setError(null);
            }}
            keyboardType="phone-pad"
            autoCapitalize="none"
            error={phoneError}
          />

          <Input
            label="Mot de passe"
            placeholder="Minimum 8 caracteres"
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

          <Input
            label="Confirmer le mot de passe"
            placeholder="Retapez votre mot de passe"
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              setError(null);
            }}
            secureTextEntry={!showConfirmPassword}
            onToggleSecure={() => setShowConfirmPassword((current) => !current)}
            autoCapitalize="none"
            error={confirmPasswordError}
          />

          {error || storeError ? <ErrorMessage message={error ?? storeError ?? ""} /> : null}

          <Button onPress={() => void handleSubmit()} loading={isLoading} disabled={isFormDisabled}>
            Creer mon compte
          </Button>

          <Pressable onPress={() => navigation.navigate("Login")}>
            <Text style={styles.link}>Deja un compte ? Se connecter</Text>
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
    gap: 20,
    paddingTop: 18,
    paddingBottom: 10
  },
  brandBlock: {
    alignItems: "flex-start",
    gap: 10,
    paddingHorizontal: 4
  },
  brandBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary
  },
  brandBadgeText: {
    color: colors.white,
    fontSize: 26,
    fontWeight: "800"
  },
  brand: {
    color: colors.primary,
    fontSize: 34,
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

