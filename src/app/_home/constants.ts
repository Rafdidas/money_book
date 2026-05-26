import type { OverviewLine } from "./types";

export const categoryOptions = ["🍚식비", "🚗교통비", "🎨문화생활", "🍱생필품", "🧴미용", "💊병원/약", "🎓교육", "📩공과금", "📱통신비", "🎠회비", "📅경조사", "💳카드대금", "🎁선물", "🏢대출이자"];
export const incomeCategoryOptions = ["💵월급", "💸보너스", "📩용돈", "🪙부수입", "👷아르바이트"];
export const savingsCategory = "📩저축";
export const savingsCategoryOptions = [savingsCategory];
export const investmentCategoryOptions = ["📈주식"];
export const savingsMetaPrefix = "[[savings:";
export const savingsMetaPattern = /\s*\[\[savings:([^\]]+)\]\]\s*$/;
export const fixedExpenseMetaPrefix = "[[fixed-expense:";
export const fixedExpenseMetaPattern = /\s*\[\[fixed-expense:([^\]]+)\]\]\s*$/;
export const customCategoryValue = "__custom__";
export const weekdayLabels = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
export const openEndedSavingsYears = 10;

export const overviewChartColors: Record<OverviewLine["color"], string> = {
  green: "#A2E2B5",
  red: "#FF334B",
  blue: "#4270ED",
  teal: "#33D2CB",
};

export const categoryChartColors = [
  "#FDD9A7",
  "#FFA9B3",
  "#FFF0A1",
  "#A2E2B5",
  "#8AE5E1",
  "#9AE2F9",
  "#B0C3F7",
  "#D4B8FF",
  "#F3B5E5",
];
