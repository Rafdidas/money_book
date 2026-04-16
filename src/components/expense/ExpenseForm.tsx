"use client";

import type { Expense } from "@/types/expense";
import { useState } from "react";

type ExpenseFormData = Pick<Expense, "amount" | "category" | "memo" | "date" | "type">;

type Props = {
  selectedDate: string;
  initialData?: Expense | null;
  onSubmit: (data: ExpenseFormData) => Promise<void>;
  onCancel: () => void;
  onDelete?: (id: string) => Promise<void>;
};

const categoryOptions = ["식비", "교통", "쇼핑", "문화생활", "급여", "기타"];

export default function ExpenseForm({
  selectedDate,
  initialData,
  onSubmit,
  onCancel,
  onDelete,
}: Props) {
  const [amount, setAmount] = useState(() => (initialData ? String(initialData.amount) : ""));
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
    <section className="expense-form">
      <div className="expense-form__header">
        <h2 className="expense-form__title">{isEditMode ? "내역 수정" : "내역 추가"}</h2>
        {isEditMode ? (
          <button
            type="button"
            className="expense-form__delete bodyBold--sm"
            onClick={handleDelete}
            disabled={isSubmitting}
          >
            삭제
          </button>
        ) : null}
      </div>

      <div className="expense-form__body">
        <div className="expense-form__toggle">
          <button
            type="button"
            className={`expense-form__toggle-button bodyBold--md ${type === "expense" ? "is-active" : ""}`}
            onClick={() => setType("expense")}
          >
            지출
          </button>
          <button
            type="button"
            className={`expense-form__toggle-button bodyBold--md ${type === "income" ? "is-active" : ""}`}
            onClick={() => setType("income")}
          >
            수입
          </button>
        </div>

        <div className="expense-form__field-stack">
          <div className="expense-form__field-group">
            <label className="expense-form__field-label label--md" htmlFor="expense-amount">
              금액
            </label>
            <input
              id="expense-amount"
              className="expense-form__field-control expense-form__amount-input body--md"
              type="number"
              placeholder="0"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>

          <div className="expense-form__field-row">
            <div className="expense-form__field-group">
              <label className="expense-form__field-label label--md" htmlFor="expense-category">
                카테고리
              </label>
              <select
                id="expense-category"
                className="expense-form__field-control body--md"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="expense-form__field-group">
              <label className="expense-form__field-label label--md" htmlFor="expense-date">
                날짜
              </label>
              <input
                id="expense-date"
                className="expense-form__field-control body--md"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
          </div>

          <div className="expense-form__field-group">
            <label className="expense-form__field-label label--md" htmlFor="expense-memo">
              메모
            </label>
            <input
              id="expense-memo"
              className="expense-form__field-control body--md"
              type="text"
              placeholder="상세 내용을 입력하세요"
              value={memo}
              onChange={(event) => setMemo(event.target.value)}
            />
          </div>
        </div>

        <div className="expense-form__footer">
          <button
            type="button"
            className="expense-form__secondary-action bodyBold--md"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            취소
          </button>

          <button
            type="button"
            className="expense-form__primary-action bodyBold--md"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "처리 중..." : "저장하기"}
          </button>
        </div>
      </div>
    </section>
  );
}
