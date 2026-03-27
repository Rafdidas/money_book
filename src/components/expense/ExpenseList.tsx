import type { Expense } from "@/types/expense";
import styles from "./ExpenseList.module.scss";

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
    <section className={styles.listCard}>
      <div className={styles.listHeader}>
        <div>
          <h2 className={styles.listTitle}>최근 내역</h2>
          <p className={styles.listHint}>{selectedDateLabel}</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className={styles.emptyState}>선택한 날짜에 등록된 거래 내역이 없습니다.</p>
      ) : (
        <div className={styles.items}>
          {items.map((item) => (
            <article key={item.id} className={styles.item}>
              <div
                className={styles.itemIcon}
                style={{ background: iconToneByType[item.type] }}
              >
                {iconByType[item.type]}
              </div>
              <div className={styles.itemBody}>
                <p className={styles.itemCategory}>{item.category}</p>
                <div className={styles.itemMeta}>
                  <span>{item.memo || "메모 없음"}</span>
                  <span>•</span>
                  <span>{item.date}</span>
                </div>
              </div>
              <div className={styles.itemAmountWrap}>
                <span
                  className={`${styles.itemAmount} ${
                    item.type === "expense" ? styles.expenseAmount : styles.incomeAmount
                  }`}
                >
                  {item.type === "expense" ? "-" : "+"} ₩ {item.amount.toLocaleString()}
                </span>
                <div className={styles.itemActions}>
                  <button
                    type="button"
                    className={styles.actionButton}
                    onClick={() => onEdit(item)}
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    className={styles.actionButton}
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
