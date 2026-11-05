import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { MultiSelect } from "./MultiSelect";

const options = [
  { value: "a", label: "사과" },
  { value: "b", label: "바나나" },
  { value: "c", label: "체리" },
];

function Harness({ initial = [], onChange }: { initial?: string[]; onChange?: (value: string[]) => void }) {
  const [value, setValue] = useState<string[]>(initial);
  return (
    <MultiSelect
      ariaLabel="과일 선택"
      options={options}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
      placeholder="전체"
    />
  );
}

describe("MultiSelect", () => {
  it("opens the listbox on focus and toggles an option on click", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    const input = screen.getByRole("combobox", { name: "과일 선택" });
    fireEvent.focus(input);
    expect(input).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(screen.getByRole("option", { name: "바나나" }));
    expect(onChange).toHaveBeenLastCalledWith(["b"]);
    expect(screen.getByRole("option", { name: "바나나" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: "바나나 선택 해제" })).toBeInTheDocument();
  });

  it("filters options by query and selects the active one with Enter", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    const input = screen.getByRole("combobox", { name: "과일 선택" });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "체" } });

    expect(screen.getAllByRole("option")).toHaveLength(1);
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenLastCalledWith(["c"]);
    expect(input).toHaveValue("");
  });

  it("moves the active option with arrow keys", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);

    const input = screen.getByRole("combobox", { name: "과일 선택" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.getAttribute("aria-activedescendant")).toBe(screen.getByRole("option", { name: "바나나" }).id);

    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenLastCalledWith(["b"]);
  });

  it("removes the last chip with Backspace on an empty query and closes with Escape", () => {
    const onChange = vi.fn();
    render(<Harness initial={["a", "c"]} onChange={onChange} />);

    const input = screen.getByRole("combobox", { name: "과일 선택" });
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "Backspace" });
    expect(onChange).toHaveBeenLastCalledWith(["a"]);

    fireEvent.keyDown(input, { key: "Escape" });
    expect(input).toHaveAttribute("aria-expanded", "false");
  });

  it("removes a chip and clears all selections", () => {
    const onChange = vi.fn();
    render(<Harness initial={["a", "b"]} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "사과 선택 해제" }));
    expect(onChange).toHaveBeenLastCalledWith(["b"]);

    fireEvent.click(screen.getByRole("button", { name: "선택 모두 해제" }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("shows the empty message when nothing matches", () => {
    render(<Harness />);

    const input = screen.getByRole("combobox", { name: "과일 선택" });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "포도" } });

    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText("일치하는 항목이 없습니다.")).toBeInTheDocument();
  });
});
