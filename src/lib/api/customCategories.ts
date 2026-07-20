import { supabase } from "@/lib/supabase/client";

export type CustomCategoryType =
  | "expense"
  | "income"
  | "savings"
  | "investment";

export type CustomCategory = {
  id: string;
  type: CustomCategoryType;
  name: string;
  lastUsedAt: string;
};

const customCategoryTypes: CustomCategoryType[] = [
  "expense",
  "income",
  "savings",
  "investment",
];

type CustomCategoryRow = {
  id: string;
  entry_type: CustomCategoryType;
  name: string;
  last_used_at: string;
};

export const normalizeCustomCategoryName = (name: string) =>
  name.trim().toLocaleLowerCase("en-US");

const getAuthenticatedUserId = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("로그인이 필요합니다.");

  return user.id;
};

const toCustomCategory = (row: CustomCategoryRow): CustomCategory => ({
  id: row.id,
  type: row.entry_type,
  name: row.name,
  lastUsedAt: row.last_used_at,
});

export const getRecentCustomCategories = async (): Promise<CustomCategory[]> => {
  const userId = await getAuthenticatedUserId();
  const results = await Promise.all(
    customCategoryTypes.map(async (type) => {
      const { data, error } = await supabase
        .from("user_custom_categories")
        .select("id, entry_type, name, last_used_at")
        .eq("user_id", userId)
        .eq("entry_type", type)
        .order("last_used_at", { ascending: false })
        .limit(5);

      if (error) throw new Error(error.message);
      return ((data ?? []) as CustomCategoryRow[]).map(toCustomCategory);
    }),
  );

  return results.flat();
};

export const saveCustomCategory = async (
  type: CustomCategoryType,
  name: string,
): Promise<CustomCategory> => {
  const userId = await getAuthenticatedUserId();
  const trimmedName = name.trim();
  const { data, error } = await supabase
    .from("user_custom_categories")
    .upsert(
      {
        user_id: userId,
        entry_type: type,
        name: trimmedName,
      },
      { onConflict: "user_id,entry_type,normalized_name" },
    )
    .select("id, entry_type, name, last_used_at")
    .single();

  if (error) throw new Error(error.message);

  return toCustomCategory(data as CustomCategoryRow);
};

export const deleteCustomCategory = async (id: string): Promise<void> => {
  const userId = await getAuthenticatedUserId();
  const { error } = await supabase
    .from("user_custom_categories")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
};
