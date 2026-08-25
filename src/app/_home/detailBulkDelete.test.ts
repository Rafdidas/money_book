import { describe, expect, it } from "vitest";
import type { Expense } from "@/types/expense";
import {
  getDetailBulkSelectionSummary,
  getSelectableDetailIds,
  pruneSelectedDetailIds,
} from "./detailBulkDelete";

const expense = (
  id: string,
  amount: number,
  entryType: Expense["entry_type"] = "expense",
): Expense => ({
  id,
  user_id: "user-1",
  amount,
  type: "expense",
  entry_type: entryType,
  category: entryType === "savings" ? "비상금" : "식비",
  memo: "",
  date: "2026-08-10",
  created_at: "2026-08-10T00:00:00.000Z",
});

describe("detail bulk delete selection", () => {
  it("selects only detail items also present in the editable list", () => {
    const directExpense = expense("expense-1", 10000);
    const directSavings = expense("savings-1", 50000, "savings");
    const scheduledPayment = expense("payment-1", 30000, "savings");

    expect(
      getSelectableDetailIds(
        [directExpense, directSavings, scheduledPayment],
        [directExpense, directSavings],
      ),
    ).toEqual(["expense-1", "savings-1"]);
  });

  it("drops selected ids that are no longer selectable", () => {
    expect(
      [...pruneSelectedDetailIds(new Set(["expense-1", "old-id"]), new Set(["expense-1"]))],
    ).toEqual(["expense-1"]);
  });

  it("counts and sums only selected items still present in the list", () => {
    expect(
      getDetailBulkSelectionSummary(
        [expense("expense-1", 10000), expense("savings-1", 50000, "savings")],
        new Set(["expense-1", "savings-1", "missing-id"]),
      ),
    ).toEqual({ count: 2, total: 60000 });
  });
});
