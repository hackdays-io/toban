import { SEED_PALETTE } from "~/components/ui/avatar";

export type FallbackIconKind =
  | "house"
  | "user"
  | "heart"
  | "shield"
  | "sparkle"
  | "pie";

// Lucide source paths (24x24 viewBox) — kept inline so we don't pull
// react-dom/server into the client bundle just to serialise an icon.
const FALLBACK_ICON_PATHS: Record<FallbackIconKind, string> = {
  house:
    '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  user: '<circle cx="12" cy="7" r="4"/><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>',
  heart:
    '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  shield:
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  sparkle:
    '<path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/>',
  pie: '<path d="M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z"/><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>',
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

// Icon kinds appropriate for a duty fallback. Excludes `house` (workspace) so
// the randomized fallback never looks like a workspace avatar.
const DUTY_FALLBACK_ICONS: ReadonlyArray<FallbackIconKind> = [
  "user",
  "heart",
  "shield",
  "sparkle",
  "pie",
];

export const pickRandomDutyIcon = (): FallbackIconKind =>
  DUTY_FALLBACK_ICONS[Math.floor(Math.random() * DUTY_FALLBACK_ICONS.length)];
