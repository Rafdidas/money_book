import type { Transition } from "motion/react";

export const PRESS_TRANSITION: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.6,
};

export const PANEL_TRANSITION: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 40,
  mass: 0.5,
};

export const LAYOUT_TRANSITION: Transition = {
  type: "spring",
  stiffness: 360,
  damping: 32,
  mass: 0.6,
};
