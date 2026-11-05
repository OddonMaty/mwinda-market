import { prisma } from "@/lib/prisma";
import { markWithdrawalPaid, rejectWithdrawal } from "../actions";
import { convertUsdToCurrency, formatLocalPrice } from "@/lib/currency";

export const dynamic = "force-dynamic";

export default async function AdminRetraits() {
  const withdrawals = await prisma.withdrawal.findMany({
    include: {
      vendor: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending");
  const paidWithdrawals = withdrawals.filter((w) => w.status === "paid");

  const totalPendingUsd = pendingWithdrawals.reduce((sum, w) => sum + Number(w.amountUsd), 0);
  const totalPaidUsd = paidWithdrawals.reduce((sum, w) => sum + Number(w.amountUsd), 0);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-primary font-display">Demandes de Retraits Vendeurs</h1>
          <p className="text-xs text-on-surface-variant">
            Validez les demandes de transfert vers les comptes Mobile Money ou banques des boutiques partenaires
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-full flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>{pendingWithdrawals.length} demande(s) en attente</span>
          </span>
        </div>
      </div>

      {/* Cartes Métriques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
            En Attente de Validation
          </span>
          <p className="text-2xl font-black text-amber-800 mt-1">${totalPendingUsd.toFixed(2)} USD</p>
          <p className="text-[11px] text-on-surface-variant">{pendingWithdrawals.length} demande(s) à traiter</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
            Total Fonds Versés
          </span>
          <p className="text-2xl font-black text-emerald-800 mt-1">${totalPaidUsd.toFixed(2)} USD</p>
          <p className="text-[11px] text-on-surface-variant">{paidWithdrawals.length} virement(s) exécuté(s)</p>
        </div>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 shadow-xs">
          <span className="text-xs font-bold text-primary uppercase tracking-wide">
            Mode de Règlement
          </span>
          <p className="text-base font-black text-primary mt-1">Mobile Money & Virement</p>
          <p className="text-[11px] text-on-surface-variant">M-Pesa, Airtel, Orange, Rawbank</p>
        </div>
      </div>

      {/* Tableau des Retraits */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 bg-surface-container border-b border-outline-variant flex items-center justify-between">
          <span className="font-bold text-xs uppercase text-primary">Toutes les demandes ({withdrawals.length})</span>
          <span className="text-xs text-on-surface-variant">Ordre antéchronologique</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-surface-container text-on-surface-variant border-b border-outline-variant uppercase font-semibold">
              <tr>
                <th className="text-left p-3.5">Date</th>
                <th className="text-left p-3.5">Boutique & Vendeur</th>
                <th className="text-left p-3.5">Montant demandé</th>
                <th className="text-left p-3.5">Moyen & Bénéficiaire</th>
                <th className="text-left p-3.5">Statut</th>
                <th className="text-right p-3.5">Décision Administrateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {withdrawals.map((w) => {
                const cdf = convertUsdToCurrency(Number(w.amountUsd), "CDF");
                const formattedCdf = formatLocalPrice(cdf, "CDF");
                return (
                  <tr key={w.id} className="hover:bg-surface-container transition">
                    <td className="p-3.5 font-mono text-on-surface-variant">
                      {new Date(w.createdAt).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-primary text-sm">{w.vendor.shopName}</div>
                      <div className="text-[11px] text-on-surface-variant">
                        {w.vendor.user?.name || "Gérant"} &bull; Plan {w.vendor.plan}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-black text-sm text-primary">
                        ${Number(w.amountUsd).toFixed(2)} USD
                      </div>
                      <div className="text-[10px] text-on-surface-variant font-mono">
                        ≈ {formattedCdf}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-primary">{w.method}</div>
                      <div className="text-[11px] text-on-surface-variant font-mono mt-0.5 max-w-xs break-words">
                        {w.details || "Coordonnées non précisées"}
                      </div>
                    </td>
                    <td className="p-3.5">
                      {w.status === "pending" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          En attente
                        </span>
                      )}
                      {w.status === "paid" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                          <span className="material-symbols-outlined text-xs">check_circle</span>
                          Payé / Transféré
                        </span>
                      )}
                      {w.status === "rejected" && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-800 bg-red-100 border border-red-300 px-2.5 py-0.5 rounded-full">
                          <span className="material-symbols-outlined text-xs">cancel</span>
                          Rejeté
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      {w.status === "pending" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <form
                            action={async () => {
                              "use server";
                              await markWithdrawalPaid(w.id);
                            }}
                          >
                            <button
                              type="submit"
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-sm">payments</span>
                              <span>Valider & Transférer</span>
                            </button>
                          </form>

                          <form
                            action={async () => {
                              "use server";
                              await rejectWithdrawal(w.id);
                            }}
                          >
                            <button
                              type="submit"
                              className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold rounded-lg transition"
                            >
                              Rejeter
                            </button>
                          </form>
                        </div>
                      ) : (
                        <span className="text-[11px] text-outline italic">Traité</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-on-surface-variant">
                    Aucune demande de retrait vendeur enregistrée pour l'instant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
