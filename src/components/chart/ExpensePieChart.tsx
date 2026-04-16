"use client";

import type { Expense } from "@/types/expense";
import { getCategorySum } from "@/utils/chart";

const palette = ["#005048", "#003cab", "#84d5c8", "#88a2ff", "#d2f2ed"];

type Props = {
  expenses: Expense[];
};

export default function ExpensePieChart({ expenses }: Props) {
  const categoryData = getCategorySum(expenses);
  const entries = Object.entries(categoryData).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  return (
    <section className="expense-pie-chart">
      <h3 className="expense-pie-chart__title">카테고리별 지출</h3>
      {entries.length === 0 ? (
        <p className="expense-pie-chart__empty">아직 분석할 지출 데이터가 없습니다.</p>
      ) : (
        <div className="expense-pie-chart__list">
          {entries.map(([label, value], index) => {
            const ratio = total === 0 ? 0 : Math.round((value / total) * 100);
            const color = palette[index % palette.length];

            return (
              <div key={label} className="expense-pie-chart__row">
                <div className="expense-pie-chart__meta">
                  <span className="expense-pie-chart__label">
                    <span className="expense-pie-chart__dot" style={{ background: color }} />
                    {label}
                  </span>
                  <span className="expense-pie-chart__value">{ratio}%</span>
                </div>
                <div className="expense-pie-chart__track">
                  <div
                    className="expense-pie-chart__fill"
                    style={{ width: `${ratio}%`, background: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
