"use client";

import { Button } from "@/components/ui/Button";
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
        <Button
          type="button"
          variant="subtle" size="sm"
          disabled={isDeleting}
          onClick={onClear}
        >
          선택 해제
        </Button>
        <Button
          type="button"
          variant="primary" size="sm" className="button--negative"
          disabled={isDeleting}
          onClick={onDelete}
        >
          {isDeleting ? "삭제 중..." : "선택 삭제"}
        </Button>
      </div>
    </div>
  );
}
