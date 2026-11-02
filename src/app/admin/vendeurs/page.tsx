import { prisma } from "@/lib/prisma";
import { approveSellerApplication, rejectSellerApplication } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminVendeurs() {
  const applications = await prisma.sellerApplication.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Candidatures vendeurs</h1>
      <p className="text-on-surface-variant text-sm">
        {applications.filter((a) => a.status === "pending").length} en attente.
      </p>

      <div className="space-y-3">
        {applications.length === 0 && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 text-center text-on-surface-variant">
            Aucune candidature.
          </div>
        )}

        {applications.map((app) => (
          <div
            key={app.id}
            className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div>
              <div className="font-bold">{app.shopName}</div>
              <div className="text-sm">{app.fullName} — {app.phone}</div>
              <div className="text-xs text-on-surface-variant">{app.email} • {app.location || "—"}</div>
              <div className="text-xs mt-1">
                Statut : <strong>{app.status}</strong>
              </div>
            </div>

            {app.status === "pending" && (
              <div className="flex gap-2">
                <form action={async () => { "use server"; await approveSellerApplication(app.id); }}>
                  <button
                    type="submit"
                    className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded"
                  >
                    Approuver
                  </button>
                </form>
                <form action={async () => { "use server"; await rejectSellerApplication(app.id); }}>
                  <button
                    type="submit"
                    className="bg-error text-white text-xs font-bold px-3 py-1.5 rounded"
                  >
                    Rejeter
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
