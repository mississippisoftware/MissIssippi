const COLOR_ALIASES: Record<string, string> = {
  "off white": "#f5f5ef",
  "off-white": "#f5f5ef",
  ivory: "#fffff0",
  "heather gray": "#9ca3af",
  "heather grey": "#9ca3af",
  charcoal: "#364153",
  navy: "#1e3a8a",
  khaki: "#c3b091",
  natural: "#e7dfcf",
};

const swatchColorCache = new Map<string, string>();

const supportsCssColor = (candidate: string) => {
  if (!candidate) return false;
  if (typeof window === "undefined" || typeof window.CSS?.supports !== "function") return false;
  return window.CSS.supports("color", candidate);
};

/**
 * Resolve the display color for any swatch or dot.
 * Prefers the stored hexColor when available; falls back to getSwatchColor.
 */
export const resolveSwatchColor = (colorName: string, hexColor?: string | null): string =>
  hexColor || getSwatchColor(colorName);

export const getSwatchColor = (colorName: string): string => {
  const cacheKey = colorName.trim().toLowerCase();
  const cached = swatchColorCache.get(cacheKey);
  if (cached) return cached;

  const normalized = colorName.trim().toLowerCase();
  if (!normalized) return "hsl(210 16% 78%)";

  const hexMatch = normalized.match(/#?([0-9a-f]{3}|[0-9a-f]{6})\b/i);
  if (hexMatch) {
    const hex = hexMatch[1];
    const resolved = `#${hex}`;
    swatchColorCache.set(cacheKey, resolved);
    return resolved;
  }

  const aliased = COLOR_ALIASES[normalized] ?? normalized;
  if (supportsCssColor(aliased)) {
    swatchColorCache.set(cacheKey, aliased);
    return aliased;
  }

  const compressed = aliased.replace(/\s+/g, "");
  if (supportsCssColor(compressed)) {
    swatchColorCache.set(cacheKey, compressed);
    return compressed;
  }

  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  const fallback = `hsl(${hue} 58% 56%)`;
  swatchColorCache.set(cacheKey, fallback);
  return fallback;
};
