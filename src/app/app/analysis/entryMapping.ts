import type { MoneyBookEntry } from "@/lib/api/moneyBookEntries";
import type { Expense } from "@/types/expense";

const isLegacySavingsCategory = (category: string) =>
  category.includes("적금") || category.includes("저축");

const isLegacyInvestmentCategory = (category: string) =>
  category.includes("주식");

export const mapExpenseToAnalysisEntry = (item: Expense): MoneyBookEntry => {
  const hasDurableSubtype = item.entry_type != null;
  const isSavings = hasDurableSubtype
    ? item.entry_type === "savings"
    : isLegacySavingsCategory(item.category);
  const isInvestment = hasDurableSubtype
    ? item.entry_type === "investment"
    : isLegacyInvestmentCategory(item.category);
  const baseType =
    item.entry_type === "expense" || item.entry_type === "income"
      ? item.entry_type
      : item.type;
  const type: MoneyBookEntry["type"] = isSavings
    ? "saving"
    : isInvestment
      ? "investment"
      : baseType;

  return {
    id: item.id,
    source: isSavings ? "legacy_savings" : "expense",
    amount: item.amount,
    type,
    category: item.category,
    memo: item.memo,
    date: item.date,
    originId: item.id,
  };
};
