"use client";

import { useState } from "react";
import type { CustomCategory, CustomCategoryType } from "@/lib/api/customCategories";
import { CUSTOM_CATEGORY_FAVORITE_LIMIT, getCategoriesForType } from "@/lib/customCategoryRules";

const typeLabels: Record<CustomCategoryType, string> = {
  expense: "지출",
  income: "수입",
  savings: "저축",
  investment: "투자",
};

type Props = {
  headingId?: string;
  heading?: string;
  categories: CustomCategory[];
  selectedType: CustomCategoryType;
  isLoading: boolean;
  loadError: string;
  mutationError: string;
  busyKey: string;
  onTypeChange: (type: CustomCategoryType) => void;
  onRetry: () => void;
  onAdd: (type: CustomCategoryType, name: string) => Promise<boolean>;
  onRename: (category: CustomCategory, name: string) => Promise<boolean>;
  onDelete: (category: CustomCategory) => Promise<boolean>;
  onToggleFavorite: (category: CustomCategory) => Promise<boolean>;
  onUse?: (category: CustomCategory) => void;
};

export default function CategoryManager({
  headingId,
  heading = "카테고리 관리",
  categories,
  selectedType,
  isLoading,
  loadError,
  mutationError,
  busyKey,
  onTypeChange,
  onRetry,
  onAdd,
  onRename,
  onDelete,
  onToggleFavorite,
  onUse,
}: Props) {
  const [newName, setNewName] = useState("");
  const [formError, setFormError] = useState("");
  const [editingCategory, setEditingCategory] = useState<CustomCategory | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteCandidate, setDeleteCandidate] = useState<CustomCategory | null>(null);
  const selectedCategories = getCategoriesForType(categories, selectedType);
  const favoriteCount = selectedCategories.filter((category) => category.isFavorite).length;

  const submitNewCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) {
      setFormError("카테고리 이름을 입력해주세요.");
      return;
    }

    setFormError("");
    if (await onAdd(selectedType, name)) setNewName("");
  };

  const saveRename = async () => {
    if (!editingCategory) return;
    if (await onRename(editingCategory, editingName.trim())) setEditingCategory(null);
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    if (await onDelete(deleteCandidate)) setDeleteCandidate(null);
  };

  return (
    <section className="category-manager" aria-labelledby={headingId}>
      <div className="category-manager__header">
        <h2 id={headingId} className="title--sm">{heading}</h2>
        <p className="caption--md">자주 쓰는 카테고리는 유형별 최대 {CUSTOM_CATEGORY_FAVORITE_LIMIT}개까지 지정할 수 있어요.</p>
      </div>

      <div className="category-manager__tabs" role="tablist" aria-label="카테고리 유형">
        {(Object.keys(typeLabels) as CustomCategoryType[]).map((type) => (
          <button key={type} type="button" aria-pressed={selectedType === type} className={selectedType === type ? "category-manager__tab category-manager__tab--active" : "category-manager__tab"} onClick={() => onTypeChange(type)}>
            {typeLabels[type]} 카테고리
          </button>
        ))}
      </div>

      {loadError ? <p className="category-manager__error" role="alert">{loadError} <button type="button" onClick={onRetry}>다시 시도</button></p> : null}
      {mutationError ? <p className="category-manager__error" role="alert">{mutationError}</p> : null}

      <form className="category-manager__form" onSubmit={(event) => void submitNewCategory(event)}>
        <label className="category-manager__field">
          <span className="label--md">새 카테고리 이름</span>
          <input className="category-manager__control" value={newName} onChange={(event) => setNewName(event.target.value)} maxLength={30} aria-invalid={Boolean(formError)} />
        </label>
        <button type="submit" className="button button--md" disabled={busyKey === `add:${selectedType}`}>{busyKey === `add:${selectedType}` ? "추가 중" : "카테고리 추가"}</button>
      </form>
      {formError ? <p className="category-manager__error" role="alert">{formError}</p> : null}

      {isLoading ? <p className="caption--md">카테고리를 불러오는 중입니다.</p> : null}
      {!isLoading ? (
        <ul className="category-manager__list" aria-label={`${typeLabels[selectedType]} 카테고리 목록`}>
          {selectedCategories.map((category) => {
            const isEditing = editingCategory?.id === category.id;
            const disableFavorite = !category.isFavorite && favoriteCount >= CUSTOM_CATEGORY_FAVORITE_LIMIT;
            return (
              <li key={category.id} className="category-manager__item">
                {isEditing ? (
                  <>
                    <label className="category-manager__edit-field">
                      <span className="a11y-hidden">{category.name} 카테고리 이름</span>
                      <input className="category-manager__control" value={editingName} onChange={(event) => setEditingName(event.target.value)} maxLength={30} />
                    </label>
                    <button type="button" className="button button--sm" onClick={() => void saveRename()} disabled={busyKey === `rename:${category.id}`}>이름 저장</button>
                    <button type="button" className="button button--sm button--outline" onClick={() => setEditingCategory(null)}>수정 취소</button>
                  </>
                ) : (
                  <>
                    <span className="category-manager__name">{category.name}</span>
                    {onUse ? <button type="button" className="button button--sm button--outline" onClick={() => onUse(category)} aria-label={`${category.name} 카테고리 사용`}>사용</button> : null}
                    <button type="button" className="button button--sm button--outline" onClick={() => { setEditingCategory(category); setEditingName(category.name); }} aria-label={`${category.name} 카테고리 이름 수정`}>수정</button>
                    <button type="button" className="button button--sm button--outline" aria-pressed={category.isFavorite} aria-label={`${category.name} 자주 쓰기 ${category.isFavorite ? "해제" : "지정"}`} onClick={() => void onToggleFavorite(category)} disabled={disableFavorite || busyKey === `favorite:${category.id}`}>{category.isFavorite ? "자주 씀" : "자주 쓰기"}</button>
                    <button type="button" className="button button--sm button--outline" onClick={() => setDeleteCandidate(category)} aria-label={`${category.name} 카테고리 삭제`}>삭제</button>
                  </>
                )}
              </li>
            );
          })}
          {!selectedCategories.length ? <li className="caption--md">등록한 카테고리가 없습니다.</li> : null}
        </ul>
      ) : null}

      {deleteCandidate ? (
        <div className="category-manager__confirm" role="alertdialog" aria-label="카테고리 삭제 확인">
          <p><strong>{deleteCandidate.name}</strong> 카테고리를 삭제할까요?</p>
          <p className="caption--md">기존 거래 내역은 변경되지 않습니다.</p>
          <div className="category-manager__actions">
            <button type="button" className="button button--sm button--outline" onClick={() => setDeleteCandidate(null)}>취소</button>
            <button type="button" className="button button--sm" onClick={() => void confirmDelete()} disabled={busyKey === `delete:${deleteCandidate.id}`}>삭제</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
