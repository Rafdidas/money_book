"use client";

import { useState } from "react";
import type { CustomCategory, CustomCategoryType } from "@/lib/api/customCategories";
import styles from "./CategoryManager.module.scss";

const typeLabels: Record<CustomCategoryType, string> = {
  expense: "지출",
  income: "수입",
  savings: "저축",
  investment: "투자",
};

type Props = {
  categories: CustomCategory[];
  onAdd: (type: CustomCategoryType, name: string) => Promise<boolean>;
  onDelete: (category: CustomCategory) => Promise<boolean>;
  onToggleFavorite: (category: CustomCategory) => Promise<boolean>;
};

export default function CategoryManager({ categories, onAdd, onDelete, onToggleFavorite }: Props) {
  const [type, setType] = useState<CustomCategoryType>("expense");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const saved = await onAdd(type, name);
    if (saved) setName("");
    setIsSubmitting(false);
  };

  return (
    <section aria-label="사용자 카테고리 관리">
      <p>자주 쓰는 카테고리는 유형별 최대 5개까지 지정할 수 있어요.</p>
      <form onSubmit={submit}>
        <label>
          유형
          <select value={type} onChange={(event) => setType(event.target.value as CustomCategoryType)}>
            {Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>
          카테고리 이름
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={30} required />
        </label>
        <button type="submit" disabled={isSubmitting}>{isSubmitting ? "추가 중" : "카테고리 추가"}</button>
      </form>
      {(Object.keys(typeLabels) as CustomCategoryType[]).map((categoryType) => (
        <section key={categoryType} aria-label={`${typeLabels[categoryType]} 카테고리`}>
          <h3>{typeLabels[categoryType]}</h3>
          <ul>
            {categories.filter((category) => category.type === categoryType).map((category) => (
              <li key={category.id}>
                <span>{category.name}</span>
                <button type="button" aria-pressed={category.isFavorite} onClick={() => void onToggleFavorite(category)}>
                  {category.isFavorite ? "★ 자주 씀" : "☆ 자주 씀"}
                </button>
                <button type="button" onClick={() => void onDelete(category)}>삭제</button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </section>
  );
}
