import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon = "inbox",
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest/80 max-w-lg mx-auto space-y-4",
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-secondary-fixed/50 text-secondary flex items-center justify-center mb-1">
        <span className="material-symbols-outlined text-3xl">{icon}</span>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-xl font-black text-primary font-display">{title}</h3>
        <p className="text-sm text-on-surface-variant max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {(actionLabel && (actionHref || onAction)) && (
        <div className="pt-2">
          {actionHref ? (
            <Link href={actionHref}>
              <Button variant="secondary">{actionLabel}</Button>
            </Link>
          ) : (
            <Button variant="secondary" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
