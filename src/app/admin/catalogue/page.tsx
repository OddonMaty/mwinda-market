import { prisma } from "@/lib/prisma";
import { toggleProductActive, deleteProduct, updateProductStock } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminCatalogue() {
  const products = await prisma.product.findMany({
    include: { vendor: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Gestion du Catalogue</h1>
          <p className="text-on-surface-variant text-sm">
            {products.length} article(s) enregistré(s) dans la base de données.
          </p>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-container border-b border-outline-variant text-xs text-on-surface-variant uppercase font-semibold">
              <tr>
                <th className="text-left p-3.5">Produit</th>
                <th className="text-left p-3.5">Boutique</th>
                <th className="text-left p-3.5">Prix</th>
                <th className="text-left p-3.5">Stock</th>
                <th className="text-left p-3.5">Statut</th>
                <th className="text-right p-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-on-surface-variant">
                    Aucun produit dans la base. Les produits ajoutés par les vendeurs ou via seed s'afficheront ici.
                  </td>
                </tr>
              )}
              {products.map((p: any) => (
                <tr key={p.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.title}
                          className="w-10 h-10 object-cover rounded-lg border border-outline-variant bg-surface-container"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-xs text-on-surface-variant font-bold">
                          N/A
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-primary line-clamp-1">{p.title}</div>
                        <div className="text-xs text-on-surface-variant flex items-center gap-2">
                          <span className="bg-surface-container-high px-1.5 py-0.5 rounded text-[11px]">
                            {p.category || "Général"}
                          </span>
                          <span>ID: {p.id.slice(0, 8)}...</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="font-medium text-xs text-primary">{p.vendor?.shopName || "Inconnue"}</div>
                    <div className="text-[11px] text-on-surface-variant">{p.vendor?.city || "Kinshasa"}</div>
                  </td>
                  <td className="p-3.5 font-bold text-primary">
                    ${Number(p.priceUsd).toFixed(2)}
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        p.stock > 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {p.stock} en stock
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        p.isActive ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {p.isActive ? "Actif (Visible)" : "Masqué"}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <form
                        action={async () => {
                          "use server";
                          await toggleProductActive(p.id, !p.isActive);
                        }}
                      >
                        <button
                          type="submit"
                          className={`text-xs px-2.5 py-1 rounded font-medium border transition ${
                            p.isActive
                              ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                              : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {p.isActive ? "Masquer" : "Activer"}
                        </button>
                      </form>
                      <form
                        action={async () => {
                          "use server";
                          await deleteProduct(p.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="text-xs px-2.5 py-1 rounded font-medium border border-red-200 text-red-600 hover:bg-red-50 transition"
                        >
                          Supprimer
                        </button>
                      </form>
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
