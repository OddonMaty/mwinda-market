import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold rounded-xl text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";

    const variantStyles = {
      default: "bg-primary text-on-primary hover:bg-primary/90 shadow-sm",
      secondary: "bg-secondary text-white hover:bg-secondary/90 shadow-sm",
      outline: "border border-outline-variant bg-surface hover:bg-surface-container text-primary",
      ghost: "hover:bg-surface-container text-on-surface",
      destructive: "bg-error text-white hover:bg-error/90",
      link: "text-secondary underline-offset-4 hover:underline p-0 h-auto",
    };

    const sizeStyles = {
      default: "h-11 px-5 py-2.5",
      sm: "h-9 px-3.5 text-xs rounded-lg",
      lg: "h-13 px-7 text-base rounded-2xl",
      icon: "h-10 w-10 p-0",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <span className="material-symbols-outlined text-base animate-spin mr-2">
            progress_activity
          </span>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
