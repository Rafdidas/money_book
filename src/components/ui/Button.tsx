"use client";

import { motion } from "motion/react";
import type { ButtonHTMLAttributes } from "react";

import { PRESS_TRANSITION } from "@/lib/motion/tokens";
import { useReducedMotionPreference } from "@/lib/motion/useReducedMotion";

export type ButtonVariant =
  | "default"
  | "primary"
  | "secondary"
  | "outline"
  | "outline-primary"
  | "subtle"
  | "negative";

export type ButtonSize = "xs" | "sm" | "md" | "lg";

type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onAnimationStart" | "onAnimationEnd" | "onDrag" | "onDragStart" | "onDragEnd"
> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
};

export function Button({
  variant = "default",
  size = "md",
  full = false,
  className,
  type = "button",
  disabled,
  ...props
}: ButtonProps) {
  const prefersReducedMotion = useReducedMotionPreference();

  const classNames = [
    "button",
    variant === "default" ? "" : `button--${variant}`,
    `button--${size}`,
    full ? "button--full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <motion.button
      {...props}
      type={type}
      disabled={disabled}
      className={classNames}
      whileTap={prefersReducedMotion || disabled ? undefined : { scale: 0.98 }}
      transition={PRESS_TRANSITION}
    />
  );
}
