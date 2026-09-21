import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DateField } from "./DateField";

describe("DateField", () => {
  it("값을 표시한다", () => {
    render(<DateField value="2026-09-18" onChange={() => {}} aria-label="날짜" />);
    expect(screen.getByLabelText("날짜")).toHaveValue("2026-09-18");
  });

  it("값이 바뀌면 onChange 를 문자열로 부른다", () => {
    const onChange = vi.fn();
    render(<DateField value="2026-09-18" onChange={onChange} aria-label="날짜" />);
    fireEvent.change(screen.getByLabelText("날짜"), { target: { value: "2026-09-20" } });
    expect(onChange).toHaveBeenCalledWith("2026-09-20");
  });

  it("빈 값을 허용한다", () => {
    const onChange = vi.fn();
    render(<DateField value="2026-09-18" onChange={onChange} aria-label="날짜" />);
    fireEvent.change(screen.getByLabelText("날짜"), { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("disabled 이면 입력이 비활성화된다", () => {
    render(<DateField value="2026-09-18" onChange={() => {}} aria-label="날짜" disabled />);
    expect(screen.getByLabelText("날짜")).toBeDisabled();
  });

  it("공통 컨트롤 클래스를 쓴다", () => {
    render(<DateField value="2026-09-18" onChange={() => {}} aria-label="날짜" />);
    expect(screen.getByLabelText("날짜").className).toContain("ui-form-control");
  });
});
