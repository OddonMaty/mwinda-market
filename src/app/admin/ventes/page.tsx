import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminVentes() {
  const paidOrders = await prisma.order.findMany({
    where: { paymentStatus: "paid" },
    orderBy: { paidAt: "desc" },
    take: 200,
  });

  const totalSales = paidOrders.reduce((s, o) => s + Number(o.amountUsd), 0);
  const totalCommission = paidOrders.reduce((s, o) => s + Number(o.commissionUsd), 0);
  const totalVendor = paidOrders.reduce((s, o) => s + Number(o.vendorEarningUsd), 0);

  const pendingWithdrawals = await prisma.withdrawal.count({ where: { status: "pending" } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Ventes & Revenus</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border rounded-xl p-4">
          <p className="text-sm text-on-surface-variant">Ventes totales</p>
          <p className="text-2xl font-bold">{totalSales.toFixed(2)} $</p>
        </div>
        <div className="bg-surface-container-lowest border rounded-xl p-4">
          <p className="text-sm text-on-surface-variant">Commission plateforme</p>
          <p className="text-2xl font-bold text-emerald-600">{totalCommission.toFixed(2)} $</p>
        </div>
        <div className="bg-surface-container-lowest border rounded-xl p-4">
          <p className="text-sm text-on-surface-variant">Dû aux vendeurs</p>
          <p className="text-2xl font-bold">{totalVendor.toFixed(2)} $</p>
          <p className="text-xs text-on-surface-variant">{pendingWithdrawals} retrait(s) en attente</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-container">
            <tr>
              <th className="text-left p-3">Référence</th>
              <th className="text-left p-3">Client</th>
              <th className="text-right p-3">Total</th>
              <th className="text-right p-3">Commission</th>
              <th className="text-right p-3">Vendeur</th>
            </tr>
          </thead>
          <tbody>
            {paidOrders.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-3 font-mono text-xs">{o.reference}</td>
                <td className="p-3">{o.customerName}</td>
                <td className="p-3 text-right">{Number(o.amountUsd).toFixed(2)} $</td>
                <td className="p-3 text-right text-emerald-600">{Number(o.commissionUsd).toFixed(2)} $</td>
                <td className="p-3 text-right">{Number(o.vendorEarningUsd).toFixed(2)} $</td>
              </tr>
            ))}
            {paidOrders.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-on-surface-variant">Aucune vente payée.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
