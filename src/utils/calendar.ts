import type { Expense } from "../types/expense";

export const getDateMap = (expenses: Expense[]) => {
  const map: Record<string, number> = {};

  expenses.forEach((item) => {
    map[item.date] = (map[item.date] || 0) + 1;
  });

  return map;
};
