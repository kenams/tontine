import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { colors } from "../theme/colors";

type InputProps = {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string | null;
  secureTextEntry?: boolean;
  onToggleSecure?: () => void;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
  maxLength?: number;
};

/**
 * Champ texte avec taille, contraste et zones tactiles adaptés au mobile.
 */
export function Input({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  onToggleSecure,
  keyboardType = "default",
  autoCapitalize = "sentences",
  multiline = false,
  maxLength
}: InputProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <View style={[styles.inputShell, error ? styles.inputShellError : null, multiline ? styles.inputShellMultiline : null]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          maxLength={maxLength}
          style={[styles.input, multiline ? styles.inputMultiline : null]}
        />

        {onToggleSecure ? (
          <Pressable onPress={onToggleSecure} style={styles.iconButton}>
            <Ionicons
              name={secureTextEntry ? "eye-off-outline" : "eye-outline"}
              size={18}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600"
  },
  inputShell: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.07)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16
  },
  inputShellError: {
    borderColor: colors.danger
  },
  inputShellMultiline: {
    alignItems: "flex-start",
    paddingTop: 14,
    minHeight: 118
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingVertical: 0
  },
  inputMultiline: {
    minHeight: 86,
    textAlignVertical: "top"
  },
  iconButton: {
    marginLeft: 10,
    padding: 4
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    lineHeight: 18
  }
});

