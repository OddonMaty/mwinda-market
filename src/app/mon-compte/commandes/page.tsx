"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function MesCommandes() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!isLoading && !user) router.push("/connexion?redirect=/mon-compte/commandes");
  }, [user, isLoading, router]);

  const load = () => {
    fetch("/api/client/orders")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []))
      .catch(() => {});
  };

  useEffect(() => {
    if (user) load();
  }, [user]);

  const cancel = async (id: string) => {
    if (!confirm("Annuler cette commande ?")) return;
    const res = await fetch(`/api/client/orders/${id}/cancel`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setMsg("Commande annulée.");
      load();
    } else {
      setMsg(data.error || "Erreur");
    }
  };

  if (isLoading) return <div className="p-6">Chargement…</div>;
  if (!user) return null;

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-primary">Mes commandes</h1>
      {msg && <p className="text-sm">{msg}</p>}

      {orders.length === 0 && <p className="text-sm text-on-surface-variant">Aucune commande.</p>}

      {orders.map((o) => (
        <div key={o.id} className="border rounded-lg p-3 text-sm flex justify-between items-start gap-3">
          <div>
            <div className="font-mono font-bold">{o.reference}</div>
            <div>{Number(o.amountUsd).toFixed(2)} $ — {o.status}</div>
            <div className="text-xs text-on-surface-variant">{o.deliveryCity}</div>
          </div>
          {o.status !== "cancelled" && o.status !== "delivered" && (
            <button
              onClick={() => cancel(o.id)}
              className="text-xs bg-red-600 text-white px-2 py-1 rounded shrink-0"
            >
              Annuler
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
