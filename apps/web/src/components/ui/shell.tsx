'use client';
import * as React from 'react';
import Link from 'next/link';
import { Menu, X, ArrowLeft, Ellipsis, type LucideIcon } from 'lucide-react';
import { cn } from './cn';
import { T } from '../I18n';

export interface NavItem { key: string; label: string; icon: LucideIcon; badge?: number | string }
export interface NavGroup { title?: string; items: NavItem[] }

/** Gabarit « menu latéral » commun à l'administration, au compte et à l'espace boutique (inspiré de My Alibaba). */
export function DashboardShell({ space, subtitle, groups, active, onSelect, user, topRight, children, footer, hideTabs }: {
  space: string; subtitle?: string; groups: NavGroup[]; active: string; onSelect: (key: string) => void;
  user?: { name: string; email?: string }; topRight?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; hideTabs?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const all = groups.flatMap((g) => g.items);
  const current = all.find((i) => i.key === active);
  const nav = (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
      {groups.map((g, i) => (
        <div key={i} className="grid gap-0.5">
          {g.title && <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{g.title}</p>}
          {g.items.map((it) => {
            const Icon = it.icon;
            const on = it.key === active;
            return (
              <button key={it.key} type="button" onClick={() => { onSelect(it.key); setOpen(false); }}
                className={cn('flex h-10 items-center gap-3 rounded-lg px-3 text-left text-sm transition-colors', on ? 'bg-primary/10 font-semibold text-accent-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                <Icon className={cn('size-[18px] shrink-0', on && 'text-primary')} />
                <span className="flex-1 truncate">{it.label}</span>
                {it.badge !== undefined && it.badge !== 0 && <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">{it.badge}</span>}
              </button>
            );
          })}
        </div>
      ))}
    </nav>
  );
  const side = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-2 border-b px-5">
        <Link href="/" className="flex items-center"><img src="/images/brand/mwinda-h-light.png" alt="Mwinda Market" className="h-11 w-auto" /></Link>
      </div>
      <div className="px-5 pt-4"><p className="text-xs font-semibold uppercase tracking-wider text-primary">{space}</p>{subtitle && <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>}</div>
      {nav}
      <div className="grid gap-2 border-t p-3">
        {footer}
        <Link href="/" className="flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><ArrowLeft className="size-4" />Retour à la boutique</Link>
        {user && (
          <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-2.5">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{user.name.trim().charAt(0).toUpperCase() || '?'}</div>
            <div className="min-w-0"><p className="truncate text-sm font-medium">{user.name}</p>{user.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}</div>
          </div>
        )}
      </div>
    </div>
  );
  return (
    <div className="ui ui-shell">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r bg-card lg:block">{side}</aside>
      {open && <div className="fixed inset-0 z-[60] lg:hidden"><div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} /><aside className="absolute inset-y-0 left-0 w-72 bg-card shadow-xl">{side}</aside></div>}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-card/90 px-4 backdrop-blur sm:px-8">
          <button type="button" className="inline-flex size-9 items-center justify-center rounded-lg border lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">{open ? <X className="size-4" /> : <Menu className="size-4" />}</button>
          <h1 className="truncate text-lg font-semibold">{current?.label}</h1>
          <div className="ml-auto flex items-center gap-2">{topRight}</div>
        </header>
        <main className="mx-auto w-full min-w-0 max-w-[1200px] px-3 py-4 pb-24 sm:px-8 sm:py-8 lg:pb-8">{children}
          <p className="mt-10 text-center text-xs text-muted-foreground">&copy; 2026 Mwinda Market · <T>Conçu par</T> <a href="https://saotechagency.com/" target="_blank" rel="noopener noreferrer" className="font-medium underline-offset-2 hover:underline">Sao Tech Agency</a></p>
        </main>
      </div>
      {/* Barre d'onglets mobile : les 4 premières rubriques + « Plus » qui ouvre le menu complet */}
      {!hideTabs && <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t bg-card pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_12px_rgba(0,0,0,.06)] lg:hidden" aria-label="Rubriques">
        {all.slice(0, 4).map((it) => {
          const Icon = it.icon; const on = it.key === active;
          return (
            <button key={it.key} type="button" onClick={() => onSelect(it.key)} className={cn('relative flex min-h-[62px] flex-col items-center justify-center gap-1 text-[10px] font-medium', on ? 'text-primary' : 'text-muted-foreground')}>
              <Icon className="size-5" /><span className="line-clamp-2 max-w-full break-words px-0.5 text-center text-[10px] leading-[1.1]">{it.label}</span>
              {it.badge !== undefined && it.badge !== 0 && <span className="absolute left-[55%] top-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-primary-foreground">{it.badge}</span>}
            </button>
          );
        })}
        <button type="button" onClick={() => setOpen(true)} className={cn('flex min-h-[60px] flex-col items-center justify-center gap-1 text-[11px] font-medium', all.slice(4).some((i) => i.key === active) ? 'text-primary' : 'text-muted-foreground')}>
          <Ellipsis className="size-5" /><span>Plus</span>
        </button>
      </nav>}
    </div>
  );
}

export function PageHeading({ title, description, actions }: { title?: string; description?: string; actions?: React.ReactNode }) {
  if (!title && !description && !actions) return null;
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>{title && <h2 className="text-xl font-semibold tracking-tight">{title}</h2>}{description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}</div>
      {actions}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, hint }: { label: string; value: React.ReactNode; icon?: LucideIcon; hint?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-2"><p className="text-xs text-muted-foreground sm:text-sm">{label}</p>{Icon && <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="size-4" /></span>}</div>
      <p className="mt-2 text-xl font-semibold tracking-tight sm:mt-3 sm:text-2xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Empty({ icon: Icon, title, text, action }: { icon?: LucideIcon; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 py-14 text-center">
      {Icon && <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon className="size-6" /></span>}
      <p className="font-medium">{title}</p>{text && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>}{action && <div className="mt-4">{action}</div>}
    </div>
  );
}
