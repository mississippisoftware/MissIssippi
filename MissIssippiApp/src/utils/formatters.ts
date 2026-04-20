const PRICE_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const formatPrice = (value: number | null | undefined): string =>
  value === null || value === undefined ? "--" : PRICE_FORMATTER.format(value);
