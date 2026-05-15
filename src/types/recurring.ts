export type PaymentStatus = "scheduled" | "paid" | "skipped" | "cancelled";

export type SavingsAccountStatus = "active" | "completed" | "ended";

export type FixedExpenseRuleStatus = "active" | "ended";

export type SavingsAccount = {
  id: string;
  user_id: string;
  name: string;
  monthly_amount: number;
  payment_day: number;
  start_date: string;
  maturity_date: string | null;
  has_no_maturity: boolean;
  initial_amount: number;
  status: SavingsAccountStatus;
  created_at: string;
  updated_at: string;
};

export type SavingsPayment = {
  id: string;
  user_id: string;
  savings_account_id: string;
  amount: number;
  payment_date: string;
  status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type FixedExpenseRule = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  category: string | null;
  payment_day: number;
  start_date: string;
  end_date: string | null;
  has_no_end_date: boolean;
  status: FixedExpenseRuleStatus;
  created_at: string;
  updated_at: string;
};

export type FixedExpensePayment = {
  id: string;
  user_id: string;
  fixed_expense_rule_id: string;
  amount: number;
  payment_date: string;
  status: PaymentStatus;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};
