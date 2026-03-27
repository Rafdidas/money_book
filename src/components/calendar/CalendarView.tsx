"use client";

import type { Expense } from "@/types/expense";
import { getDateMap } from "@/utils/calendar";
import { formatDate } from "@/utils/date";
import styles from "./CalendarView.module.scss";

type Props = {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  expenses: Expense[];
};

const weekLabels = ["S", "M", "T", "W", "T", "F", "S"];

export default function CalendarView({
  selectedDate,
  setSelectedDate,
  expenses,
}: Props) {
  const dateMap = getDateMap(expenses);
  const currentMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const startDay = new Date(currentMonth);
  startDay.setDate(currentMonth.getDate() - currentMonth.getDay());

  const calendarDays = Array.from({ length: 28 }, (_, index) => {
    const day = new Date(startDay);
    day.setDate(startDay.getDate() + index);
    return day;
  });

  const selectedDateKey = formatDate(selectedDate);
  const selectedDayExpenses = expenses.filter((item) => item.date === selectedDateKey);
  const totalExpense = selectedDayExpenses
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  const maxExpense = selectedDayExpenses
    .filter((item) => item.type === "expense")
    .reduce((max, item) => Math.max(max, item.amount), 0);

  return (
    <section className={styles.calendarCard}>
      <div className={styles.calendarHeader}>
        <h3 className={styles.calendarTitle}>
          {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월
        </h3>
        <div className={styles.calendarNav}>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => {
              const next = new Date(selectedDate);
              next.setMonth(selectedDate.getMonth() - 1);
              setSelectedDate(next);
            }}
          >
            ‹
          </button>
          <button
            type="button"
            className={styles.navButton}
            onClick={() => {
              const next = new Date(selectedDate);
              next.setMonth(selectedDate.getMonth() + 1);
              setSelectedDate(next);
            }}
          >
            ›
          </button>
        </div>
      </div>

      <div className={styles.weekHeader}>
        {weekLabels.map((label, index) => (
          <div key={`${label}-${index}`} className={styles.weekCell}>
            {label}
          </div>
        ))}
      </div>

      <div className={styles.calendarGrid}>
        {calendarDays.map((date) => {
          const key = formatDate(date);
          const isSelected = key === selectedDateKey;
          const isMuted = date.getMonth() !== selectedDate.getMonth();
          const classNames = [styles.dayButton];

          if (isMuted) {
            classNames.push(styles.dayButtonMuted);
          }

          if (isSelected) {
            classNames.push(styles.dayButtonSelected);
          }

          return (
            <button
              key={key}
              type="button"
              className={classNames.join(" ")}
              onClick={() => setSelectedDate(date)}
            >
              {date.getDate()}
              {dateMap[key] ? <span className={styles.dayDot} /> : null}
            </button>
          );
        })}
      </div>

      <div className={styles.calendarStats}>
        <div className={styles.statRow}>
          <span>오늘 별 결제 지출</span>
          <strong>₩ {totalExpense.toLocaleString()}</strong>
        </div>
        <div className={styles.statRow}>
          <span>최대 지출일</span>
          <strong className={styles.statDanger}>₩ {maxExpense.toLocaleString()}</strong>
        </div>
      </div>
    </section>
  );
}
