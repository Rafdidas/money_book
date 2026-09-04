import {
  fixedExpenseMetaPattern,
  fixedExpenseMetaPrefix,
  investmentCategoryOptions,
  openEndedSavingsYears,
  recurringPausePattern,
  savingsMetaPattern,
  savingsMetaPrefix,
} from "./constants";
import type { FixedExpenseMeta, SavingsMeta } from "./types";
import type { Expense } from "@/types/expense";
import { getMonthCalendarDays } from "@/utils/calendar";
import { formatDate } from "@/utils/date";

export const formatCurrency = (value: number) =>
  `${value < 0 ? "-" : ""}₩ ${Math.abs(value).toLocaleString()}`;

export const formatWon = (value: number) =>
  `${value < 0 ? "-" : ""}${Math.round(Math.abs(value)).toLocaleString()}원`;

export const formatCompactWon = (value: number) => {
  const roundedValue = Math.round(value);
  const absoluteValue = Math.abs(roundedValue);

  if (absoluteValue < 10000) return formatWon(roundedValue);

  const manWon = absoluteValue / 10000;
  const formattedManWon = Number.isInteger(manWon)
    ? manWon.toLocaleString()
    : manWon.toLocaleString(undefined, {
        maximumFractionDigits: 1,
      });

  return `${roundedValue < 0 ? "-" : ""}${formattedManWon}만원`;
};

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

export const getCalendarDays = getMonthCalendarDays;

export const getDaysInMonth = (year: number, month: number) =>
  new Date(year, month + 1, 0).getDate();

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
    .replace(recurringPausePattern, "")
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

export const isSavingsCategory = (category: string) =>
  category.includes("적금") || category.includes("저축");

export const isSavingsItem = (item: Expense) =>
  item.entry_type
    ? item.entry_type === "savings"
    : item.type === "expense" &&
      !parseFixedExpenseMemo(item.memo) &&
      isSavingsCategory(item.category);

export const isInvestmentItem = (item: Expense) =>
  item.entry_type
    ? item.entry_type === "investment"
    : item.type === "expense" && investmentCategoryOptions.includes(item.category);

export const isFixedExpenseItem = (item: Expense) =>
  item.type === "expense" &&
  (!item.entry_type || item.entry_type === "expense") &&
  Boolean(parseFixedExpenseMemo(item.memo));

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

export const partitionSavingsItemsForMaturity = <T extends { date: string }>(
  items: T[],
  selectedMonthStart: string,
  selectedMonthEnd: string,
  includeSelectedMonthPayment: boolean,
) => {
  const lastKeptDate = includeSelectedMonthPayment
    ? selectedMonthEnd
    : selectedMonthStart;

  return items.reduce<{ keptItems: T[]; removedItems: T[] }>(
    (result, item) => {
      if (
        item.date < selectedMonthStart ||
        (includeSelectedMonthPayment && item.date <= lastKeptDate)
      ) {
        result.keptItems.push(item);
      } else {
        result.removedItems.push(item);
      }
      return result;
    },
    { keptItems: [], removedItems: [] },
  );
};

export const isSavingsMaturityEditable = (account: {
  source: "legacy" | "new";
  status?: string;
  hasNoMaturity?: boolean;
  maturityDate?: string;
}, selectedMonthStart?: string, selectedMonthEnd?: string) => {
  if (account.source === "new") return account.status === "completed";
  if (
    account.hasNoMaturity ||
    !selectedMonthStart ||
    !selectedMonthEnd ||
    !account.maturityDate
  ) {
    return false;
  }

  return (
    account.maturityDate >= selectedMonthStart &&
    account.maturityDate <= selectedMonthEnd
  );
};
