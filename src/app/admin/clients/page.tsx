import { prisma } from "@/lib/prisma";
import { updateUserRole } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminClients() {
  const users = await prisma.user.findMany({
    include: {
      vendor: true,
      _count: { select: { orders: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Gestion des Utilisateurs & Clients</h1>
        <p className="text-on-surface-variant text-sm">
          {users.length} compte(s) utilisateur(s) enregistrés sur Mwinda Market.
        </p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-container border-b border-outline-variant text-xs text-on-surface-variant uppercase font-semibold">
              <tr>
                <th className="text-left p-3.5">Nom & Email</th>
                <th className="text-left p-3.5">Téléphone</th>
                <th className="text-left p-3.5">Rôle</th>
                <th className="text-left p-3.5">Boutique liée</th>
                <th className="text-left p-3.5">Commandes</th>
                <th className="text-left p-3.5">Date Inscription</th>
                <th className="text-right p-3.5">Changer Rôle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-on-surface-variant">
                    Aucun utilisateur enregistré.
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="p-3.5">
                    <div className="font-semibold text-primary">{u.name || "Sans nom"}</div>
                    <div className="text-xs text-on-surface-variant font-mono">{u.email}</div>
                  </td>
                  <td className="p-3.5 text-xs text-on-surface-variant">
                    {u.phone || "—"}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                        u.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : u.role === "vendor"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-surface-container-high text-on-surface"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3.5 text-xs">
                    {u.vendor ? (
                      <span className="font-medium text-primary">{u.vendor.shopName}</span>
                    ) : (
                      <span className="text-outline">—</span>
                    )}
                  </td>
                  <td className="p-3.5 text-xs font-bold">
                    {u._count.orders} commande(s)
                  </td>
                  <td className="p-3.5 text-xs text-on-surface-variant">
                    {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {u.role !== "admin" && (
                        <form
                          action={async () => {
                            "use server";
                            await updateUserRole(u.id, "admin");
                          }}
                        >
                          <button
                            type="submit"
                            title="Promouvoir Admin"
                            className="text-xs px-2 py-1 rounded border border-purple-200 text-purple-700 hover:bg-purple-50"
                          >
                            Passer Admin
                          </button>
                        </form>
                      )}
                      {u.role !== "customer" && (
                        <form
                          action={async () => {
                            "use server";
                            await updateUserRole(u.id, "customer");
                          }}
                        >
                          <button
                            type="submit"
                            title="Rétrograder Client"
                            className="text-xs px-2 py-1 rounded border border-outline text-outline hover:bg-surface-container"
                          >
                            Passer Client
                          </button>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

