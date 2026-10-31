import { prisma } from "@/lib/prisma";
import { markOrderPaid, updateOrderStatus } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminCommandes() {
  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Commandes & Paiements</h1>
      <p className="text-on-surface-variant text-sm">
        {orders.length} commande(s) — file d’attente des paiements manuels.
      </p>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-container">
            <tr>
              <th className="text-left p-3">Référence</th>
              <th className="text-left p-3">Client</th>
              <th className="text-left p-3">Montant</th>
              <th className="text-left p-3">Paiement</th>
              <th className="text-left p-3">Statut</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-on-surface-variant">
                  Aucune commande.
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-outline-variant">
                <td className="p-3 font-mono text-xs">{o.reference}</td>
                <td className="p-3">
                  <div className="font-medium">{o.customerName}</div>
                  <div className="text-xs text-on-surface-variant">{o.customerPhone}</div>
                  <div className="text-xs">{o.deliveryCity}</div>
                </td>
                <td className="p-3 font-bold">{Number(o.amountUsd).toFixed(2)} $</td>
                <td className="p-3">
                  <span className="text-xs">{o.paymentMethod}</span>
                  <div className={`text-xs font-bold ${
                    o.paymentStatus === "paid" ? "text-emerald-600" : "text-amber-600"
                  }`}>{o.paymentStatus}</div>
                </td>
                <td className="p-3 text-xs">{o.status}</td>
                <td className="p-3 space-x-2">
                  {o.paymentStatus !== "paid" && (
                    <form action={async () => { "use server"; await markOrderPaid(o.id); }}>
                      <button
                        type="submit"
                        className="text-xs bg-emerald-600 text-white px-2 py-1 rounded font-bold"
                      >
                        Paiement reçu
                      </button>
                    </form>
                  )}
                  {o.status === "paid" && (
                    <form action={async () => { "use server"; await updateOrderStatus(o.id, "preparing"); }}>
                      <button type="submit" className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                        En préparation
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
