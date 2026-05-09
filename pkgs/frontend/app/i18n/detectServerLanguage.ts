import { type Language, fallbackLng, supportedLngs } from "./resources";

export const detectServerLanguage = (request: Request): Language => {
  const header = request.headers.get("accept-language");
  if (!header) return fallbackLng;

  const candidates = header
    .split(",")
    .map((part) => {
      const [tag, qPart] = part.trim().split(";");
      const q = qPart?.startsWith("q=") ? Number(qPart.slice(2)) : 1;
      return { tag: tag?.toLowerCase() ?? "", q: Number.isFinite(q) ? q : 0 };
    })
    .filter((c) => c.tag)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of candidates) {
    const base = tag.split("-")[0];
    const match = supportedLngs.find((lng) => lng === base);
    if (match) return match;
  }

  return fallbackLng;
};
