import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { t as translate, type Lang } from "./translations";

const LANG_KEY = "kotizy_lang";

type LangStore = {
  lang: Lang;
  setLang: (l: Lang) => Promise<void>;
  t: (key: string) => string;
  loadLang: () => Promise<void>;
};

export const useLang = create<LangStore>((set, get) => ({
  lang: "fr",

  setLang: async (l: Lang) => {
    set({ lang: l });
    await AsyncStorage.setItem(LANG_KEY, l);
  },

  t: (key: string) => translate(key, get().lang),

  loadLang: async () => {
    const stored = await AsyncStorage.getItem(LANG_KEY);
    if (stored === "en" || stored === "fr") set({ lang: stored });
  },
}));
