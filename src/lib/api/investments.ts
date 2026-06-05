import { supabase } from "@/lib/supabase/client";
import type {
  InvestmentAccountLimits,
  InvestmentAccountType,
  InvestmentStock,
  LimitAccountType,
} from "@/types/stock";

type InvestmentStockPayload = Omit<InvestmentStock, "id" | "createdAt">;

type InvestmentStockRow = {
  id: string;
  symbol: string;
  name: string;
  market: string;
  quantity: number | string;
  unit_price: number | string;
  purchase_date: string;
  account_type: InvestmentAccountType;
  currency: "KRW";
  memo: string;
  created_at: string;
};

const getCurrentUserId = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("로그인이 필요합니다.");
  return user.id;
};

const toInvestmentStock = (row: InvestmentStockRow): InvestmentStock => ({
  id: row.id,
  symbol: row.symbol,
  name: row.name,
  market: row.market,
  quantity: Number(row.quantity),
  unitPrice: Number(row.unit_price),
  purchaseDate: row.purchase_date,
  accountType: row.account_type,
  currency: row.currency,
  memo: row.memo,
  createdAt: row.created_at,
});

const toInvestmentStockRow = (payload: InvestmentStockPayload) => ({
  symbol: payload.symbol,
  name: payload.name,
  market: payload.market,
  quantity: payload.quantity,
  unit_price: payload.unitPrice,
  purchase_date: payload.purchaseDate,
  account_type: payload.accountType,
  currency: payload.currency,
  memo: payload.memo,
});

export const getInvestmentStocks = async () => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("investment_stocks")
    .select("*")
    .eq("user_id", userId)
    .order("purchase_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return ((data || []) as InvestmentStockRow[]).map(toInvestmentStock);
};

export const createInvestmentStock = async (payload: InvestmentStockPayload) => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("investment_stocks")
    .insert({ user_id: userId, ...toInvestmentStockRow(payload) })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toInvestmentStock(data as InvestmentStockRow);
};

export const createInvestmentStocks = async (payloads: InvestmentStockPayload[]) => {
  if (!payloads.length) return [];
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("investment_stocks")
    .insert(payloads.map((payload) => ({ user_id: userId, ...toInvestmentStockRow(payload) })))
    .select();

  if (error) throw new Error(error.message);
  return ((data || []) as InvestmentStockRow[]).map(toInvestmentStock);
};

export const updateInvestmentStock = async (
  id: string,
  payload: InvestmentStockPayload,
) => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("investment_stocks")
    .update(toInvestmentStockRow(payload))
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return toInvestmentStock(data as InvestmentStockRow);
};

export const deleteInvestmentStock = async (id: string) => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("investment_stocks")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
};

export const getInvestmentAccountLimits = async (
  year: number,
): Promise<InvestmentAccountLimits> => {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("investment_account_limits")
    .select("account_type, amount")
    .eq("user_id", userId)
    .eq("year", year);

  if (error) throw new Error(error.message);

  return (data || []).reduce<InvestmentAccountLimits>(
    (limits, row) => {
      limits[row.account_type as LimitAccountType] = Number(row.amount);
      return limits;
    },
    { ISA: 0, PENSION: 0 },
  );
};

export const upsertInvestmentAccountLimit = async (
  year: number,
  accountType: LimitAccountType,
  amount: number,
) => {
  const userId = await getCurrentUserId();
  const { error } = await supabase
    .from("investment_account_limits")
    .upsert(
      { user_id: userId, year, account_type: accountType, amount },
      { onConflict: "user_id,year,account_type" },
    );

  if (error) throw new Error(error.message);
};
