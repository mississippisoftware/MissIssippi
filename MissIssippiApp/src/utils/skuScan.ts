export const normalizeSkuInput = (value: string) => value.trim().toUpperCase();

export const extractSku = (value: string) => {
  const trimmed = value.trim();
  const first = trimmed.indexOf("*");
  const last = trimmed.lastIndexOf("*");
  if (first !== -1 && last > first) {
    return trimmed.slice(first, last + 1);
  }
  return trimmed;
};

export const hasCompleteSku = (value: string) => {
  const first = value.indexOf("*");
  const last = value.lastIndexOf("*");
  return first !== -1 && last > first;
};
