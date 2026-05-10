import { SEED_PALETTE } from "~/components/ui/avatar";

export type FallbackIconKind = "house" | "user";

// Lucide source paths (24x24 viewBox) — kept inline so we don't pull
// react-dom/server into the client bundle just to serialise an icon.
const FALLBACK_ICON_PATHS: Record<FallbackIconKind, string> = {
  house:
    '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  user: '<circle cx="12" cy="7" r="4"/><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>',
};

export const buildFallbackSvgFile = (
  color: string,
  icon: FallbackIconKind,
  fileName: string,
): File => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256"><rect width="256" height="256" rx="128" fill="${color}"/><g transform="translate(80 80) scale(4.6667)" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${FALLBACK_ICON_PATHS[icon]}</g></svg>`;
  return new File([svg], fileName, { type: "image/svg+xml" });
};

export const pickRandomColor = (): string =>
  SEED_PALETTE[Math.floor(Math.random() * SEED_PALETTE.length)];
