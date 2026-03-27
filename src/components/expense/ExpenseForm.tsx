"use client";

import type { Expense } from "@/types/expense";
import { useState } from "react";
import styles from "./ExpenseForm.module.scss";

type ExpenseFormData = Pick<Expense, "amount" | "category" | "memo" | "date" | "type">;

type Props = {
  selectedDate: string;
  initialData?: Expense | null;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  onCancel: () => void;
  onDelete?: (id: string) => Promise<void>;
};

const categoryOptions = ["식비", "교통", "쇼핑", "문화", "급여", "기타"];

export default function ExpenseForm({
  selectedDate,
  initialData,
  onSubmit,
  onCancel,
  onDelete,
}: Props) {
  const [amount, setAmount] = useState(() =>
    initialData ? String(initialData.amount) : "",
  );
  const [category, setCategory] = useState(() => initialData?.category ?? categoryOptions[0]);
  const [memo, setMemo] = useState(() => initialData?.memo ?? "");
  const [date, setDate] = useState(() => initialData?.date ?? selectedDate);
  const [type, setType] = useState<Expense["type"]>(() => initialData?.type ?? "expense");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = Boolean(initialData);

  const handleSubmit = async () => {
    if (!amount) {
      alert("금액을 입력해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        amount: Number(amount),
        category,
        memo,
        date,
        type,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "저장 중 오류가 발생했습니다.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData || !onDelete) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onDelete(initialData.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "삭제 중 오류가 발생했습니다.";
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.formShell}>
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>
          {isEditMode ? "거래 내역 수정" : "새 거래 내역 등록"}
        </h2>
        <button type="button" className={styles.closeButton} onClick={onCancel}>
          ×
        </button>
      </div>

      <div className={styles.formBody}>
        <div className={styles.toggle}>
          <button
            type="button"
            className={`${styles.toggleButton} ${type === "expense" ? styles.toggleActive : ""}`}
            onClick={() => setType("expense")}
          >
            지출
          </button>
          <button
            type="button"
            className={`${styles.toggleButton} ${type === "income" ? styles.toggleActive : ""}`}
            onClick={() => setType("income")}
          >
            수입
          </button>
        </div>

        <div className={styles.fieldStack}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="expense-amount">
              금액
            </label>
            <div className={styles.amountWrap}>
              <span className={styles.amountSymbol}>₩</span>
              <input
                id="expense-amount"
                className={`${styles.fieldInput} ${styles.amountInput}`}
                type="number"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <span className={styles.amountSuffix}>KRW</span>
            </div>
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="expense-date">
                날짜
              </label>
              <input
                id="expense-date"
                className={styles.fieldInput}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel} htmlFor="expense-category">
                카테고리
              </label>
              <select
                id="expense-category"
                className={styles.fieldSelect}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="expense-memo">
              메모
            </label>
            <textarea
              id="expense-memo"
              className={styles.fieldTextarea}
              placeholder="거래에 대한 메모를 남겨주세요."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.footerActions}>
          <button
            type="button"
            className={styles.primaryAction}
            disabled={isSubmitting}
            onClick={handleSubmit}
          >
            {isSubmitting ? "처리 중..." : isEditMode ? "수정 완료" : "저장하기"}
          </button>

          {isEditMode ? (
            <div className={styles.dualActions}>
              <button
                type="button"
                className={styles.dangerAction}
                disabled={isSubmitting}
                onClick={handleDelete}
              >
                삭제
              </button>
              <button
                type="button"
                className={styles.secondaryAction}
                disabled={isSubmitting}
                onClick={onCancel}
              >
                취소
              </button>
            </div>
          ) : (
            <div className={styles.dualActions}>
              <button
                type="button"
                className={styles.secondaryAction}
                disabled={isSubmitting}
                onClick={onCancel}
              >
                취소
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
