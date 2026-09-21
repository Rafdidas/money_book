import type { HTMLAttributes, ReactNode } from "react";

type CardProps = Omit<HTMLAttributes<HTMLElement>, "className" | "children"> & {
  children: ReactNode;
  tone?: "default" | "strong";
  padding?: "default" | "compact";
  as?: "div" | "section" | "article" | "aside";
  className?: string;
};

export function Card({
  children,
  tone = "default",
  padding = "default",
  as: Element = "div",
  className,
  ...rest
}: CardProps) {
  const classNames = [
    "ui-card",
    tone === "strong" ? "ui-card--strong" : "",
    padding === "compact" ? "ui-card--compact" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <Element {...rest} className={classNames}>{children}</Element>;
}
