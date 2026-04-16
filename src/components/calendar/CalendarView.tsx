"use client";

import type { Expense } from "@/types/expense";
import { getDateMap } from "@/utils/calendar";
import { formatDate } from "@/utils/date";

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
    <section className="calendar-view">
      <div className="calendar-view__header">
        <h3 className="calendar-view__title title--sm">
          {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월
        </h3>
        <div className="calendar-view__nav">
          <button
            type="button"
            className="calendar-view__nav-button bodyBold--md"
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
            className="calendar-view__nav-button bodyBold--md"
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

      <div className="calendar-view__week-header">
        {weekLabels.map((label, index) => (
          <div key={`${label}-${index}`} className="calendar-view__week-cell label--sm">
            {label}
          </div>
        ))}
      </div>

      <div className="calendar-view__grid">
        {calendarDays.map((date) => {
          const key = formatDate(date);
          const isSelected = key === selectedDateKey;
          const isMuted = date.getMonth() !== selectedDate.getMonth();
          const classNames = ["calendar-view__day-button"];

          if (isMuted) {
            classNames.push("is-muted");
          }

          if (isSelected) {
            classNames.push("is-selected");
          }

          return (
            <button
              key={key}
              type="button"
              className={classNames.join(" ")}
              onClick={() => setSelectedDate(date)}
            >
              {date.getDate()}
              {dateMap[key] ? <span className="calendar-view__day-dot" /> : null}
            </button>
          );
        })}
      </div>

      <div className="calendar-view__stats">
        <div className="calendar-view__stat-row">
          <span>오늘 별 결제 지출</span>
          <strong>₩ {totalExpense.toLocaleString()}</strong>
        </div>
        <div className="calendar-view__stat-row">
          <span>최대 지출일</span>
          <strong className="calendar-view__stat-danger">₩ {maxExpense.toLocaleString()}</strong>
        </div>
      </div>
    </section>
  );
}
