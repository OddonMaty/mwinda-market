"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function VendorFinances() {
  const { user, isLoading, isVendor } = useAuth();
  const router = useRouter();
  const [balance, setBalance] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("mobile_money");
  const [details, setDetails] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!isLoading && !user) router.push("/connexion?redirect=/vendeur/finances");
  }, [user, isLoading, router]);

  const load = () => {
    fetch("/api/vendor/balance").then(r => r.json()).then(setBalance);
    fetch("/api/vendor/withdrawals").then(r => r.json()).then(d => setWithdrawals(d.withdrawals || []));
  };

  useEffect(() => {
    if (isVendor) load();
  }, [isVendor]);

  const requestWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/vendor/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountUsd: Number(amount), method, details }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg("Demande de retrait envoyée.");
      setAmount("");
      setDetails("");
      load();
    } else {
      setMsg(data.error || "Erreur");
    }
  };

  if (isLoading) return <div className="p-6">Chargement…</div>;
  if (!user || !isVendor) return <div className="p-6">Accès vendeur requis.</div>;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-primary">Mes finances</h1>

      {balance && (
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-xl p-4">
            <p className="text-xs text-on-surface-variant">Ventes</p>
            <p className="text-xl font-bold">{balance.totalSales.toFixed(2)} $</p>
          </div>
          <div className="border rounded-xl p-4">
            <p className="text-xs text-on-surface-variant">Commission plateforme</p>
            <p className="text-xl font-bold text-amber-600">{balance.totalCommission.toFixed(2)} $</p>
          </div>
          <div className="border rounded-xl p-4">
            <p className="text-xs text-on-surface-variant">Gagné</p>
            <p className="text-xl font-bold">{balance.totalEarned.toFixed(2)} $</p>
          </div>
          <div className="border rounded-xl p-4 bg-emerald-50">
            <p className="text-xs text-on-surface-variant">Disponible</p>
            <p className="text-xl font-bold text-emerald-700">{balance.available.toFixed(2)} $</p>
            <p className="text-xs">Forfait : {balance.plan}</p>
          </div>
        </div>
      )}

      <form onSubmit={requestWithdrawal} className="border rounded-xl p-4 space-y-3">
        <h2 className="font-bold">Demander un retrait</h2>
        <input
          type="number"
          step="0.01"
          placeholder="Montant USD"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border rounded-lg p-2 text-sm"
          required
        />
        <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full border rounded-lg p-2 text-sm">
          <option value="mobile_money">Mobile Money</option>
          <option value="bank">Virement bancaire</option>
        </select>
        <input
          placeholder="Numéro ou IBAN"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          className="w-full border rounded-lg p-2 text-sm"
        />
        <button type="submit" className="bg-secondary text-white px-4 py-2 rounded-lg text-sm font-bold">
          Demander
        </button>
        {msg && <p className="text-sm">{msg}</p>}
      </form>

      <div>
        <h2 className="font-bold mb-2">Historique</h2>
        {withdrawals.map((w) => (
          <div key={w.id} className="text-sm border-b py-2 flex justify-between">
            <span>{Number(w.amountUsd).toFixed(2)} $ — {w.method}</span>
            <span className="text-xs">{w.status}</span>
          </div>
        ))}
        {withdrawals.length === 0 && <p className="text-sm text-on-surface-variant">Aucun retrait.</p>}
      </div>
    </div>
  );
}
