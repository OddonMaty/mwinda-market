import { prisma } from "@/lib/prisma";
import { markWithdrawalPaid, rejectWithdrawal } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminRetraits() {
  const withdrawals = await prisma.withdrawal.findMany({
    include: { vendor: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Retraits vendeurs</h1>

      <div className="bg-surface-container-lowest border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-container">
            <tr>
              <th className="text-left p-3">Boutique</th>
              <th className="text-left p-3">Montant</th>
              <th className="text-left p-3">Méthode</th>
              <th className="text-left p-3">Statut</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.map((w) => (
              <tr key={w.id} className="border-t">
                <td className="p-3">{w.vendor.shopName}</td>
                <td className="p-3 font-bold">{Number(w.amountUsd).toFixed(2)} $</td>
                <td className="p-3 text-xs">{w.method}<br/>{w.details}</td>
                <td className="p-3 text-xs">{w.status}</td>
                <td className="p-3 space-x-2">
                  {w.status === "pending" && (
                    <>
                      <form action={async () => { "use server"; await markWithdrawalPaid(w.id); }}>
                        <button className="text-xs bg-emerald-600 text-white px-2 py-1 rounded">Payé</button>
                      </form>
                      <form action={async () => { "use server"; await rejectWithdrawal(w.id); }}>
                        <button className="text-xs bg-red-600 text-white px-2 py-1 rounded">Rejeter</button>
                      </form>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {withdrawals.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-on-surface-variant">Aucun retrait.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
