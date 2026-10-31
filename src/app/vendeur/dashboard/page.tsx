import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function VendorDashboard() {
  const uid = cookies().get("mwinda_uid")?.value;
  if (!uid) redirect("/connexion?redirect=/vendeur/dashboard");

  const user = await prisma.user.findUnique({
    where: { id: uid },
    include: {
      vendor: {
        include: {
          products: { where: { isActive: true }, take: 20 },
          orders: { orderBy: { createdAt: "desc" }, take: 20, include: { items: true } },
        },
      },
    },
  });

  if (!user?.vendor) {
    return (
      <div className="p-6 max-w-lg mx-auto text-center space-y-4">
        <h1 className="text-xl font-bold">Espace vendeur</h1>
        <p>Votre compte n'est pas encore lié à une boutique approuvée.</p>
        <p className="text-sm text-on-surface-variant">
          Faites une candidature via « Devenir vendeur » ou attendez la validation par l'administrateur.
        </p>
      </div>
    );
  }

  const { vendor } = user;
  const pendingOrders = vendor.orders.filter((o) => o.status === "paid" || o.status === "preparing").length;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-primary">Ma boutique — {vendor.shopName}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border rounded-xl p-4">
          <p className="text-sm text-on-surface-variant">Commandes à préparer</p>
          <p className="text-3xl font-bold">{pendingOrders}</p>
        </div>
        <div className="bg-surface-container-lowest border rounded-xl p-4">
          <p className="text-sm text-on-surface-variant">Produits actifs</p>
          <p className="text-3xl font-bold">{vendor.products.length}</p>
        </div>
        <div className="bg-surface-container-lowest border rounded-xl p-4">
          <p className="text-sm text-on-surface-variant">Statut</p>
          <p className="text-lg font-bold">{vendor.isVerified ? "Vérifiée" : "En attente"}</p>
        </div>
      </div>

      <div>
        <h2 className="font-bold mb-2">Commandes récentes</h2>
        {vendor.orders.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Aucune commande pour le moment.</p>
        ) : (
          <div className="space-y-2">
            {vendor.orders.map((o) => (
              <div key={o.id} className="border rounded-lg p-3 text-sm flex justify-between">
                <div>
                  <div className="font-mono font-bold">{o.reference}</div>
                  <div>{o.customerName} — {o.deliveryCity}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{Number(o.amountUsd).toFixed(2)} $</div>
                  <div className="text-xs">{o.status}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-bold mb-2">Mes articles</h2>
        {vendor.products.length === 0 ? (
          <p className="text-sm text-on-surface-variant">Aucun produit actif. Ajoutez-en depuis l'administration ou bientôt ici.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {vendor.products.map((p) => (
              <li key={p.id} className="flex justify-between border-b py-1">
                <span>{p.title}</span>
                <span>{Number(p.priceUsd).toFixed(2)} $ · stock {p.stock}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
