import { act, fireEvent, render, screen } from "@testing-library/react";
import { StrictMode, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ToastProvider, useToast } from "./ToastProvider";

// Keep timer assertions independent of the exit animation's animation frames.
vi.mock("motion/react", async (importOriginal) => ({
  ...await importOriginal<typeof import("motion/react")>(),
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
}));

function ToastTrigger() {
  const { toast } = useToast();

  return <button type="button" onClick={() => toast("저장했습니다", { tone: "success" })}>알림 표시</button>;
}

describe("ToastProvider", () => {
  afterEach(() => vi.useRealTimers());

  it("dismisses each toast after 10 seconds without extending earlier toasts", () => {
    vi.useFakeTimers();
    render(<ToastProvider><ToastTrigger /></ToastProvider>);

    fireEvent.click(screen.getByRole("button", { name: "알림 표시" }));
    act(() => vi.advanceTimersByTime(5_000));
    fireEvent.click(screen.getByRole("button", { name: "알림 표시" }));
    act(() => vi.advanceTimersByTime(4_999));
    expect(screen.getAllByRole("status")).toHaveLength(2);

    act(() => vi.advanceTimersByTime(1));
    expect(screen.getAllByRole("status")).toHaveLength(1);

    // The remaining toast has its own expiration, independent of the first.
    act(() => vi.advanceTimersByTime(5_000));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

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
