import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  tone?: "default" | "strong";
  padding?: "default" | "compact";
  as?: "div" | "section" | "article";
  className?: string;
};

export function Card({
  children,
  tone = "default",
  padding = "default",
  as: Element = "div",
  className,
}: CardProps) {
  const classNames = [
    "ui-card",
    tone === "strong" ? "ui-card--strong" : "",
    padding === "compact" ? "ui-card--compact" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <Element className={classNames}>{children}</Element>;
}
