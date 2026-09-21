import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders its label without inferring a domain status and exposes the requested tone", () => {
    render(<Badge tone="success">저장됨</Badge>);

    expect(screen.getByText("저장됨")).toHaveClass("ui-badge--success");
  });

  it("teal 과 violet tone 을 지원한다", () => {
    const { rerender } = render(<Badge tone="teal">답변 대기</Badge>);
    expect(screen.getByText("답변 대기").className).toContain("ui-badge--teal");

    rerender(<Badge tone="violet">ISA</Badge>);
    expect(screen.getByText("ISA").className).toContain("ui-badge--violet");
  });
});
