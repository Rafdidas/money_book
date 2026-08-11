import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ConsentCard from "./ConsentCard";

const base = {
  name: "홍길동",
  email: "hong@example.com",
  createdAt: "2026-07-01T00:00:00.000Z",
  termsVersion: null,
  termsAgreedAt: null,
  privacyVersion: null,
  privacyAgreedAt: null,
  ageConfirmedAt: null,
};

describe("ConsentCard", () => {
  it("shows 기록 없음 when the account predates consent tracking", () => {
    render(<ConsentCard overview={base} />);

    expect(screen.getAllByText("기록 없음").length).toBeGreaterThan(0);
  });

  it("shows the agreed version for each document", () => {
    render(
      <ConsentCard
        overview={{
          ...base,
          termsVersion: "1.0",
          termsAgreedAt: "2026-08-01T00:00:00.000Z",
          privacyVersion: "1.1",
          privacyAgreedAt: "2026-08-02T00:00:00.000Z",
          ageConfirmedAt: "2026-08-01T00:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByText(/1\.0/)).toBeInTheDocument();
    expect(screen.getByText(/1\.1/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "이용약관" })).toHaveAttribute(
      "href",
      "/legal/terms",
    );
    expect(screen.getByRole("link", { name: "개인정보 처리방침" })).toHaveAttribute(
      "href",
      "/legal/privacy",
    );
  });
});
