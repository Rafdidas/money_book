import { supabase } from "@/lib/supabase/client";
import type {
  PaymentStatus,
  SavingsAccount,
  SavingsAccountStatus,
  SavingsPayment,
} from "@/types/recurring";

type SavingsAccountPayload = {
  name: string;
  monthly_amount: number;
  payment_day: number;
  start_date: string;
  maturity_date: string | null;
  has_no_maturity: boolean;
  initial_amount: number;
  status?: SavingsAccountStatus;
};

type SavingsPaymentPayload = {
  savings_account_id: string;
  amount: number;
  payment_date: string;
  status?: PaymentStatus;
  paid_at?: string | null;
};

type SavingsAccountUpdatePayload = Partial<SavingsAccountPayload>;

type SavingsPaymentUpdatePayload = Partial<
  Pick<SavingsPayment, "amount" | "payment_date" | "status" | "paid_at">
>;

const getCurrentUserId = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("로그인이 필요합니다.");

  return user.id;
};

export const createSavingsAccount = async (payload: SavingsAccountPayload) => {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("savings_accounts")
    .insert({
      user_id: userId,
      ...payload,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data as SavingsAccount;
};

export const createSavingsPayments = async (payloads: SavingsPaymentPayload[]) => {
  if (!payloads.length) return [];

  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("savings_payments")
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

  return (data || []) as SavingsPayment[];
};

export const getSavingsAccounts = async () => {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("savings_accounts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data || []) as SavingsAccount[];
};

export const getSavingsPaymentsByRange = async (
  from: string,
  to: string,
  options: { includeCancelled?: boolean } = {},
) => {
  const userId = await getCurrentUserId();

  let query = supabase
    .from("savings_payments")
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

  return (data || []) as SavingsPayment[];
};

export const updateSavingsAccount = async (
  id: string,
  payload: SavingsAccountUpdatePayload,
) => {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("savings_accounts")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  return data as SavingsAccount;
};

export const updateSavingsPayments = async (
  ids: string[],
  payload: SavingsPaymentUpdatePayload,
) => {
  if (!ids.length) return [];

  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("savings_payments")
    .update(payload)
    .in("id", ids)
    .eq("user_id", userId)
    .select();

  if (error) throw new Error(error.message);

  return (data || []) as SavingsPayment[];
};

export const cancelFutureSavingsPayments = async (
  savingsAccountId: string,
  fromDate: string,
) => {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("savings_payments")
    .update({ status: "cancelled" as PaymentStatus })
    .eq("savings_account_id", savingsAccountId)
    .eq("user_id", userId)
    .gte("payment_date", fromDate)
    .select();

  if (error) throw new Error(error.message);

  return (data || []) as SavingsPayment[];
};

export const deleteSavingsAccount = async (id: string) => {
  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("savings_accounts")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
};
