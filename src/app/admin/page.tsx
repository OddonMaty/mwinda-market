import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [pendingPayments, pendingVendors, activeVendors] = await Promise.all([
    prisma.order.count({ where: { paymentStatus: "pending" } }),
    prisma.sellerApplication.count({ where: { status: "pending" } }),
    prisma.vendor.count({ where: { isActive: true } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Tableau de bord administrateur</h1>
      <p className="text-on-surface-variant">
        Console de gestion Mwinda Market — migration NitroHost / Prisma.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
          <p className="text-sm text-on-surface-variant">Commandes en attente de paiement</p>
          <p className="text-3xl font-bold text-primary">{pendingPayments}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
          <p className="text-sm text-on-surface-variant">Candidatures vendeurs</p>
          <p className="text-3xl font-bold text-primary">{pendingVendors}</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
          <p className="text-sm text-on-surface-variant">Boutiques actives</p>
          <p className="text-3xl font-bold text-primary">{activeVendors}</p>
        </div>
      </div>
    </div>
  );
}
