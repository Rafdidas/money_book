import type { Expense } from "../types/expense";

const savingsCategory = "적금";

export const getCategorySum = (expenses: Expense[]) => {
  const result: Record<string, number> = {};

  expenses.forEach((item) => {
    if (item.type === "expense" && item.category !== savingsCategory) {
      result[item.category] = (result[item.category] || 0) + item.amount;
    }
  });

  return result;
};
