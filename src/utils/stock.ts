export const normalizeStockSearchText = (value: string) =>
  value.normalize("NFKC").toLowerCase().replace(/[\s\p{P}\p{S}]+/gu, "");
