import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "ghost"
    | "destructive"
    | "link"
    | "accent";
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium rounded-lg text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none";

    const variantStyles = {
      default:
        "bg-primary text-primary-foreground hover:bg-primary/95 shadow-sm hover:shadow",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-sm hover:shadow",
      accent:
        "bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm hover:shadow",
      outline:
        "border border-border bg-background hover:bg-muted text-foreground hover:border-slate-300 shadow-sm",
      ghost:
        "hover:bg-muted text-foreground hover:text-foreground",
      destructive:
        "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
      link:
        "text-secondary underline-offset-4 hover:underline p-0 h-auto font-normal",
    };

    const sizeStyles = {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3 text-xs rounded-md",
      lg: "h-11 px-6 text-base rounded-xl",
      icon: "h-10 w-10 p-0 rounded-lg",
      "icon-sm": "h-8 w-8 p-0 rounded-md",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2 shrink-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
