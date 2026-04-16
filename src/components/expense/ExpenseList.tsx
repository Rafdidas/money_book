import type { Expense } from "@/types/expense";

type Props = {
  items: Expense[];
  selectedDateLabel: string;
  onDelete: (id: string) => void;
  onEdit: (expense: Expense) => void;
};

const iconByType: Record<Expense["type"], string> = {
  expense: "🍽",
  income: "💸",
};

const iconToneByType: Record<Expense["type"], string> = {
  expense: "#d2f2ed",
  income: "#d9e3ff",
};

export default function ExpenseList({
  items,
  selectedDateLabel,
  onDelete,
  onEdit,
}: Props) {
  return (
    <section className="expense-list">
      <div className="expense-list__header">
        <div>
          <h2 className="expense-list__title">최근 내역</h2>
          <p className="expense-list__hint body--sm">{selectedDateLabel}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="expense-list__empty">선택한 날짜에 등록된 거래 내역이 없습니다.</p>
      ) : (
        <div className="expense-list__items">
          {items.map((item) => (
            <article key={item.id} className="expense-list__item">
              <div
                className="expense-list__icon"
                style={{ background: iconToneByType[item.type] }}
              >
                {iconByType[item.type]}
              </div>
              <div className="expense-list__body">
                <p className="expense-list__category bodyBold--md">{item.category}</p>
                <div className="expense-list__meta body--xs">
                  <span>{item.memo || "메모 없음"}</span>
                  <span>•</span>
                  <span>{item.date}</span>
                </div>
              </div>
              <div className="expense-list__amount-wrap">
                <span
                  className={`expense-list__amount ${
                    item.type === "expense"
                      ? "expense-list__amount-expense"
                      : "expense-list__amount-income"
                  }`}
                >
                  {item.type === "expense" ? "-" : "+"} ₩ {item.amount.toLocaleString()}
                </span>
                <div className="expense-list__actions">
                  <button
                    type="button"
                    className="expense-list__action label--md"
                    onClick={() => onEdit(item)}
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    className="expense-list__action label--md"
                    onClick={() => onDelete(item.id)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
