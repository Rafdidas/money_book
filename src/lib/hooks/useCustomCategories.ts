"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createCustomCategory,
  deleteCustomCategory,
  getCustomCategories,
  renameCustomCategory,
  setCustomCategoryFavorite,
  touchCustomCategory,
  type CustomCategory,
  type CustomCategoryType,
} from "@/lib/api/customCategories";
import { readDemoCustomCategories, writeDemoCustomCategories } from "@/lib/demo";

export const useCustomCategories = (isDemoMode: boolean, enabled = true) => {
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      setCategories(isDemoMode ? readDemoCustomCategories() : await getCustomCategories());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "카테고리를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [enabled, isDemoMode]);

  useEffect(() => { void reload(); }, [reload]);

  const persistDemo = (next: CustomCategory[]) => {
    setCategories(next);
    writeDemoCustomCategories(next);
  };

  const addCategory = async (type: CustomCategoryType, name: string) => {
    try {
      if (isDemoMode) {
        persistDemo([{ id: `demo-custom-category-${Date.now()}`, type, name: name.trim(), lastUsedAt: new Date().toISOString(), isFavorite: false }, ...categories]);
      } else {
        const created = await createCustomCategory(type, name);
        setCategories((current) => [created, ...current]);
      }
      return true;
    } catch (cause) { setError(cause instanceof Error ? cause.message : "카테고리를 추가하지 못했습니다."); return false; }
  };

  const deleteCategory = async (category: CustomCategory) => {
    try {
      if (isDemoMode) persistDemo(categories.filter((item) => item.id !== category.id));
      else { await deleteCustomCategory(category.id); setCategories((current) => current.filter((item) => item.id !== category.id)); }
      return true;
    } catch (cause) { setError(cause instanceof Error ? cause.message : "카테고리를 삭제하지 못했습니다."); return false; }
  };

  const toggleFavorite = async (category: CustomCategory) => {
    try {
      const nextFavorite = !category.isFavorite;
      if (isDemoMode) persistDemo(categories.map((item) => item.id === category.id ? { ...item, isFavorite: nextFavorite } : item));
      else { const updated = await setCustomCategoryFavorite(category.id, nextFavorite); setCategories((current) => current.map((item) => item.id === category.id ? updated : item)); }
      return true;
    } catch (cause) { setError(cause instanceof Error ? cause.message : "즐겨찾기를 변경하지 못했습니다."); return false; }
  };

  return { categories, isLoading, error, reload, addCategory, deleteCategory, toggleFavorite, renameCategory: renameCustomCategory, recordUsedCategory: touchCustomCategory };
};
