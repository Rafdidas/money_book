import { getExpensesByRange, getExpensesByYear } from "@/lib/api/expense";
import {
  getFixedExpensePaymentsByRange,
  getFixedExpenseRules,
} from "@/lib/api/fixedExpense";
import {
  getSavingsAccounts,
  getSavingsPaymentsByRange,
} from "@/lib/api/savings";
import type { Expense } from "@/types/expense";
import type {
  FixedExpensePayment,
  FixedExpenseRule,
  PaymentStatus,
  SavingsAccount,
  SavingsPayment,
} from "@/types/recurring";

export type MoneyBookEntrySource =
  | "expense"
  | "legacy_savings"
  | "legacy_fixed_expense"
  | "savings_payment"
  | "fixed_expense_payment";

export type MoneyBookEntry = {
  id: string;
  source: MoneyBookEntrySource;
  amount: number;
  type: "income" | "expense" | "saving" | "investment";
  category: string;
  memo: string;
  date: string;
  status?: PaymentStatus;
  originId?: string;
};

const savingsMetaPattern = /\s*\[\[savings:([^\]]+)\]\]\s*$/;
const fixedExpenseMetaPattern = /\s*\[\[fixed-expense:([^\]]+)\]\]\s*$/;

const getVisibleMemo = (memo: string) =>
  memo
    .replace(savingsMetaPattern, "")
    .replace(fixedExpenseMetaPattern, "")
    .trim();

const isLegacyFixedExpense = (item: Expense) =>
  item.type === "expense" && fixedExpenseMetaPattern.test(item.memo);

const isSavings = (item: Expense) =>
  item.type === "expense" &&
  !isLegacyFixedExpense(item) &&
  (item.category.includes("적금") || item.category.includes("저축"));

const isInvestment = (item: Expense) =>
  item.type === "expense" && item.category.includes("주식");

const mapExpenseToEntry = (item: Expense): MoneyBookEntry => {
  if (isSavings(item)) {
    return {
      id: item.id,
      source: "legacy_savings",
      amount: item.amount,
      type: "saving",
      category: item.category,
      memo: getVisibleMemo(item.memo),
      date: item.date,
      originId: item.id,
    };
  }

  if (isLegacyFixedExpense(item)) {
    return {
      id: item.id,
      source: "legacy_fixed_expense",
      amount: item.amount,
      type: "expense",
      category: item.category,
      memo: getVisibleMemo(item.memo),
      date: item.date,
      originId: item.id,
    };
  }

  if (isInvestment(item)) {
    return {
      id: item.id,
      source: "expense",
      amount: item.amount,
      type: "investment",
      category: item.category,
      memo: item.memo,
      date: item.date,
      originId: item.id,
    };
  }

  return {
    id: item.id,
    source: "expense",
    amount: item.amount,
    type: item.type,
    category: item.category,
    memo: item.memo,
    date: item.date,
    originId: item.id,
  };
};

const mapSavingsPaymentToEntry = (
  payment: SavingsPayment,
  account?: SavingsAccount,
): MoneyBookEntry => ({
  id: payment.id,
  source: "savings_payment",
  amount: payment.amount,
  type: "saving",
  category: "📩적금",
  memo: account?.name ?? "적금",
  date: payment.payment_date,
  status: payment.status,
  originId: payment.savings_account_id,
});

const mapFixedExpensePaymentToEntry = (
  payment: FixedExpensePayment,
  rule?: FixedExpenseRule,
): MoneyBookEntry => ({
  id: payment.id,
  source: "fixed_expense_payment",
  amount: payment.amount,
  type: "expense",
  category: rule?.category || rule?.name || "고정지출",
  memo: rule?.name ?? "고정지출",
  date: payment.payment_date,
  status: payment.status,
  originId: payment.fixed_expense_rule_id,
});

const sortEntriesByDateDesc = (entries: MoneyBookEntry[]) =>
  [...entries].sort((left, right) => right.date.localeCompare(left.date));

export const getMoneyBookEntriesByRange = async (from: string, to: string) => {
  const [
    expenses,
    savingsAccounts,
    savingsPayments,
    fixedExpenseRules,
    fixedExpensePayments,
  ] = await Promise.all([
    getExpensesByRange(from, to),
    getSavingsAccounts(),
    getSavingsPaymentsByRange(from, to),
    getFixedExpenseRules(),
    getFixedExpensePaymentsByRange(from, to),
  ]);

  const savingsAccountMap = new Map(
    savingsAccounts.map((account) => [account.id, account]),
  );
  const fixedExpenseRuleMap = new Map(
    fixedExpenseRules.map((rule) => [rule.id, rule]),
  );

  return sortEntriesByDateDesc([
    ...expenses.map(mapExpenseToEntry),
    ...savingsPayments
      .filter((payment) => payment.status !== "cancelled")
      .map((payment) =>
        mapSavingsPaymentToEntry(
          payment,
          savingsAccountMap.get(payment.savings_account_id),
        ),
      ),
    ...fixedExpensePayments
      .filter((payment) => payment.status !== "cancelled")
      .map((payment) =>
        mapFixedExpensePaymentToEntry(
          payment,
          fixedExpenseRuleMap.get(payment.fixed_expense_rule_id),
        ),
      ),
  ]);
};

export const getMoneyBookEntriesByYear = async (year: number) => {
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;
  const [
    expenses,
    savingsAccounts,
    savingsPayments,
    fixedExpenseRules,
    fixedExpensePayments,
  ] = await Promise.all([
    getExpensesByYear(year),
    getSavingsAccounts(),
    getSavingsPaymentsByRange(from, to),
    getFixedExpenseRules(),
    getFixedExpensePaymentsByRange(from, to),
  ]);

  const savingsAccountMap = new Map(
    savingsAccounts.map((account) => [account.id, account]),
  );
  const fixedExpenseRuleMap = new Map(
    fixedExpenseRules.map((rule) => [rule.id, rule]),
  );

  return sortEntriesByDateDesc([
    ...expenses.map(mapExpenseToEntry),
    ...savingsPayments
      .filter((payment) => payment.status !== "cancelled")
      .map((payment) =>
        mapSavingsPaymentToEntry(
          payment,
          savingsAccountMap.get(payment.savings_account_id),
        ),
      ),
    ...fixedExpensePayments
      .filter((payment) => payment.status !== "cancelled")
      .map((payment) =>
        mapFixedExpensePaymentToEntry(
          payment,
          fixedExpenseRuleMap.get(payment.fixed_expense_rule_id),
        ),
      ),
  ]);
};
