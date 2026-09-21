"use client";

import { motion } from "motion/react";
import { useId, useRef } from "react";

import { LAYOUT_TRANSITION, PRESS_TRANSITION } from "@/lib/motion/tokens";
import { useReducedMotionPreference } from "@/lib/motion/useReducedMotion";

export type TabItem<T extends string = string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type TabsProps<T extends string> = {
  ariaLabel: string;
  items: readonly TabItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  className?: string;
};

export function Tabs<T extends string>({ ariaLabel, items, value, onValueChange, className }: TabsProps<T>) {
  const prefersReducedMotion = useReducedMotionPreference();
  const layoutId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectAtIndex = (index: number) => {
    const item = items[index];
    if (!item || item.disabled) return;

    tabRefs.current[index]?.focus();
    onValueChange(item.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!items.length) return;

    const enabledIndexes = items.flatMap((item, itemIndex) => (item.disabled ? [] : itemIndex));
    const currentEnabledIndex = enabledIndexes.indexOf(index);
    if (currentEnabledIndex === -1) return;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      selectAtIndex(enabledIndexes[(currentEnabledIndex + 1) % enabledIndexes.length]);
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      selectAtIndex(enabledIndexes[(currentEnabledIndex - 1 + enabledIndexes.length) % enabledIndexes.length]);
    }

    if (event.key === "Home") {
      event.preventDefault();
      selectAtIndex(enabledIndexes[0]);
    }

    if (event.key === "End") {
      event.preventDefault();
      selectAtIndex(enabledIndexes[enabledIndexes.length - 1]);
    }
  };

  return (
    <div className={`ui-tabs ${className ?? ""}`.trim()} role="tablist" aria-label={ariaLabel}>
      {items.map((item, index) => {
        const isSelected = item.value === value;

        return (
          <button
            key={item.value}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            type="button"
            role="tab"
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            className={`ui-tabs__tab${isSelected ? " is-selected" : ""}`}
            disabled={item.disabled}
            onClick={() => onValueChange(item.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
          >
            {isSelected && !prefersReducedMotion ? (
              <motion.span
                aria-hidden="true"
                className="ui-tabs__background"
                layoutId={`ui-tabs-active-${layoutId}`}
                transition={LAYOUT_TRANSITION}
              />
            ) : isSelected ? (
              <span aria-hidden="true" className="ui-tabs__background" />
            ) : null}
            <motion.span
              className="ui-tabs__label"
              whileTap={prefersReducedMotion || item.disabled ? undefined : { scale: 0.97 }}
              transition={PRESS_TRANSITION}
            >
              {item.label}
            </motion.span>
          </button>
        );
      })}
    </div>
  );
}
