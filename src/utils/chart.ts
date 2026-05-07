import type { Expense } from "../types/expense";

const isSavingsCategory = (category: string) => category.includes("적금");

export const getCategorySum = (expenses: Expense[]) => {
  const result: Record<string, number> = {};

  expenses.forEach((item) => {
    if (item.type === "expense" && !isSavingsCategory(item.category)) {
      result[item.category] = (result[item.category] || 0) + item.amount;
    }
  });

  return result;
};
