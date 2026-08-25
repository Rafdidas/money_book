"use client";

import { formatWon } from "@/utils/money";

type DetailBulkActionBarProps = {
  count: number;
  total: number;
  isDeleting: boolean;
  onClear: () => void;
  onDelete: () => void;
};

export default function DetailBulkActionBar({
  count,
  total,
  isDeleting,
  onClear,
  onDelete,
}: DetailBulkActionBarProps) {
  return (
    <div className="detail-bulk-actions" aria-live="polite">
      <strong className="detail-bulk-actions__summary">
        {count}건 선택 · 합계 {formatWon(total)}
      </strong>
      <div className="detail-bulk-actions__buttons">
        <button
          type="button"
          className="button button--sm button--subtle"
          disabled={isDeleting}
          onClick={onClear}
        >
          선택 해제
        </button>
        <button
          type="button"
          className="button button--sm button--primary button--negative"
          disabled={isDeleting}
          onClick={onDelete}
        >
          {isDeleting ? "삭제 중..." : "선택 삭제"}
        </button>
      </div>
    </div>
  );
}
