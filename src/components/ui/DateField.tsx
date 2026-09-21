"use client";

import { TextInput } from "./FormControl";

type DateFieldProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
};

export function DateField({ value, onChange, className, ...props }: DateFieldProps) {
  return (
    <TextInput
      {...props}
      type="date"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={["ui-date-field", className].filter(Boolean).join(" ")}
    />
  );
}
