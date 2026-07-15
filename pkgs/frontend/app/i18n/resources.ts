import enCommon from "./en/common.json";
import enDuty from "./en/duty.json";
import jaCommon from "./ja/common.json";
import jaDuty from "./ja/duty.json";

export const defaultNS = "common" as const;
export const fallbackLng = "ja" as const;
export const supportedLngs = ["ja", "en"] as const;

export type Language = (typeof supportedLngs)[number];

export const resources = {
  ja: { common: jaCommon, duty: jaDuty },
  en: { common: enCommon, duty: enDuty },
} as const;
