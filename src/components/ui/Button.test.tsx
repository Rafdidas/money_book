import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Button } from "./Button";

describe("Button", () => {
  it("variant 와 size 를 기존 클래스로 출력한다", () => {
    render(<Button variant="primary" size="md">저장</Button>);
    const button = screen.getByRole("button", { name: "저장" });
    expect(button.className).toContain("button");
    expect(button.className).toContain("button--primary");
    expect(button.className).toContain("button--md");
  });

  it("full 을 주면 button--full 을 붙인다", () => {
    render(<Button full>저장</Button>);
    expect(screen.getByRole("button", { name: "저장" }).className).toContain("button--full");
  });

  it("기본값은 md 이고 variant 클래스를 붙이지 않는다", () => {
    render(<Button>확인</Button>);
    const className = screen.getByRole("button", { name: "확인" }).className;
    expect(className).toContain("button--md");
    expect(className).not.toContain("button--default");
  });

  it("disabled 이면 클릭 핸들러가 호출되지 않는다", () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>삭제</Button>);
    fireEvent.click(screen.getByRole("button", { name: "삭제" }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("전달한 className 을 유지한다", () => {
    render(<Button className="main-overview--submit">제출</Button>);
    expect(screen.getByRole("button", { name: "제출" }).className).toContain(
      "main-overview--submit",
    );
  });

  it("기본 type 은 button 이다", () => {
    render(<Button>확인</Button>);
    expect(screen.getByRole("button", { name: "확인" })).toHaveAttribute("type", "button");
  });

  it("header/banner variant 를 기존 클래스로 출력한다", () => {
    render(
      <>
        <Button variant="header-primary">가</Button>
        <Button variant="header-ghost">나</Button>
        <Button variant="banner">다</Button>
      </>,
    );
    expect(screen.getByRole("button", { name: "가" }).className).toContain("button--header-primary");
    expect(screen.getByRole("button", { name: "나" }).className).toContain("button--header-ghost");
    expect(screen.getByRole("button", { name: "다" }).className).toContain("button--banner");
  });

  it("icon 과 iconOnly 클래스를 출력한다", () => {
    render(
      <>
        <Button icon="left" size="lg">왼쪽</Button>
        <Button icon="right">오른쪽</Button>
        <Button iconOnly aria-label="닫기" />
      </>,
    );
    expect(screen.getByRole("button", { name: "왼쪽" }).className).toContain("button--icon-left");
    expect(screen.getByRole("button", { name: "오른쪽" }).className).toContain("button--icon-right");
    expect(screen.getByRole("button", { name: "닫기" }).className).toContain("button--icon-only");
  });
});
