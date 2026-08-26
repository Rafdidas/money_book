import type { CustomCategory, CustomCategoryType } from "@/lib/api/customCategories";

const normalizeCustomCategoryName = (name: string) => name.trim().toLocaleLowerCase("en-US");

export const CUSTOM_CATEGORY_FAVORITE_LIMIT = 5;

export const getCategoriesForType = (categories: CustomCategory[], type: CustomCategoryType) =>
  categories
    .filter((category) => category.type === type)
    .toSorted((left, right) => {
      if (left.isFavorite !== right.isFavorite) return left.isFavorite ? -1 : 1;
      return right.lastUsedAt.localeCompare(left.lastUsedAt);
    });

export const getFavoriteCategoriesForType = (categories: CustomCategory[], type: CustomCategoryType) =>
  getCategoriesForType(categories, type)
    .filter((category) => category.isFavorite)
    .slice(0, CUSTOM_CATEGORY_FAVORITE_LIMIT);

type ValidateCustomCategoryNameOptions = {
  categories: CustomCategory[];
  type: CustomCategoryType;
  name: string;
  defaultNames: string[];
  excludeId?: string;
};

export const getCustomCategoryNameError = ({
  categories,
  type,
  name,
  defaultNames,
  excludeId,
}: ValidateCustomCategoryNameOptions): string => {
  const normalizedName = normalizeCustomCategoryName(name);
  if (!normalizedName) return "카테고리 이름을 입력해주세요.";
  if (defaultNames.some((defaultName) => normalizeCustomCategoryName(defaultName) === normalizedName)) {
    return "기본 카테고리와 같은 이름은 사용할 수 없습니다.";
  }
  if (categories.some((category) => category.id !== excludeId && category.type === type && normalizeCustomCategoryName(category.name) === normalizedName)) {
    return "이미 등록된 카테고리입니다.";
  }
  return "";
};

export const replaceCustomCategory = (categories: CustomCategory[], updatedCategory: CustomCategory) =>
  categories.map((category) => (category.id === updatedCategory.id ? updatedCategory : category));

export const removeCustomCategory = (categories: CustomCategory[], id: string) =>
  categories.filter((category) => category.id !== id);
