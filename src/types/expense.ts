export type Expense = {
  id: string;
  user_id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  memo: string;
  date: string;
  created_at: string;
};