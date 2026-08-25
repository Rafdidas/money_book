import type { Expense } from "@/types/expense";

type DetailBulkItem = Pick<Expense, "id" | "amount">;

export type DetailBulkSelectionSummary = {
  count: number;
  total: number;
};

export const getSelectableDetailIds = (
  detailItems: readonly DetailBulkItem[],
  editableItems: readonly DetailBulkItem[],
) => {
  const editableIds = new Set(editableItems.map((item) => item.id));
  return detailItems.filter((item) => editableIds.has(item.id)).map((item) => item.id);
};

export const pruneSelectedDetailIds = (
  selectedIds: ReadonlySet<string>,
  selectableIds: ReadonlySet<string>,
) => new Set([...selectedIds].filter((id) => selectableIds.has(id)));

export const getDetailBulkSelectionSummary = (
  items: readonly DetailBulkItem[],
  selectedIds: ReadonlySet<string>,
): DetailBulkSelectionSummary => {
  const selectedItems = items.filter((item) => selectedIds.has(item.id));

  return {
    count: selectedItems.length,
    total: selectedItems.reduce((sum, item) => sum + item.amount, 0),
  };
};
