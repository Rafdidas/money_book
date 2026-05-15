import { supabase } from '../supabase/client';

type ExpensePayload = {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  memo: string;
  date: string;
};

export const createExpense = async ({
  amount,
  type,
  category,
  memo,
  date,
}: ExpensePayload) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('로그인이 필요합니다.');

  const { data, error } = await supabase.from('expenses').insert([
    {
      user_id: user.id,
      amount,
      type,
      category,
      memo,
      date,
    },
  ])
  .select();

  if (error) throw new Error(error.message);

  return data;
};

export const createExpenses = async (payloads: ExpensePayload[]) => {
  if (!payloads.length) return [];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('로그인이 필요합니다.');

  const { data, error } = await supabase.from('expenses').insert(
    payloads.map((payload) => ({
      user_id: user.id,
      ...payload,
    })),
  )
  .select();

  if (error) throw new Error(error.message);

  return data;
};

export const getExpenses = async (userId?: string) => {
  let resolvedUserId = userId;

  if (!resolvedUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('로그인이 필요합니다.');
    resolvedUserId = user.id;
  }

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', resolvedUserId)
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);

  return data;
};

export const getExpensesByYear = async (year: number, userId?: string) => {
  let resolvedUserId = userId;

  if (!resolvedUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('로그인이 필요합니다.');
    resolvedUserId = user.id;
  }

  const from = `${year}-01-01`;
  const to = `${year}-12-31`;

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', resolvedUserId)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);

  return data;
};

export const getExpensesByRange = async (
  from: string,
  to: string,
  userId?: string,
) => {
  let resolvedUserId = userId;

  if (!resolvedUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error('로그인이 필요합니다.');
    resolvedUserId = user.id;
  }

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', resolvedUserId)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);

  return data;
};

export const deleteExpense = async (id: string) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('로그인이 필요합니다.');

  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
};

export const deleteExpenses = async (ids: string[]) => {
  if (!ids.length) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('로그인이 필요합니다.');

  const { error } = await supabase
    .from('expenses')
    .delete()
    .in('id', ids)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
};

export const updateExpense = async (id: string, payload: ExpensePayload) => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('로그인이 필요합니다.');

  const { error } = await supabase
    .from('expenses')
    .update(payload)
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);
};
