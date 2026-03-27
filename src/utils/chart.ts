import type { Expense } from "../types/expense";

export const getCategorySum = (expenses: Expense[]) => {
  const result: Record<string, number> = {};

  expenses.forEach((item) => {
    if (item.type === "expense") {
      result[item.category] = (result[item.category] || 0) + item.amount;
    }
  });

  return result;
};
