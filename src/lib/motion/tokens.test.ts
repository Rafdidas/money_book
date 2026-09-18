import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  LAYOUT_TRANSITION,
  PANEL_TRANSITION,
  PRESS_TRANSITION,
} from "./tokens";
import { useReducedMotionPreference } from "./useReducedMotion";

describe("common motion tokens", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("exports shared spring transitions for press, panel, and layout feedback", () => {
    expect(PRESS_TRANSITION).toMatchObject({ type: "spring" });
    expect(PANEL_TRANSITION).toMatchObject({ type: "spring" });
    expect(LAYOUT_TRANSITION).toMatchObject({ type: "spring" });
  });

  it("reflects the reduced-motion media preference", async () => {
    const addEventListener = vi.fn();
    const removeEventListener = vi.fn();
    vi.stubGlobal("matchMedia", () => ({
      matches: true,
      addEventListener,
      removeEventListener,
    }));

    const { result, unmount } = renderHook(() => useReducedMotionPreference());

    await waitFor(() => expect(result.current).toBe(true));
    expect(addEventListener).toHaveBeenCalledWith("change", expect.any(Function));

    unmount();
    expect(removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });
});
