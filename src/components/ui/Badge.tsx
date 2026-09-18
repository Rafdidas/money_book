"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

import { PRESS_TRANSITION } from "@/lib/motion/tokens";
import { useReducedMotionPreference } from "@/lib/motion/useReducedMotion";

export type BadgeTone = "neutral" | "info" | "success" | "danger";

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
};

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  const prefersReducedMotion = useReducedMotionPreference();

  return (
    <motion.span
      className={`ui-badge ui-badge--${tone} ${className ?? ""}`.trim()}
      initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={PRESS_TRANSITION}
    >
      {children}
    </motion.span>
  );
}
