'use client';
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './cn';

type DivProps = React.HTMLAttributes<HTMLDivElement>;
export const Card = ({ className, ...p }: DivProps) => <div className={cn('rounded-2xl border bg-card text-card-foreground shadow-sm', className)} {...p} />;
export const CardHeader = ({ className, ...p }: DivProps) => <div className={cn('flex flex-col gap-1 p-4 pb-2 sm:p-5 sm:pb-3', className)} {...p} />;
export const CardTitle = ({ className, ...p }: React.HTMLAttributes<HTMLHeadingElement>) => <h3 className={cn('text-base font-semibold leading-tight', className)} {...p} />;
export const CardDescription = ({ className, ...p }: React.HTMLAttributes<HTMLParagraphElement>) => <p className={cn('text-sm text-muted-foreground', className)} {...p} />;
export const CardContent = ({ className, ...p }: DivProps) => <div className={cn('p-4 pt-2 sm:p-5 sm:pt-2', className)} {...p} />;
export const CardFooter = ({ className, ...p }: DivProps) => <div className={cn('flex items-center gap-2 p-4 pt-0 sm:p-5 sm:pt-0', className)} {...p} />;

const badge = cva('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', {
  variants: { variant: {
    default: 'border-transparent bg-primary/10 text-accent-foreground',
    secondary: 'border-transparent bg-muted text-muted-foreground',
    success: 'border-transparent bg-emerald-50 text-emerald-700',
    warning: 'border-transparent bg-amber-50 text-amber-700',
    danger: 'border-transparent bg-red-50 text-red-700',
    outline: 'text-foreground',
  } },
  defaultVariants: { variant: 'default' },
});
export const Badge = ({ className, variant, ...p }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badge>) => <span className={cn(badge({ variant }), className)} {...p} />;

/** Tableau : sur téléphone, chaque ligne devient une fiche « libellé : valeur » (les libellés viennent de l'en-tête). */
export const Table = ({ className, ...p }: React.TableHTMLAttributes<HTMLTableElement>) => {
  const label = React.useCallback((el: HTMLTableElement | null) => {
    if (!el) return;
    const heads = Array.from(el.querySelectorAll('thead th')).map((h) => (h.textContent ?? '').trim());
    el.querySelectorAll('tbody tr').forEach((tr) => Array.from(tr.children).forEach((td, i) => { if (!td.hasAttribute('data-label')) td.setAttribute('data-label', heads[i] ?? ''); }));
  }, []);
  // Les lignes changent à chaque rendu : on ré-étiquette après chaque mise à jour.
  const ref = React.useRef<HTMLTableElement | null>(null);
  React.useEffect(() => { label(ref.current); });
  return <div className="w-full overflow-x-auto"><table ref={ref} className={cn('stack-table w-full text-sm', className)} {...p} /></div>;
};
export const Th = ({ className, ...p }: React.ThHTMLAttributes<HTMLTableCellElement>) => <th className={cn('h-10 whitespace-nowrap border-b px-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground', className)} {...p} />;
export const Td = ({ className, ...p }: React.TdHTMLAttributes<HTMLTableCellElement>) => <td className={cn('border-b px-3 py-3 align-middle', className)} {...p} />;
