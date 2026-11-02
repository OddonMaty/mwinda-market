import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { markOrderPaid, approveSellerApplication } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [
    ordersCount,
    pendingOrdersCount,
    paidOrders,
    productsCount,
    vendorsCount,
    pendingVendorsCount,
    usersCount,
    pendingWithdrawalsCount,
    recentPendingOrders,
    recentApplications,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { paymentStatus: "pending", status: { not: "cancelled" } } }),
    prisma.order.findMany({
      where: { paymentStatus: "paid" },
      select: { amountUsd: true, commissionUsd: true, vendorEarningUsd: true },
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.vendor.count({ where: { isActive: true } }),
    prisma.sellerApplication.count({ where: { status: "pending" } }),
    prisma.user.count(),
    prisma.withdrawal.count({ where: { status: "pending" } }),
    prisma.order.findMany({
      where: { paymentStatus: "pending", status: { not: "cancelled" } },
      include: { items: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.sellerApplication.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const totalSalesUsd = paidOrders.reduce((acc, o) => acc + Number(o.amountUsd), 0);
  const totalCommissionUsd = paidOrders.reduce((acc, o) => acc + Number(o.commissionUsd), 0);
  const totalVendorEarningsUsd = paidOrders.reduce((acc, o) => acc + Number(o.vendorEarningUsd), 0);

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary font-display">Centre de Contrôle Global</h1>
          <p className="text-sm text-on-surface-variant">
            Supervision complète et gestion opérationnelle des flux de la marketplace Mwinda.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Mode Paiement Manuel Actif
          </span>
        </div>
      </div>

      {/* Cartes Métriques Financières & Activités */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Volume des Ventes</span>
          <p className="text-2xl font-black text-primary">${totalSalesUsd.toFixed(2)} USD</p>
          <p className="text-xs text-on-surface-variant">{paidOrders.length} commande(s) payée(s)</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Commissions Mwinda</span>
          <p className="text-2xl font-black text-emerald-700">${totalCommissionUsd.toFixed(2)} USD</p>
          <p className="text-xs text-on-surface-variant">Revenus nets plateforme</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Gains Vendeurs</span>
          <p className="text-2xl font-black text-blue-700">${totalVendorEarningsUsd.toFixed(2)} USD</p>
          <p className="text-xs text-on-surface-variant">À reverser aux partenaires</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-5 shadow-sm space-y-1">
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Paiements en Attente</span>
          <p className="text-2xl font-black text-amber-700">{pendingOrdersCount}</p>
          <p className="text-xs text-amber-800 font-medium">Validation manuelle requise</p>
        </div>
      </div>

      {/* Cartes Compteurs Opérationnels */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link href="/admin/commandes" className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 hover:border-secondary transition shadow-sm">
          <div className="text-xs text-on-surface-variant">Total Commandes</div>
          <div className="text-xl font-bold text-primary mt-1">{ordersCount}</div>
        </Link>
        <Link href="/admin/catalogue" className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 hover:border-secondary transition shadow-sm">
          <div className="text-xs text-on-surface-variant">Articles en Vente</div>
          <div className="text-xl font-bold text-primary mt-1">{productsCount}</div>
        </Link>
        <Link href="/admin/vendeurs" className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 hover:border-secondary transition shadow-sm">
          <div className="text-xs text-on-surface-variant">Boutiques Actives</div>
          <div className="text-xl font-bold text-primary mt-1">{vendorsCount} ({pendingVendorsCount} en attente)</div>
        </Link>
        <Link href="/admin/clients" className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 hover:border-secondary transition shadow-sm">
          <div className="text-xs text-on-surface-variant">Comptes Utilisateurs</div>
          <div className="text-xl font-bold text-primary mt-1">{usersCount}</div>
        </Link>
      </div>

      {/* Section : Commandes Récentes en Attente de Validation */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-primary">File d'attente : Validation des Paiements Manuels</h2>
            <p className="text-xs text-on-surface-variant">
              Commandes nécessitant vérification du dépôt Mobile Money ou confirmation cash avant notification du vendeur.
            </p>
          </div>
          <Link href="/admin/commandes" className="text-xs font-bold text-secondary hover:underline">
            Voir toutes les commandes &rarr;
          </Link>
        </div>

        {recentPendingOrders.length === 0 ? (
          <div className="p-8 text-center text-on-surface-variant bg-surface-container rounded-xl text-sm">
            Aucun paiement en attente de validation pour le moment.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-container border-b border-outline-variant text-xs text-on-surface-variant uppercase font-semibold">
                <tr>
                  <th className="text-left p-3">Réf / Date</th>
                  <th className="text-left p-3">Client</th>
                  <th className="text-left p-3">Articles</th>
                  <th className="text-left p-3">Montant</th>
                  <th className="text-left p-3">Mode</th>
                  <th className="text-right p-3">Action Immédiate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {recentPendingOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-surface-container-low transition">
                    <td className="p-3">
                      <div className="font-mono font-bold text-primary">{o.reference}</div>
                      <div className="text-[11px] text-on-surface-variant">
                        {new Date(o.createdAt).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-primary">{o.customerName}</div>
                      <div className="text-xs text-on-surface-variant font-mono">{o.customerPhone}</div>
                      <div className="text-xs text-outline">{o.deliveryCity}</div>
                    </td>
                    <td className="p-3 text-xs">
                      {o.items.length} article(s) : {o.items.map((i) => i.title).join(", ")}
                    </td>
                    <td className="p-3 font-bold text-primary">
                      ${Number(o.amountUsd).toFixed(2)}
                    </td>
                    <td className="p-3 text-xs">
                      <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-semibold">
                        {o.paymentMethod === "manual_mm" ? "Mobile Money" : "Livraison"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <form
                        action={async () => {
                          "use server";
                          await markOrderPaid(o.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition"
                        >
                          Valider Paiement
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section : Candidatures Vendeurs à Valider */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-primary">Candidatures Vendeurs en Attente ({pendingVendorsCount})</h2>
            <p className="text-xs text-on-surface-variant">
              Examinez et approuvez les nouvelles boutiques candidates pour commencer à vendre.
            </p>
          </div>
          <Link href="/admin/vendeurs" className="text-xs font-bold text-secondary hover:underline">
            Gérer toutes les boutiques &rarr;
          </Link>
        </div>

        {recentApplications.length === 0 ? (
          <div className="p-6 text-center text-on-surface-variant bg-surface-container rounded-xl text-sm">
            Aucune nouvelle candidature vendeur en attente.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentApplications.map((app) => (
              <div key={app.id} className="border border-outline-variant rounded-xl p-4 bg-surface flex flex-col justify-between gap-3">
                <div>
                  <div className="font-bold text-primary text-base">{app.shopName}</div>
                  <div className="text-xs text-on-surface-variant">{app.fullName} — {app.phone}</div>
                  <div className="text-xs text-outline">{app.email} &bull; {app.location || "Kinshasa"}</div>
                  {app.notes && <p className="text-xs text-on-surface mt-2 italic bg-surface-container p-2 rounded">« {app.notes} »</p>}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-outline-variant">
                  <form
                    action={async () => {
                      "use server";
                      await approveSellerApplication(app.id);
                    }}
                    className="flex-1"
                  >
                    <button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 text-white text-xs font-bold py-2 rounded-lg transition"
                    >
                      Approuver la Boutique
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
