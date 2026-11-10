import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: string | React.ReactNode;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, icon, startIcon, endIcon, ...props }, ref) => {
    const effectiveStartIcon = startIcon || icon;

    return (
      <div className="w-full space-y-1">
        <div className="relative flex items-center">
          {effectiveStartIcon && (
            <div className="absolute left-3 flex items-center justify-center text-muted-foreground pointer-events-none">
              {typeof effectiveStartIcon === "string" ? (
                <span className="material-symbols-outlined text-base">
                  {effectiveStartIcon}
                </span>
              ) : (
                effectiveStartIcon
              )}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-10 w-full rounded-lg border border-input bg-background px-3.5 py-2 text-sm text-foreground transition-all duration-150 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50",
              effectiveStartIcon && "pl-9",
              endIcon && "pr-9",
              error && "border-destructive focus-visible:ring-destructive/25 focus-visible:border-destructive",
              className
            )}
            ref={ref}
            {...props}
          />
          {endIcon && (
            <div className="absolute right-3 flex items-center justify-center text-muted-foreground">
              {endIcon}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-destructive font-medium pl-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
