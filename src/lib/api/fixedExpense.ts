import { supabase } from "@/lib/supabase/client";
import type {
  FixedExpensePayment,
  FixedExpenseRule,
  FixedExpenseRuleStatus,
  PaymentStatus,
} from "@/types/recurring";

type FixedExpenseRulePayload = {
  name: string;
  amount: number;
  category: string | null;
  payment_day: number;
  start_date: string;
  end_date: string | null;
  has_no_end_date: boolean;
  status?: FixedExpenseRuleStatus;
};

type FixedExpensePaymentPayload = {
  fixed_expense_rule_id: string;
  amount: number;
  payment_date: string;
  status?: PaymentStatus;
  paid_at?: string | null;
};

type FixedExpenseRuleUpdatePayload = Partial<FixedExpenseRulePayload>;

type FixedExpensePaymentUpdatePayload = Partial<
  Pick<FixedExpensePayment, "amount" | "payment_date" | "status" | "paid_at">
>;

const getCurrentUserId = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("로그인이 필요합니다.");

  return user.id;
};

export const createFixedExpenseRule = async (payload: FixedExpenseRulePayload) => {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("fixed_expense_rules")
    .insert({
      user_id: userId,
      ...payload,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data as FixedExpenseRule;
};

export const createFixedExpensePayments = async (
  payloads: FixedExpensePaymentPayload[],
) => {
  if (!payloads.length) return [];

  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("fixed_expense_payments")
    .insert(
      payloads.map((payload) => ({
        user_id: userId,
        status: "scheduled" as PaymentStatus,
        paid_at: null,
        ...payload,
      })),
    )
    .select();

  if (error) throw new Error(error.message);

  return (data || []) as FixedExpensePayment[];
};

export const getFixedExpenseRules = async () => {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("fixed_expense_rules")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []) as FixedExpenseRule[];
};

export const getFixedExpensePaymentsByRange = async (
  from: string,
  to: string,
  options: { includeCancelled?: boolean } = {},
) => {
  const userId = await getCurrentUserId();

  let query = supabase
    .from("fixed_expense_payments")
    .select("*")
    .eq("user_id", userId)
    .gte("payment_date", from)
    .lte("payment_date", to)
    .order("payment_date", { ascending: false });

  if (!options.includeCancelled) {
    query = query.neq("status", "cancelled");
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);

  return (data || []) as FixedExpensePayment[];
};

export const updateFixedExpenseRule = async (
  id: string,
  payload: FixedExpenseRuleUpdatePayload,
) => {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("fixed_expense_rules")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data as FixedExpenseRule;
};

export const updateFixedExpensePayments = async (
  ids: string[],
  payload: FixedExpensePaymentUpdatePayload,
) => {
  if (!ids.length) return [];

  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("fixed_expense_payments")
    .update(payload)
    .in("id", ids)
    .eq("user_id", userId)
    .select();

  if (error) throw new Error(error.message);

  return (data || []) as FixedExpensePayment[];
};

export const cancelFutureFixedExpensePayments = async (
  fixedExpenseRuleId: string,
  fromDate: string,
) => {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("fixed_expense_payments")
    .update({ status: "cancelled" as PaymentStatus })
    .eq("fixed_expense_rule_id", fixedExpenseRuleId)
    .eq("user_id", userId)
    .gte("payment_date", fromDate)
    .select();

  if (error) throw new Error(error.message);

  return (data || []) as FixedExpensePayment[];
};

export const deleteFixedExpenseRule = async (id: string) => {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("fixed_expense_rules")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
};
