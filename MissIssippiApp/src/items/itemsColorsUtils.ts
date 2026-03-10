export const MAX_COLOR_COLUMNS = 15;

export const normalizeName = (value: string) =>
  value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");

export const normalizeHeader = (value: unknown) => String(value ?? "").trim().toLowerCase();

export const splitCompositeColorName = (value: string) =>
  value
    // Treat slash the same as plus for composite colors (e.g. "Black/Denim" == "Black + Denim")
    .split(/[+/]/)
    .map((part) => part.trim())
    .filter(Boolean);

export const getPrimaryColorName = (value: string) => {
  const [primary] = splitCompositeColorName(value);
  return primary ?? "";
};

export const getSecondaryColorNames = (value: string) => {
  const parts = splitCompositeColorName(value);
  return parts.length > 1 ? parts.slice(1) : [];
};

const levenshtein = (a: string, b: string) => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
};

export const isSimilarName = (a: string, b: string) => {
  if (!a || !b || a === b) return false;
  if (a.includes(b) || b.includes(a)) return true;
  const distance = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  const threshold = maxLen <= 5 ? 1 : maxLen <= 8 ? 2 : 3;
  return distance <= threshold;
};

export const getReadableTextColor = (hex?: string | null) => {
  if (!hex) return undefined;
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return undefined;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0f172a" : "#ffffff";
};
