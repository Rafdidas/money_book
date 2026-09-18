import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AnimatedNumber } from "./AnimatedNumber";

describe("AnimatedNumber", () => {
  it("keeps the supplied formatter as the visible source of truth when the value changes", () => {
    const formatter = (value: number) => `${value.toLocaleString()}원`;
    const { rerender } = render(<AnimatedNumber value={12000} format={formatter} />);

    expect(screen.getByText("12,000원")).toBeInTheDocument();

    rerender(<AnimatedNumber value={27500} format={formatter} />);

    expect(screen.getByText("27,500원")).toBeInTheDocument();
  });
});
