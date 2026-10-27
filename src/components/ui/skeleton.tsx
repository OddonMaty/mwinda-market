import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-surface-container-high/60", className)}
      {...props}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-3.5 space-y-3 shadow-card animate-pulse">
      <div className="w-full aspect-square rounded-xl bg-surface-container-high/70" />
      <div className="space-y-2 pt-1">
        <div className="h-3.5 w-1/3 bg-surface-container-high/80 rounded" />
        <div className="h-4.5 w-4/5 bg-surface-container-high/90 rounded" />
        <div className="h-3 w-1/2 bg-surface-container-high/60 rounded" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="h-5 w-20 bg-surface-container-high/80 rounded" />
        <div className="h-9 w-9 rounded-xl bg-surface-container-high/90" />
      </div>
    </div>
  );
}

export function ShopCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant p-5 space-y-4 shadow-card animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-surface-container-high/80" />
        <div className="space-y-1.5 flex-1">
          <div className="h-4 w-32 bg-surface-container-high/80 rounded" />
          <div className="h-3 w-20 bg-surface-container-high/60 rounded" />
        </div>
      </div>
      <div className="h-3 w-full bg-surface-container-high/60 rounded" />
      <div className="h-3 w-3/4 bg-surface-container-high/60 rounded" />
      <div className="h-9 w-full bg-surface-container-high/70 rounded-xl" />
    </div>
  );
}

export function OrderRowSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-outline-variant bg-surface-container-lowest flex items-center justify-between gap-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-surface-container-high/80" />
        <div className="space-y-1">
          <div className="h-4 w-28 bg-surface-container-high/80 rounded" />
          <div className="h-3 w-36 bg-surface-container-high/60 rounded" />
        </div>
      </div>
      <div className="h-6 w-20 bg-surface-container-high/70 rounded-full" />
    </div>
  );
}
