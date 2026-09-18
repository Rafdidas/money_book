import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Tabs } from "./Tabs";

const items = [
  { value: "create", label: "추가" },
  { value: "edit", label: "수정" },
];

describe("Tabs", () => {
  it("announces the selected tab and reports a user selection", () => {
    const onValueChange = vi.fn();
    render(<Tabs ariaLabel="내역 입력 모드" items={items} value="create" onValueChange={onValueChange} />);

    const createTab = screen.getByRole("tab", { name: "추가" });
    const editTab = screen.getByRole("tab", { name: "수정" });
    expect(createTab).toHaveAttribute("aria-selected", "true");
    expect(editTab).toHaveAttribute("aria-selected", "false");

    fireEvent.click(editTab);
    expect(onValueChange).toHaveBeenCalledWith("edit");
  });

  it("moves focus and selection with arrow keys", () => {
    const onValueChange = vi.fn();
    render(<Tabs ariaLabel="내역 입력 모드" items={items} value="create" onValueChange={onValueChange} />);

    const createTab = screen.getByRole("tab", { name: "추가" });
    fireEvent.keyDown(createTab, { key: "ArrowRight" });

    expect(screen.getByRole("tab", { name: "수정" })).toHaveFocus();
    expect(onValueChange).toHaveBeenCalledWith("edit");
  });
});
