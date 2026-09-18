import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

function getControlClassName(className: string | undefined, invalid: boolean, value: unknown) {
  return ["ui-form-control", invalid ? "is-invalid" : "", value !== undefined && value !== "" ? "has-value" : "", className]
    .filter(Boolean)
    .join(" ");
}

export function TextInput({ className, "aria-invalid": ariaInvalid, value, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} value={value} aria-invalid={ariaInvalid} className={getControlClassName(className, ariaInvalid === true || ariaInvalid === "true", value)} />;
}

export function Select({ className, "aria-invalid": ariaInvalid, value, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} value={value} aria-invalid={ariaInvalid} className={getControlClassName(className, ariaInvalid === true || ariaInvalid === "true", value)} />;
}
