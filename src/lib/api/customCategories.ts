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
  isFavorite: boolean;
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
  is_favorite?: boolean;
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
  isFavorite: row.is_favorite ?? false,
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

export const getCustomCategories = async (): Promise<CustomCategory[]> => {
  const userId = await getAuthenticatedUserId();
  const { data, error } = await supabase.from("user_custom_categories").select("id, entry_type, name, last_used_at, is_favorite").eq("user_id", userId).order("entry_type", { ascending: true }).order("is_favorite", { ascending: false }).order("last_used_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as CustomCategoryRow[]).map(toCustomCategory);
};

export const createCustomCategory = async (type: CustomCategoryType, name: string): Promise<CustomCategory> => {
  const userId = await getAuthenticatedUserId();
  const { data, error } = await supabase.from("user_custom_categories").insert({ user_id: userId, entry_type: type, name: name.trim(), is_favorite: false }).select("id, entry_type, name, last_used_at, is_favorite").single();
  if (error) throw new Error(error.message);
  return toCustomCategory(data as CustomCategoryRow);
};

export const touchCustomCategory = async (type: CustomCategoryType, name: string): Promise<CustomCategory> => {
  const userId = await getAuthenticatedUserId();
  const { data, error } = await supabase.from("user_custom_categories").upsert({ user_id: userId, entry_type: type, name: name.trim(), last_used_at: new Date().toISOString() }, { onConflict: "user_id,entry_type,normalized_name" }).select("id, entry_type, name, last_used_at, is_favorite").single();
  if (error) throw new Error(error.message);
  return toCustomCategory(data as CustomCategoryRow);
};

const updateCustomCategory = async (id: string, update: Record<string, string | boolean>): Promise<CustomCategory> => {
  const userId = await getAuthenticatedUserId();
  const { data, error } = await supabase.from("user_custom_categories").update(update).eq("id", id).eq("user_id", userId).select("id, entry_type, name, last_used_at, is_favorite").single();
  if (error) throw new Error(error.message);
  return toCustomCategory(data as CustomCategoryRow);
};

export const renameCustomCategory = (id: string, name: string) => updateCustomCategory(id, { name: name.trim() });

export const setCustomCategoryFavorite = (id: string, isFavorite: boolean) => updateCustomCategory(id, { is_favorite: isFavorite });

