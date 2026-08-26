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
import {
  CUSTOM_CATEGORY_FAVORITE_LIMIT,
  getCustomCategoryNameError,
  removeCustomCategory,
  replaceCustomCategory,
} from "@/lib/customCategoryRules";

type Options = {
  enabled: boolean;
  isDemoMode: boolean;
  defaultOptionsByType: Record<CustomCategoryType, string[]>;
};

const favoriteLimitError = "자주 쓰는 카테고리는 유형별로 5개까지 지정할 수 있습니다.";

const getMutationError = (cause: unknown, fallback: string) =>
  cause instanceof Error && cause.message.toLowerCase().includes("favorite limit")
    ? favoriteLimitError
    : fallback;

export const useCustomCategories = ({ enabled, isDemoMode, defaultOptionsByType }: Options) => {
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [loadError, setLoadError] = useState("");
  const [mutationError, setMutationError] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const reload = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError("");
    try {
      setCategories(isDemoMode ? readDemoCustomCategories() : await getCustomCategories());
    } catch {
      setCategories([]);
      setLoadError("카테고리를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [enabled, isDemoMode]);

  useEffect(() => { void reload(); }, [reload]);

  const persistDemo = (next: CustomCategory[]) => {
    setCategories(next);
    writeDemoCustomCategories(next);
  };

  const validateName = (type: CustomCategoryType, name: string, excludeId?: string) =>
    getCustomCategoryNameError({
      categories,
      type,
      name,
      defaultNames: defaultOptionsByType[type],
      excludeId,
    });

  const addCategory = async (type: CustomCategoryType, name: string) => {
    const error = validateName(type, name);
    if (error) {
      setMutationError(error);
      return false;
    }

    setBusyKey(`add:${type}`);
    setMutationError("");
    try {
      if (isDemoMode) {
        persistDemo([{ id: `demo-custom-category-${Date.now()}`, type, name: name.trim(), lastUsedAt: new Date().toISOString(), isFavorite: false }, ...categories]);
      } else {
        const created = await createCustomCategory(type, name);
        setCategories((current) => [created, ...current]);
      }
      return true;
    } catch (cause) {
      setMutationError(getMutationError(cause, "카테고리를 추가하지 못했습니다."));
      return false;
    } finally {
      setBusyKey("");
    }
  };

  const renameCategory = async (category: CustomCategory, name: string) => {
    const error = validateName(category.type, name, category.id);
    if (error) {
      setMutationError(error);
      return false;
    }

    setBusyKey(`rename:${category.id}`);
    setMutationError("");
    try {
      if (isDemoMode) persistDemo(replaceCustomCategory(categories, { ...category, name: name.trim() }));
      else {
        const updated = await renameCustomCategory(category.id, name);
        setCategories((current) => replaceCustomCategory(current, updated));
      }
      return true;
    } catch (cause) {
      setMutationError(getMutationError(cause, "카테고리 이름을 수정하지 못했습니다."));
      return false;
    } finally {
      setBusyKey("");
    }
  };

  const deleteCategory = async (category: CustomCategory) => {
    setBusyKey(`delete:${category.id}`);
    setMutationError("");
    try {
      if (isDemoMode) persistDemo(removeCustomCategory(categories, category.id));
      else {
        await deleteCustomCategory(category.id);
        setCategories((current) => removeCustomCategory(current, category.id));
      }
      return true;
    } catch {
      setMutationError("카테고리를 삭제하지 못했습니다.");
      return false;
    } finally {
      setBusyKey("");
    }
  };

  const toggleFavorite = async (category: CustomCategory) => {
    const nextFavorite = !category.isFavorite;
    if (nextFavorite && categories.filter((item) => item.type === category.type && item.isFavorite).length >= CUSTOM_CATEGORY_FAVORITE_LIMIT) {
      setMutationError(favoriteLimitError);
      return false;
    }

    setBusyKey(`favorite:${category.id}`);
    setMutationError("");
    try {
      if (isDemoMode) persistDemo(replaceCustomCategory(categories, { ...category, isFavorite: nextFavorite }));
      else {
        const updated = await setCustomCategoryFavorite(category.id, nextFavorite);
        setCategories((current) => replaceCustomCategory(current, updated));
      }
      return true;
    } catch (cause) {
      const error = getMutationError(cause, "즐겨찾기를 변경하지 못했습니다.");
      setMutationError(error);
      if (error === favoriteLimitError) await reload();
      return false;
    } finally {
      setBusyKey("");
    }
  };

  const recordUsedCategory = async (type: CustomCategoryType, name: string) => {
    if (isDemoMode) {
      const existing = categories.find((item) => item.type === type && item.name.trim().toLocaleLowerCase("en-US") === name.trim().toLocaleLowerCase("en-US"));
      const updated = { id: existing?.id ?? `demo-custom-category-${Date.now()}`, type, name: name.trim(), lastUsedAt: new Date().toISOString(), isFavorite: existing?.isFavorite ?? false };
      persistDemo([updated, ...categories.filter((item) => item.id !== updated.id)]);
      return updated;
    }

    const updated = await touchCustomCategory(type, name);
    setCategories((current) => {
      const existing = current.find((item) => item.id === updated.id);
      return [{ ...updated, isFavorite: updated.isFavorite || existing?.isFavorite || false }, ...current.filter((item) => item.id !== updated.id)];
    });
    return updated;
  };

  return { categories, isLoading, loadError, mutationError, busyKey, reload, addCategory, renameCategory, deleteCategory, toggleFavorite, recordUsedCategory };
};
