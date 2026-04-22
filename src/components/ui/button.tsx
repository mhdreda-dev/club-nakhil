import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "ghost" | "outline" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "cn-btn-primary",
  ghost: "cn-btn-ghost",
  outline: "cn-btn-outline",
  danger: "cn-btn-danger",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  leftIcon,
  rightIcon,
  fullWidth,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={cn(
        "cn-btn",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
}
