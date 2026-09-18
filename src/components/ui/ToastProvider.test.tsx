import { fireEvent, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { describe, expect, it } from "vitest";

import { ToastProvider, useToast } from "./ToastProvider";

function ToastTrigger() {
  const { toast } = useToast();

  return <button type="button" onClick={() => toast("저장했습니다", { tone: "success" })}>알림 표시</button>;
}

describe("ToastProvider", () => {
  it("renders non-blocking status feedback when requested", () => {
    render(
      <ToastProvider>
        <ToastTrigger />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "알림 표시" }));

    expect(screen.getByRole("status")).toHaveTextContent("저장했습니다");
    expect(screen.getByRole("status")).toHaveClass("ui-toast--success");
  });

  it("adds one toast for one request in Strict Mode", () => {
    render(
      <StrictMode>
        <ToastProvider>
          <ToastTrigger />
        </ToastProvider>
      </StrictMode>,
    );

    fireEvent.click(screen.getByRole("button", { name: "알림 표시" }));

    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it("rejects use outside its provider", () => {
    expect(() => render(<ToastTrigger />)).toThrow("useToast must be used within ToastProvider.");
  });
});
