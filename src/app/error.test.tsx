import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AppError from "./error";

describe("AppError", () => {
  it("retries rendering when the user selects 다시 시도", () => {
    const unstableRetry = vi.fn();

    render(
      <AppError
        error={new Error("sensitive detail")}
        unstable_retry={unstableRetry}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(unstableRetry).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "홈으로" })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
