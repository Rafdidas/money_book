"use client";

import { useEffect, useRef } from "react";
import type { ReactNode, Ref } from "react";

type CheckboxProps = {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  /** 일부만 선택된 상태. 클릭하면 전체 선택으로 해소된다. */
  indeterminate?: boolean;
  children?: ReactNode;
  name?: string;
  required?: boolean;
  invalid?: boolean;
  /** 폼 라벨 옆에 들어가는 좁은 자리에는 `checkbox--compact`를 넘긴다. */
  className?: string;
  ref?: Ref<HTMLInputElement>;
};

export default function Checkbox({
  checked = false,
  onChange,
  disabled = false,
  indeterminate = false,
  children,
  name,
  required = false,
  invalid = false,
  className,
  ref,
}: CheckboxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // `indeterminate`는 속성이 아니라 DOM 프로퍼티라 JSX로 전달할 수 없다.
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const assignRef = (node: HTMLInputElement | null) => {
    inputRef.current = node;

    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  return (
    <label
      className={`checkbox${disabled ? " is-disabled" : ""}${className ? ` ${className}` : ""}`}
    >
      <input
        ref={assignRef}
        className="checkbox__input"
        type="checkbox"
        name={name}
        checked={checked}
        required={required}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        onChange={(event) => onChange?.(event.target.checked)}
      />
      <span className="checkbox__box" aria-hidden="true">
        <svg className="checkbox__icon" viewBox="0 0 20 20" width="16" height="16">
          {indeterminate ? (
            <line
              x1="5"
              y1="10"
              x2="15"
              y2="10"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d="M14 7L8.5 12.5L6 10"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      </span>
      <span className="checkbox__label">{children}</span>
    </label>
  );
}
