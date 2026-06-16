export const formatWon = (value: number) =>
  `${value < 0 ? "-" : ""}${Math.round(Math.abs(value)).toLocaleString()}원`;

export const formatSignedWon = (value: number) => formatWon(value);
