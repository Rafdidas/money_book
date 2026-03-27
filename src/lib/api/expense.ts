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

export const getExpenses = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('로그인이 필요합니다.');

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', user.id)
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
