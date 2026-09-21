"use client";

import { motion } from "motion/react";

import { PANEL_TRANSITION } from "@/lib/motion/tokens";
import { useReducedMotionPreference } from "@/lib/motion/useReducedMotion";

type AnimatedNumberProps = {
  value: number;
  format: (value: number) => string;
  className?: string;
};

export function AnimatedNumber({ value, format, className }: AnimatedNumberProps) {
  const prefersReducedMotion = useReducedMotionPreference();

  return (
    <motion.span
      key={value}
      className={className}
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={PANEL_TRANSITION}
    >
      {format(value)}
    </motion.span>
  );
}
