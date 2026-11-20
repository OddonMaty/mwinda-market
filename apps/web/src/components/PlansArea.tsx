'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { api, errorMessage, useAuth } from './AuthProvider';

import { PlanCards, type Plan } from './PlanCards';
import { Button } from './ui';
interface Shop { plan: string; planName: string; pendingPlan: string | null; isOfficial: boolean }

export function PlansArea() {
  const { user, ready, notify } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [shop, setShop] = useState<Shop | null>(null);

  const load = useCallback(async () => {
    const p = await api<{ plans: Plan[] }>('/plans');
    if (p.ok) setPlans(p.data.plans);
    const s = await api<{ shop: Shop | null }>('/seller/shop');
    setShop(s.ok ? s.data.shop : null);
  }, []);
  useEffect(() => { if (ready) void load(); }, [ready, user, load]);

  async function choose(code: string) {
    const r = await api<{ applied: boolean }>('/seller/plan', { method: 'POST', body: { plan: code } });
    if (!r.ok) return notify(errorMessage(r.data.code));
    notify(r.data.applied ? 'Plan modifié.' : 'Demande envoyée. Votre plan sera activé après validation du paiement par notre équipe.');
    await load();
  }

  return (
    <div className="ui">
      <PlanCards plans={plans} action={(p) => {
        const current = shop?.plan === p.code;
        if (!user || !shop) return <Button asChild variant="outline" className="w-full"><Link href="/vendeur">Ouvrir ma boutique</Link></Button>;
        if (current) return <Button variant="outline" className="w-full" disabled>Plan actuel</Button>;
        if (shop.pendingPlan === p.code) return <Button variant="outline" className="w-full" disabled>Demande en attente</Button>;
        return <Button className="w-full" onClick={() => void choose(p.code)}>Choisir ce plan</Button>;
      }} />
      <p className="mt-6 max-w-3xl text-sm text-muted-foreground">
        La commission est prélevée sur chaque vente livrée. Les plans payants sont valables 3 mois : après votre demande, notre équipe vous indique comment régler l&apos;abonnement et active le plan dès réception. À la fin de la période, la boutique repasse au plan gratuit.
      </p>
    </div>
  );
}
