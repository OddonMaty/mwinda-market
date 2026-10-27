import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  icon?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, icon, ...props }, ref) => {
    return (
      <div className="w-full space-y-1">
        <div className="relative flex items-center">
          {icon && (
            <span className="material-symbols-outlined absolute left-3.5 text-outline text-lg pointer-events-none">
              {icon}
            </span>
          )}
          <input
            type={type}
            className={cn(
              "flex h-11 w-full rounded-xl border border-outline-variant bg-surface px-4 py-2.5 text-sm text-primary transition placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary disabled:cursor-not-allowed disabled:opacity-50",
              icon && "pl-11",
              error && "border-error focus:ring-error focus:border-error",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-error font-medium pl-1">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
