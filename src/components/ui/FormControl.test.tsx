import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Select, Textarea, TextInput } from "./FormControl";

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

  it("Textarea 는 공통 클래스와 ui-textarea 를 출력하고 값을 그대로 전달한다", () => {
    const onChange = vi.fn();
    render(<Textarea aria-label="메모" value="내용" onChange={onChange} className="extra" />);
    const el = screen.getByRole("textbox", { name: "메모" });
    expect(el).toHaveClass("ui-form-control", "ui-textarea", "has-value", "extra");
    expect(el).toHaveValue("내용");
    fireEvent.change(el, { target: { value: "수정" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("Textarea 는 aria-invalid 이면 is-invalid, disabled 를 전달한다", () => {
    render(<Textarea aria-label="메모" aria-invalid="true" disabled />);
    const el = screen.getByRole("textbox", { name: "메모" });
    expect(el).toHaveClass("is-invalid");
    expect(el).toHaveAttribute("aria-invalid", "true");
    expect(el).toBeDisabled();
  });
});
