import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../theme/colors";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    icon: "people" as const,
    title: "Bienvenue sur Kotizy",
    sub: "L'épargne collective, réinventée. Créez ou rejoignez des tontines avec vos proches.",
  },
  {
    icon: "wallet" as const,
    title: "Votre wallet intégré",
    sub: "Déposez de l'argent, payez vos cotisations et recevez votre pot directement sur l'app.",
  },
  {
    icon: "shield-checkmark" as const,
    title: "Sécurisé & transparent",
    sub: "Chaque transaction est enregistrée. Paiements automatiques, rappels intelligents.",
  },
];

type Props = { onDone: () => void };

export function OnboardingScreen({ onDone }: Props) {
  const [step, setStep] = useState(0);
  const slide = SLIDES[step]!;

  async function finish() {
    await AsyncStorage.setItem("onboarding_done", "1");
    onDone();
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.content}>
        <View style={s.iconWrap}>
          <Ionicons name={slide.icon} size={72} color={colors.primary} />
        </View>
        <Text style={s.title}>{slide.title}</Text>
        <Text style={s.sub}>{slide.sub}</Text>

        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <View key={i} style={[s.dot, i === step && s.dotActive]} />
          ))}
        </View>
      </View>

      <View style={s.footer}>
        {step < SLIDES.length - 1 ? (
          <>
            <Pressable style={s.btnSkip} onPress={() => void finish()}>
              <Text style={s.btnSkipTxt}>Passer</Text>
            </Pressable>
            <Pressable style={s.btnNext} onPress={() => setStep(step + 1)}>
              <Text style={s.btnNextTxt}>Suivant</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.dark} />
            </Pressable>
          </>
        ) : (
          <Pressable style={[s.btnNext, { flex: 1 }]} onPress={() => void finish()}>
            <Text style={s.btnNextTxt}>Commencer</Text>
            <Ionicons name="checkmark" size={18} color={colors.dark} />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.dark },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 20 },
  iconWrap: { width: 120, height: 120, borderRadius: 36, backgroundColor: `${colors.primary}15`, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 28, color: colors.text, fontWeight: "900", textAlign: "center" },
  sub: { fontSize: 16, color: colors.textMuted, textAlign: "center", lineHeight: 24 },
  dots: { flexDirection: "row", gap: 8, marginTop: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.surfaceCard },
  dotActive: { width: 24, backgroundColor: colors.primary },
  footer: { flexDirection: "row", gap: 12, paddingHorizontal: 24, paddingBottom: 24, paddingTop: 12 },
  btnSkip: { flex: 1, borderRadius: 16, paddingVertical: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.border },
  btnSkipTxt: { color: colors.textMuted, fontWeight: "700", fontSize: 15 },
  btnNext: { flex: 2, borderRadius: 16, paddingVertical: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.primary, flexDirection: "row", gap: 8 },
  btnNextTxt: { color: colors.dark, fontWeight: "900", fontSize: 15 },
});
