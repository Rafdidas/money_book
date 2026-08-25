import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DetailBulkActionBar from "./DetailBulkActionBar";

describe("DetailBulkActionBar", () => {
  it("shows the selected count and total and calls both actions", () => {
    const onClear = vi.fn();
    const onDelete = vi.fn();

    render(
      <DetailBulkActionBar
        count={3}
        total={150000}
        isDeleting={false}
        onClear={onClear}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByText("3건 선택 · 합계 150,000원")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "선택 해제" }));
    fireEvent.click(screen.getByRole("button", { name: "선택 삭제" }));
    expect(onClear).toHaveBeenCalledOnce();
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it("disables actions while deletion is in progress", () => {
    render(
      <DetailBulkActionBar
        count={2}
        total={30000}
        isDeleting
        onClear={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "선택 해제" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "삭제 중..." })).toBeDisabled();
  });
});
