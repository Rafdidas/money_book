import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Card } from "./Card";

describe("Card", () => {
  it("기본 tone 과 padding 클래스를 출력한다", () => {
    render(<Card>내용</Card>);
    const card = screen.getByText("내용");
    expect(card.className).toContain("ui-card");
    expect(card.className).not.toContain("ui-card--strong");
    expect(card.className).not.toContain("ui-card--compact");
  });

  it("strong tone 과 compact padding 을 반영한다", () => {
    render(
      <Card tone="strong" padding="compact">
        내용
      </Card>,
    );
    const card = screen.getByText("내용");
    expect(card.className).toContain("ui-card--strong");
    expect(card.className).toContain("ui-card--compact");
  });

  it("as 로 요소를 바꾼다", () => {
    render(<Card as="section">내용</Card>);
    expect(screen.getByText("내용").tagName).toBe("SECTION");
  });

  it("전달한 className 을 유지한다", () => {
    render(<Card className="main-overview--card">내용</Card>);
    expect(screen.getByText("내용").className).toContain("main-overview--card");
  });
});
