import i18n, { type i18n as I18nInstance } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import {
  type Language,
  defaultNS,
  fallbackLng,
  resources,
  supportedLngs,
} from "./resources";

const STORAGE_KEY = "toban:lang";

let initialized = false;

export const initI18n = (initialLng?: Language): I18nInstance => {
  if (initialized) {
    if (initialLng && i18n.language !== initialLng) {
      void i18n.changeLanguage(initialLng);
    }
    return i18n;
  }

  const isBrowser = typeof window !== "undefined";

  const instance = i18n.use(initReactI18next);
  if (isBrowser) {
    instance.use(LanguageDetector);
  }

  void instance.init({
    resources,
    supportedLngs: [...supportedLngs],
    fallbackLng,
    defaultNS,
    ns: ["common", "duty"],
    lng: initialLng ?? (isBrowser ? undefined : fallbackLng),
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
    detection: isBrowser
      ? {
          order: ["localStorage", "navigator"],
          lookupLocalStorage: STORAGE_KEY,
          caches: ["localStorage"],
        }
      : undefined,
  });

  initialized = true;
  return i18n;
};

export { i18n, STORAGE_KEY as LANGUAGE_STORAGE_KEY };
export type { Language };
export { supportedLngs, fallbackLng };
