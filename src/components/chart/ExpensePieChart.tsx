"use client";

import type { Expense } from "@/types/expense";
import { getCategorySum } from "@/utils/chart";
import styles from "./ExpensePieChart.module.scss";

const palette = ["#005048", "#003cab", "#84d5c8", "#88a2ff", "#d2f2ed"];

type Props = {
  expenses: Expense[];
};

export default function ExpensePieChart({ expenses }: Props) {
  const categoryData = getCategorySum(expenses);
  const entries = Object.entries(categoryData).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);

  return (
    <section className={styles.chartCard}>
      <h3 className={styles.chartTitle}>카테고리별 지출</h3>
      {entries.length === 0 ? (
        <p className={styles.emptyState}>아직 분석할 지출 데이터가 없습니다.</p>
      ) : (
        <div className={styles.chartList}>
          {entries.map(([label, value], index) => {
            const ratio = total === 0 ? 0 : Math.round((value / total) * 100);
            const color = palette[index % palette.length];

            return (
              <div key={label} className={styles.chartRow}>
                <div className={styles.chartMeta}>
                  <span className={styles.chartLabel}>
                    <span className={styles.chartDot} style={{ background: color }} />
                    {label}
                  </span>
                  <span className={styles.chartValue}>{ratio}%</span>
                </div>
                <div className={styles.chartTrack}>
                  <div
                    className={styles.chartFill}
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
