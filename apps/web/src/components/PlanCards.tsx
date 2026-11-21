'use client';

import { Check, Crown } from 'lucide-react';
import { Badge, cn } from './ui';

export interface Plan { code: string; name: string; priceUsd: number; commissionBps: number; maxProducts: number | null; features: string[] }

/** Cartes de plans (choix à l'ouverture de la boutique et page des tarifs). `action` rend le bouton propre à chaque usage. */
export function PlanCards({ plans, selected, onSelect, action, className }: { plans: Plan[]; selected?: string; onSelect?: (code: string) => void; action?: (p: Plan) => React.ReactNode; className?: string }) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-4', className)}>
      {plans.map((p, i) => {
        const on = selected === p.code;
        const top = p.code === 'pro';
        return (
          <div key={p.code} role={onSelect ? 'radio' : undefined} aria-checked={onSelect ? on : undefined} tabIndex={onSelect ? 0 : undefined}
            onClick={() => onSelect?.(p.code)} onKeyDown={(e) => { if (onSelect && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelect(p.code); } }}
            data-plan={p.code}
            className={cn('relative flex flex-col rounded-2xl border bg-card p-5 shadow-sm transition-all', onSelect && 'cursor-pointer hover:border-primary/60', on && 'border-primary ring-2 ring-primary/30', top && !on && 'border-primary/40')}>
            {top && <Badge className="absolute -top-2.5 left-5 bg-primary text-primary-foreground">Populaire</Badge>}
            {i === plans.length - 1 && plans.length > 1 && <Crown className="absolute right-4 top-4 size-5 text-primary" />}
            <p className="text-base font-semibold">{p.name}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">{p.priceUsd === 0 ? 'Gratuit' : `${p.priceUsd} $`}</p>
            <p className="text-xs text-muted-foreground">{p.priceUsd === 0 ? 'sans abonnement' : 'par trimestre, en dollars'}</p>
            <div className="mt-4 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground">Commission {p.commissionBps / 100} %</div>
            <ul className="mt-4 grid flex-1 gap-2 text-sm">
              {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" /><span>{f}</span></li>)}
            </ul>
            {action && <div className="mt-5">{action(p)}</div>}
            {onSelect && !action && <div className={cn('mt-5 flex h-9 items-center justify-center rounded-lg border text-sm font-medium', on ? 'border-primary bg-primary text-primary-foreground' : 'text-muted-foreground')}>{on ? 'Plan choisi' : 'Choisir ce plan'}</div>}
          </div>
        );
      })}
    </div>
  );
}
