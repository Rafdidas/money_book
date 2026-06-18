import type { Expense } from "../types/expense";

export const getDateMap = (expenses: Expense[]) => {
  const map: Record<string, number> = {};

  expenses.forEach((item) => {
    map[item.date] = (map[item.date] || 0) + 1;
  });

  return map;
};

export const getMonthCalendarDays = (selectedDate: Date) => {
  const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const startDate = new Date(firstDay);
  const daysInMonth = new Date(firstDay.getFullYear(), firstDay.getMonth() + 1, 0).getDate();
  const calendarLength = Math.ceil((firstDay.getDay() + daysInMonth) / 7) * 7;

  startDate.setDate(firstDay.getDate() - firstDay.getDay());

  return Array.from({ length: Math.max(calendarLength, 35) }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
};
