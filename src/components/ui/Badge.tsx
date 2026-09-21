import type { ReactNode } from "react";

export type BadgeTone = "neutral" | "info" | "success" | "danger" | "teal" | "violet";

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
};

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span className={`ui-badge ui-badge--${tone} ${className ?? ""}`.trim()}>
      {children}
    </span>
  );
}
