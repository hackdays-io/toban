import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useUIStore } from "~/stores";
import { type Language, supportedLngs } from "./resources";

export const useLanguage = () => {
  const { i18n } = useTranslation();
  const setStoreLanguage = useUIStore((s) => s.setLanguage);
  const storeLanguage = useUIStore((s) => s.language);

  const language = (i18n.resolvedLanguage ??
    i18n.language ??
    storeLanguage) as Language;

  const setLanguage = useCallback(
    (lng: Language) => {
      void i18n.changeLanguage(lng);
      setStoreLanguage(lng);
    },
    [i18n, setStoreLanguage],
  );

  return { language, setLanguage, supportedLanguages: supportedLngs };
};
