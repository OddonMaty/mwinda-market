import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning"
    | "accent"
    | "subtle";
  size?: "default" | "sm" | "lg";
}

export function Badge({
  className,
  variant = "default",
  size = "default",
  ...props
}: BadgeProps) {
  const variantStyles = {
    default:
      "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
    secondary:
      "border-transparent bg-secondary/15 text-secondary font-medium hover:bg-secondary/25",
    destructive:
      "border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
    outline:
      "border-border text-foreground hover:bg-muted/50",
    success:
      "border-transparent bg-emerald-50 text-emerald-700 border-emerald-200/60 font-medium",
    warning:
      "border-transparent bg-amber-50 text-amber-700 border-amber-200/60 font-medium",
    accent:
      "border-transparent bg-accent text-accent-foreground font-semibold shadow-sm hover:bg-accent/90",
    subtle:
      "border-transparent bg-slate-100 text-slate-700 font-medium",
  };

  const sizeStyles = {
    default: "px-2.5 py-0.5 text-xs",
    sm: "px-2 py-0.2 text-[10px]",
    lg: "px-3 py-1 text-sm",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  );
}

