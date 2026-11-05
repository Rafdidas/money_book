"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { LAYOUT_TRANSITION, PANEL_TRANSITION, PRESS_TRANSITION } from "@/lib/motion/tokens";
import { useReducedMotionPreference } from "@/lib/motion/useReducedMotion";

export type MultiSelectOption = {
  value: string;
  label: string;
};

type MultiSelectProps = {
  ariaLabel: string;
  options: readonly MultiSelectOption[];
  value: readonly string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  /** 모바일에서 첫 칩 뒤에 붙는 축약 문구 */
  formatMore?: (hiddenCount: number) => string;
  className?: string;
};

const defaultFormatMore = (hiddenCount: number) => `외 ${hiddenCount}개`;

export function MultiSelect({
  ariaLabel,
  options,
  value,
  onValueChange,
  placeholder,
  emptyText = "일치하는 항목이 없습니다.",
  formatMore = defaultFormatMore,
  className,
}: MultiSelectProps) {
  const prefersReducedMotion = useReducedMotionPreference();
  const baseId = useId();
  const listboxId = `${baseId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const selectedSet = useMemo(() => new Set(value), [value]);
  const labelByValue = useMemo(() => new Map(options.map((option) => [option.value, option.label])), [options]);
  const selectedOptions = value.map((item) => ({ value: item, label: labelByValue.get(item) ?? item }));
  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ko");
    if (!normalized) return options;
    return options.filter((option) => option.label.toLocaleLowerCase("ko").includes(normalized));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  const openList = () => {
    if (open) return;
    setOpen(true);
    setActiveIndex(filteredOptions.length ? 0 : -1);
  };

  const toggleValue = (optionValue: string) => {
    onValueChange(
      selectedSet.has(optionValue) ? value.filter((item) => item !== optionValue) : [...value, optionValue],
    );
    setQuery("");
    inputRef.current?.focus();
  };

  const removeValue = (optionValue: string) => {
    onValueChange(value.filter((item) => item !== optionValue));
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const lastIndex = filteredOptions.length - 1;

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) return openList();
        setActiveIndex((current) => (current >= lastIndex ? 0 : current + 1));
        return;
      case "ArrowUp":
        event.preventDefault();
        if (!open) return openList();
        setActiveIndex((current) => (current <= 0 ? lastIndex : current - 1));
        return;
      case "Home":
        if (!open) return;
        event.preventDefault();
        setActiveIndex(lastIndex >= 0 ? 0 : -1);
        return;
      case "End":
        if (!open) return;
        event.preventDefault();
        setActiveIndex(lastIndex);
        return;
      case "Enter": {
        const option = filteredOptions[activeIndex];
        if (!open || !option) return;
        event.preventDefault();
        toggleValue(option.value);
        return;
      }
      case "Escape":
        if (!open) return;
        event.preventDefault();
        setOpen(false);
        return;
      case "Backspace":
        if (query || !value.length) return;
        onValueChange(value.slice(0, -1));
        return;
      default:
    }
  };

  const activeOptionId = open && activeIndex >= 0 && filteredOptions[activeIndex] ? `${baseId}-option-${activeIndex}` : undefined;
  const hiddenCount = Math.max(0, selectedOptions.length - 1);

  return (
    <div ref={rootRef} className={`ui-multi-select${open ? " is-open" : ""} ${className ?? ""}`.trim()}>
      <div
        className="ui-multi-select__control"
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) {
            event.preventDefault();
            inputRef.current?.focus();
            openList();
          }
        }}
      >
        <ul className="ui-multi-select__chips" aria-label="선택된 항목">
          <AnimatePresence initial={false}>
            {selectedOptions.map((option) => (
              <motion.li
                key={option.value}
                className="ui-multi-select__chip"
                layout={!prefersReducedMotion}
                initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
                transition={PRESS_TRANSITION}
              >
                <span className="ui-multi-select__chip-label">{option.label}</span>
                <button
                  type="button"
                  className="ui-multi-select__chip-remove"
                  aria-label={`${option.label} 선택 해제`}
                  onClick={() => removeValue(option.value)}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {hiddenCount > 0 ? (
          <span className="ui-multi-select__more" aria-hidden="true">
            {formatMore(hiddenCount)}
          </span>
        ) : null}
        <input
          ref={inputRef}
          className="ui-multi-select__input"
          type="text"
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeOptionId}
          autoComplete="off"
          value={query}
          placeholder={value.length ? undefined : placeholder}
          onFocus={openList}
          onClick={openList}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActiveIndex(0);
          }}
          onKeyDown={handleKeyDown}
        />
        {value.length ? (
          <button
            type="button"
            className="ui-multi-select__clear"
            aria-label="선택 모두 해제"
            onClick={() => {
              onValueChange([]);
              inputRef.current?.focus();
            }}
          >
            <span aria-hidden="true">×</span>
          </button>
        ) : null}
      </div>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="ui-multi-select__panel"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
            transition={PANEL_TRANSITION}
          >
            <ul id={listboxId} role="listbox" aria-label={ariaLabel} aria-multiselectable="true" className="ui-multi-select__list">
              {filteredOptions.map((option, index) => {
                const isSelected = selectedSet.has(option.value);
                const isActive = index === activeIndex;

                return (
                  <li
                    key={option.value}
                    id={`${baseId}-option-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    className={`ui-multi-select__option${isActive ? " is-active" : ""}${isSelected ? " is-selected" : ""}`}
                    onPointerDown={(event) => event.preventDefault()}
                    onPointerEnter={() => setActiveIndex(index)}
                    onClick={() => toggleValue(option.value)}
                  >
                    {isActive && !prefersReducedMotion ? (
                      <motion.span
                        aria-hidden="true"
                        className="ui-multi-select__highlight"
                        layoutId={`ui-multi-select-active-${baseId}`}
                        transition={LAYOUT_TRANSITION}
                      />
                    ) : isActive ? (
                      <span aria-hidden="true" className="ui-multi-select__highlight" />
                    ) : null}
                    <span className="ui-multi-select__check" aria-hidden="true">
                      {isSelected ? "✓" : ""}
                    </span>
                    <span className="ui-multi-select__option-label">{option.label}</span>
                  </li>
                );
              })}
            </ul>
            {!filteredOptions.length ? <p className="ui-multi-select__empty">{emptyText}</p> : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
