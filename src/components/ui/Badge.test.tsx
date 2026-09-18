import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders its label without inferring a domain status and exposes the requested tone", () => {
    render(<Badge tone="success">저장됨</Badge>);

    expect(screen.getByText("저장됨")).toHaveClass("ui-badge--success");
  });
});
