'use client';
import { nowLocale, useI18n } from './I18n';

import { useCallback, useEffect, useState } from 'react';
import { Banknote, CheckCircle2, Clock, Wallet } from 'lucide-react';
import { formatUsd } from '../lib';
import { api, errorMessage, useAuth } from './AuthProvider';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Empty, Field, Input, PageHeading, Select, StatCard, Table, Td, Th } from './ui';

interface Withdrawal { id: string; amountUsd: number; method: string; provider: string; accountName: string; accountNumber: string; status: 'pending' | 'paid' | 'rejected'; reference: string | null; reason: string | null; createdAt: string }
interface WalletData { earnedUsd: number; pendingUsd: number; paidUsd: number; availableUsd: number; minWithdrawalUsd: number; withdrawals: Withdrawal[] }
const TONE = { pending: 'warning', paid: 'success', rejected: 'danger' } as const;
const LABEL = { pending: 'En attente de validation', paid: 'Payé', rejected: 'Refusé' } as const;
const PROVIDERS = ['M-Pesa', 'Airtel Money', 'Orange Money', 'Afrimoney', 'MTN Mobile Money', 'Autre'];
const ERR: Record<string, string> = {
  below_minimum: 'Montant inférieur au retrait minimum.', insufficient_balance: 'Montant supérieur à votre solde disponible.',
  too_many_pending: 'Trois demandes sont déjà en attente : patientez pendant leur validation.', shop_not_active: 'Votre boutique doit être validée pour retirer vos gains.',
};

/** « Mes gains » : solde des commandes livrées (après commission), demande de retrait, historique. L’administration valide chaque retrait. */
export function SellerWallet({ official }: { official: boolean }) {
  useI18n();
  const { notify } = useAuth();
  const [w, setW] = useState<WalletData | null>(null);
  const [method, setMethod] = useState<'mobile_money' | 'bank'>('mobile_money');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { const r = await api<WalletData>('/seller/wallet'); if (r.ok) setW(r.data); }, []);
  useEffect(() => { void load(); }, [load]);
  if (!w) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  if (official) return <Empty icon={Wallet} title="Boutique officielle" text="La boutique officielle n’a pas de retrait à demander : aucune commission n’est prélevée." />;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true);
    const r = await api('/seller/withdrawals', { method: 'POST', body: { amountUsd: Math.round(Number(f.get('amount')) * 100) / 100, method, provider: String(f.get('provider') ?? '').trim(), accountName: String(f.get('accountName') ?? '').trim(), accountNumber: String(f.get('accountNumber') ?? '').trim() } });
    setBusy(false);
    if (!r.ok) return notify(ERR[r.data.code ?? ''] ?? errorMessage(r.data.code));
    form.reset();
    await load();
    notify('Demande envoyée. L’administration la validera et vous serez prévenu.');
  }

  return (
    <div className="grid gap-6">
      <PageHeading title="Mes gains" description="Vos ventes livrées, moins la commission de votre plan. Vous demandez un retrait, l’administration le valide puis vous paie." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Disponible" value={formatUsd(w.availableUsd)} icon={Wallet} />
        <StatCard label="En attente de paiement" value={formatUsd(w.pendingUsd)} icon={Clock} />
        <StatCard label="Déjà payé" value={formatUsd(w.paidUsd)} icon={CheckCircle2} />
        <StatCard label="Total gagné" value={formatUsd(w.earnedUsd)} icon={Banknote} />
      </div>
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Demander un retrait</CardTitle><CardDescription>Minimum {formatUsd(w.minWithdrawalUsd)} · 3 demandes en attente au maximum.</CardDescription></CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Montant (USD) *"><Input type="number" name="amount" min={w.minWithdrawalUsd} max={Math.max(w.availableUsd, w.minWithdrawalUsd)} step="0.01" required /></Field>
              <Field label="Mode de paiement *"><Select value={method} onChange={(e) => setMethod(e.target.value as 'mobile_money' | 'bank')}><option value="mobile_money">Mobile Money</option><option value="bank">Compte bancaire</option></Select></Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={method === 'mobile_money' ? 'Opérateur *' : 'Banque *'}>{method === 'mobile_money'
                ? <Select name="provider" required>{PROVIDERS.map((p) => <option key={p}>{p}</option>)}</Select>
                : <Input name="provider" placeholder="Ex. Equity BCDC" required />}</Field>
              <Field label="Nom du titulaire *"><Input name="accountName" required /></Field>
            </div>
            <Field label={method === 'mobile_money' ? 'Numéro Mobile Money *' : 'Numéro de compte *'}><Input name="accountNumber" required /></Field>
            <div><Button type="submit" disabled={busy || w.availableUsd < w.minWithdrawalUsd}>{busy ? 'Envoi…' : 'Demander le retrait'}</Button>{w.availableUsd < w.minWithdrawalUsd && <p className="mt-2 text-xs text-muted-foreground">Le solde disponible est inférieur au minimum de retrait.</p>}</div>
          </form>
        </CardContent>
      </Card>
      <div>
        <h3 className="mb-3 text-base font-semibold">Historique des retraits</h3>
        {w.withdrawals.length === 0 ? <Empty icon={Banknote} title="Aucun retrait" text="Vos demandes apparaîtront ici." /> : (
          <Card><Table>
            <thead><tr><Th>Date</Th><Th>Montant</Th><Th>Destination</Th><Th>Statut</Th></tr></thead>
            <tbody>{w.withdrawals.map((x) => (
              <tr key={x.id}><Td>{new Date(x.createdAt).toLocaleDateString(nowLocale())}</Td><Td>{formatUsd(x.amountUsd)}</Td><Td>{x.provider} · {x.accountNumber}</Td>
                <Td><Badge variant={TONE[x.status]}>{LABEL[x.status]}</Badge>{x.reference && <div className="text-xs text-muted-foreground">Réf. {x.reference}</div>}{x.reason && <div className="text-xs text-muted-foreground">Motif : {x.reason}</div>}</Td></tr>
            ))}</tbody>
          </Table></Card>
        )}
      </div>
    </div>
  );
}
