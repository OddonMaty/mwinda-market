'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { formatPrice } from '../lib';
import { api, errorMessage, useAuth } from './AuthProvider';

interface Plan { code: string; name: string; priceUsd: number; commissionBps: number; maxProducts: number | null; features: string[] }
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
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1.25rem' }}>
        {plans.map((p) => {
          const current = shop?.plan === p.code;
          return (
            <div key={p.code} className="seller-product-form-wrapper" style={{ marginBottom: 0, borderTop: p.code === 'premium' ? '4px solid var(--primary)' : undefined }}>
              <h2 style={{ fontSize: '1.2rem' }}>{p.name}</h2>
              <p style={{ fontSize: '1.7rem', fontWeight: 700, margin: '0.5rem 0 0' }}>{p.priceUsd === 0 ? 'Gratuit' : formatPrice(p.priceUsd)}</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>{p.priceUsd === 0 ? 'sans abonnement' : `par trimestre (${p.priceUsd} $)`}</p>
              <p style={{ fontWeight: 700, color: 'var(--primary)' }}>Commission {p.commissionBps / 100} %</p>
              <ul style={{ margin: '0.75rem 0 1.25rem', paddingLeft: '1.1rem', fontSize: '0.9rem' }}>{p.features.map((f) => <li key={f}>{f}</li>)}</ul>
              {!user || !shop ? (
                <Link href="/vendeur" className="btn btn-outline full-width">Ouvrir ma boutique</Link>
              ) : current ? (
                <button type="button" className="btn btn-outline full-width" disabled>Plan actuel</button>
              ) : shop.pendingPlan === p.code ? (
                <button type="button" className="btn btn-outline full-width" disabled>Demande en attente</button>
              ) : (
                <button type="button" className="btn btn-primary full-width" onClick={() => void choose(p.code)}>Choisir ce plan</button>
              )}
            </div>
          );
        })}
      </div>
      <p className="seller-form-note" style={{ marginTop: '1.5rem' }}>
        La commission est prélevée sur chaque vente livrée. Les plans payants sont valables 3 mois : après votre demande, notre équipe vous indique comment régler l&apos;abonnement et active le plan dès réception. À la fin de la période, la boutique repasse au plan gratuit.
      </p>
    </>
  );
}
