import {
  fixedExpenseMetaPattern,
  fixedExpenseMetaPrefix,
  openEndedSavingsYears,
  savingsMetaPattern,
  savingsMetaPrefix,
} from "./constants";
import type { FixedExpenseMeta, SavingsMeta } from "./types";
import type { Expense } from "@/types/expense";
import { formatDate } from "@/utils/date";

export const formatCurrency = (value: number) =>
  `${value < 0 ? "-" : ""}₩ ${Math.abs(value).toLocaleString()}`;

export const formatWon = (value: number) =>
  `${value < 0 ? "-" : ""}${Math.round(Math.abs(value)).toLocaleString()}원`;

export const formatHeaderDate = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);

export const formatDetailDate = (dateValue: string) => {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return `${String(date.getFullYear()).slice(2)}.${date.getMonth() + 1}.${date.getDate()}`;
};

export const getCalendarDays = (selectedDate: Date) => {
  const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());
  return Array.from({ length: 35 }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
};

export const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

export const getDailySeries = (
  items: Expense[],
  year: number,
  month: number,
  type?: Expense["type"] | "savings",
) => {
  const dailyTotals = Array.from({ length: getDaysInMonth(year, month) }, () => 0);

  items.forEach((item) => {
    if (type === "savings" && !isSavingsItem(item)) return;
    if (type && type !== "savings" && item.type !== type) return;
    if (type === "expense" && isSavingsItem(item)) return;
    const date = new Date(item.date);
    if (date.getFullYear() !== year || date.getMonth() !== month) return;
    const amount = type
      ? item.amount
      : item.type === "income"
        ? item.amount
        : -item.amount;
    dailyTotals[date.getDate() - 1] += amount;
  });

  let runningTotal = 0;
  return dailyTotals.map((amount) => {
    runningTotal += amount;
    return runningTotal;
  });
};

export const encodeSavingsMemo = (meta: SavingsMeta) =>
  `${meta.name} ${savingsMetaPrefix}${encodeURIComponent(JSON.stringify(meta))}]]`;

export const encodeFixedExpenseMemo = (meta: FixedExpenseMeta) =>
  `${meta.name} ${fixedExpenseMetaPrefix}${encodeURIComponent(JSON.stringify(meta))}]]`;

export const parseSavingsMemo = (memo: string): SavingsMeta | null => {
  const match = memo.match(savingsMetaPattern);
  if (!match) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(match[1])) as Partial<SavingsMeta>;
    if (
      typeof parsed.id !== "string" ||
      typeof parsed.name !== "string" ||
      typeof parsed.paymentDay !== "number" ||
      typeof parsed.maturityDate !== "string" ||
      typeof parsed.initialAmount !== "number"
    ) {
      return null;
    }
    return {
      id: parsed.id,
      name: parsed.name,
      paymentDay: parsed.paymentDay,
      maturityDate: parsed.maturityDate,
      initialAmount: parsed.initialAmount,
      hasNoMaturity: parsed.hasNoMaturity === true,
    };
  } catch {
    return null;
  }
};

export const parseFixedExpenseMemo = (memo: string): FixedExpenseMeta | null => {
  const match = memo.match(fixedExpenseMetaPattern);
  if (!match) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(match[1])) as Partial<FixedExpenseMeta>;
    if (
      typeof parsed.id !== "string" ||
      typeof parsed.name !== "string" ||
      typeof parsed.paymentDay !== "number" ||
      typeof parsed.endDate !== "string"
    ) {
      return null;
    }
    return {
      id: parsed.id,
      name: parsed.name,
      paymentDay: parsed.paymentDay,
      endDate: parsed.endDate,
      hasNoEndDate: parsed.hasNoEndDate === true,
    };
  } catch {
    return null;
  }
};

export const getVisibleMemo = (memo: string) =>
  memo
    .replace(savingsMetaPattern, "")
    .replace(fixedExpenseMetaPattern, "")
    .trim();

export const getMemoWithPreservedMeta = (visibleMemo: string, sourceMemo: string) => {
  const hiddenMeta =
    sourceMemo.match(savingsMetaPattern)?.[0].trim() ??
    sourceMemo.match(fixedExpenseMetaPattern)?.[0].trim();
  const memo = visibleMemo.trim();

  if (!hiddenMeta) return memo;
  if (!memo) return hiddenMeta;
  return `${memo} ${hiddenMeta}`;
};

export const isSavingsCategory = (category: string) => category.includes("적금");

export const isSavingsItem = (item: Expense) =>
  item.type === "expense" && !parseFixedExpenseMemo(item.memo) && isSavingsCategory(item.category);

export const isFixedExpenseItem = (item: Expense) =>
  item.type === "expense" && Boolean(parseFixedExpenseMemo(item.memo));

export const getFallbackSavingsMeta = (item: Expense): SavingsMeta => {
  const date = new Date(`${item.date}T00:00:00`);
  const paymentDay = Number.isNaN(date.getTime()) ? 1 : date.getDate();
  const name = getVisibleMemo(item.memo) || "적금";
  const fallbackKey = encodeURIComponent(`${name}-${paymentDay}-${item.amount}`);

  return {
    id: `savings-fallback-${fallbackKey}`,
    name,
    paymentDay,
    maturityDate: item.date,
    initialAmount: 0,
    hasNoMaturity: false,
  };
};

export const getOpenEndedSavingsDate = (startDate: Date) => {
  const date = new Date(startDate);
  date.setFullYear(date.getFullYear() + openEndedSavingsYears);
  return formatDate(date);
};

export const getNextMonthPaymentChangeMessage = (date: Date) => {
  const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return `${date.getMonth() + 1}월이 아닌 ${nextMonth.getMonth() + 1}월 부터 납입금액이 변경됩니다.`;
};

export const getSavingsPaymentDates = (
  startDate: Date,
  paymentDay: number,
  maturityDateValue: string,
) => {
  const maturityDate = new Date(`${maturityDateValue}T00:00:00`);
  if (Number.isNaN(maturityDate.getTime())) return [];

  const dates: string[] = [];
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const endMonth = new Date(maturityDate.getFullYear(), maturityDate.getMonth(), 1);

  while (cursor <= endMonth) {
    const day = Math.min(paymentDay, getDaysInMonth(cursor.getFullYear(), cursor.getMonth()));
    const paymentDate = new Date(cursor.getFullYear(), cursor.getMonth(), day);
    if (paymentDate <= maturityDate) {
      dates.push(formatDate(paymentDate));
    }
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return dates;
};
