export type ExpenseEntryType = "expense" | "income" | "savings" | "investment";

export type Expense = {
  id: string;
  user_id: string;
  amount: number;
  type: 'income' | 'expense';
  entry_type: ExpenseEntryType | null;
  category: string;
  memo: string;
  date: string;
  created_at: string;
};
