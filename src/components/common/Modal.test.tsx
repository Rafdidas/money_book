import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import Modal from "./Modal";

const ModalContents = () => (
  <>
    <h2 id="dialog-title">테스트 모달</h2>
    <button type="button">첫 버튼</button>
    <button type="button">마지막 버튼</button>
  </>
);

describe("Modal", () => {
  it("exposes a labelled modal dialog and focuses its first control", () => {
    render(
      <Modal onClose={vi.fn()} ariaLabelledBy="dialog-title">
        <ModalContents />
      </Modal>,
    );

    expect(screen.getByRole("dialog", { name: "테스트 모달" })).toHaveAttribute(
      "aria-modal",
      "true",
    );
    expect(screen.getByRole("button", { name: "첫 버튼" })).toHaveFocus();
  });

  it("loops Tab focus between the first and last controls", () => {
    render(
      <Modal onClose={vi.fn()} ariaLabelledBy="dialog-title">
        <ModalContents />
      </Modal>,
    );

    const firstButton = screen.getByRole("button", { name: "첫 버튼" });
    const lastButton = screen.getByRole("button", { name: "마지막 버튼" });

    lastButton.focus();
    fireEvent.keyDown(lastButton, { key: "Tab" });
    expect(firstButton).toHaveFocus();

    firstButton.focus();
    fireEvent.keyDown(firstButton, { key: "Tab", shiftKey: true });
    expect(lastButton).toHaveFocus();
  });

  it("closes on Escape and overlay click", () => {
    const onClose = vi.fn();
    render(
      <Modal onClose={onClose} ariaLabelledBy="dialog-title">
        <ModalContents />
      </Modal>,
    );

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    fireEvent.mouseDown(screen.getByTestId("modal-overlay"));

    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("restores focus to the trigger after it closes", () => {
    const Harness = () => {
      const [isOpen, setIsOpen] = useState(false);

      return (
        <>
          <button type="button" onClick={() => setIsOpen(true)}>
            열기 버튼
          </button>
          {isOpen ? (
            <Modal onClose={() => setIsOpen(false)} ariaLabelledBy="dialog-title">
              <ModalContents />
            </Modal>
          ) : null}
        </>
      );
    };

    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "열기 버튼" });
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(trigger).toHaveFocus();
  });
});
