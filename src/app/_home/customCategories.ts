import type { CustomCategory, CustomCategoryType } from "@/lib/api/customCategories";

const normalizeCategoryName = (name: string) => name.trim().toLocaleLowerCase("en-US");

export const getRecentCategoriesForType = (
  categories: CustomCategory[],
  type: CustomCategoryType,
): CustomCategory[] =>
  categories
    .filter((category) => category.type === type)
    .toSorted((left, right) => right.lastUsedAt.localeCompare(left.lastUsedAt))
    .slice(0, 5);

export const upsertRecentCategory = (
  categories: CustomCategory[],
  category: CustomCategory,
): CustomCategory[] => [
  category,
  ...categories.filter(
    (existingCategory) =>
      existingCategory.type !== category.type ||
      normalizeCategoryName(existingCategory.name) !== normalizeCategoryName(category.name),
  ),
];

export const removeCustomCategory = (
  categories: CustomCategory[],
  id: string,
): CustomCategory[] => categories.filter((category) => category.id !== id);
