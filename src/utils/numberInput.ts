export const parseFormattedNumber = (value: string) =>
  Number(value.replaceAll(",", ""));

export const formatIntegerInput = (value: string) => {
  const digits = value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
  return digits ? Number(digits).toLocaleString() : "";
};

export const formatDecimalInput = (value: string, maximumFractionDigits: number) => {
  const normalized = value.replaceAll(",", "").replace(/[^\d.]/g, "");
  if (!normalized) return "";

  const [rawInteger = "", ...fractionParts] = normalized.split(".");
  const integer = rawInteger.replace(/^0+(?=\d)/, "") || "0";
  const formattedInteger = Number(integer).toLocaleString();

  if (!normalized.includes(".")) return formattedInteger;

  const fraction = fractionParts.join("").slice(0, maximumFractionDigits);
  return `${formattedInteger}.${fraction}`;
};
