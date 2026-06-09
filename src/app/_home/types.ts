import type { Expense } from "@/types/expense";

export type ExpenseFormData = Pick<Expense, "amount" | "category" | "memo" | "date" | "type">;
export type InlineFormMode = "create" | "edit";
export type InlineEntryType = Expense["type"] | "savings" | "investment";

export type SavingsMeta = {
  id: string;
  name: string;
  paymentDay: number;
  maturityDate: string;
  initialAmount: number;
  hasNoMaturity: boolean;
};

export type SavingsAccount = SavingsMeta & {
  source: "legacy" | "new";
  items: Expense[];
  currentAmount: number;
  monthlyPayment: number;
  nextPaymentDate: string;
};

export type FixedExpenseMeta = {
  id: string;
  name: string;
  paymentDay: number;
  endDate: string;
  hasNoEndDate: boolean;
};

export type FixedExpenseAccount = FixedExpenseMeta & {
  source: "legacy" | "new";
  items: Expense[];
  monthlyAmount: number;
  nextPaymentDate: string;
};

export type CategoryExpenseSlice = {
  category: string;
  amount: number;
  percentage: number;
};
