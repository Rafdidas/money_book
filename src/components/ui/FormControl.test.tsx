import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Select, TextInput } from "./FormControl";

describe("FormControl", () => {
  it("renders a text input with the shared control class and reports typed values", () => {
    const onChange = vi.fn();
    render(<TextInput aria-label="금액" className="main-overview--control" onChange={onChange} />);

    const input = screen.getByRole("textbox", { name: "금액" });
    expect(input).toHaveClass("ui-form-control", "main-overview--control");

    fireEvent.change(input, { target: { value: "15,000" } });
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("renders a native select with the shared control class and error state", () => {
    render(
      <Select aria-label="카테고리" aria-invalid="true">
        <option value="food">식비</option>
      </Select>,
    );

    const select = screen.getByRole("combobox", { name: "카테고리" });
    expect(select).toHaveClass("ui-form-control", "is-invalid");
    expect(select).toHaveAttribute("aria-invalid", "true");
  });

  it("marks a populated control so its entered value can be emphasized", () => {
    render(<TextInput aria-label="메모" value="점심" readOnly />);

    expect(screen.getByRole("textbox", { name: "메모" })).toHaveClass("has-value");
  });
});
