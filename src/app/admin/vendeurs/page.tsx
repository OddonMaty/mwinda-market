import { prisma } from "@/lib/prisma";
import { approveSellerApplication, rejectSellerApplication } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminVendeurs() {
  const [applications, vendors] = await Promise.all([
    prisma.sellerApplication.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.vendor.findMany({
      include: {
        user: true,
        _count: { select: { products: true, orders: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const pendingApps = applications.filter((a) => a.status === "pending");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary font-display">Boutiques & Certifications Vendeurs</h1>
        <p className="text-on-surface-variant text-sm">
          Examen rigoureux des informations légales (RCCM, ID. NAT, NIF) et activation des boutiques certifiées.
        </p>
      </div>

      {/* Candidatures en attente de vérification */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-primary flex items-center gap-2">
            <span>Dossiers de Candidature en Attente</span>
            <span className="bg-amber-100 text-amber-900 text-xs px-2.5 py-0.5 rounded-full font-bold">
              {pendingApps.length}
            </span>
          </h2>
        </div>

        {pendingApps.length === 0 ? (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 text-center text-on-surface-variant text-sm">
            Toutes les candidatures ont été traitées. Aucune boutique en attente de validation.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {pendingApps.map((app) => (
              <div
                key={app.id}
                className="bg-surface-container-lowest border border-amber-200 rounded-xl p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-primary">{app.shopName}</h3>
                      <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded">
                        En attente de certification
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      Soumis le {new Date(app.createdAt).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <form action={async () => { "use server"; await approveSellerApplication(app.id); }}>
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">verified</span>
                        Valider & Certifier la Boutique
                      </button>
                    </form>
                    <form action={async () => { "use server"; await rejectSellerApplication(app.id); }}>
                      <button
                        type="submit"
                        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold px-3 py-2 rounded-lg transition"
                      >
                        Rejeter
                      </button>
                    </form>
                  </div>
                </div>

                {/* Données de contact & Informations Légales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5 bg-surface-container p-3.5 rounded-lg border border-outline-variant">
                    <p className="font-bold text-primary uppercase text-[10px] tracking-wider">Contact & Emplacement</p>
                    <p><strong>Gérant / Postulant :</strong> {app.fullName}</p>
                    <p><strong>Téléphone :</strong> {app.phone}</p>
                    <p><strong>Email :</strong> {app.email}</p>
                    <p><strong>Ville / Province :</strong> {app.location || "Non spécifié"}</p>
                  </div>

                  <div className="space-y-1.5 bg-surface-container p-3.5 rounded-lg border border-outline-variant">
                    <p className="font-bold text-primary uppercase text-[10px] tracking-wider">Dossier Juridique & Forfait</p>
                    {app.notes ? (
                      <div className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {app.notes.split(" | ").map((item, idx) => (
                          <div key={idx} className="py-0.5 border-b border-outline-variant/40 last:border-0 font-medium">
                            {item}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-outline italic">Aucune mention légale additionnelle.</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Liste des Boutiques Déjà Actives & Certifiées */}
      <div className="space-y-4 pt-4 border-t border-outline-variant">
        <h2 className="text-lg font-bold text-primary">Boutiques Partenaires Enregistrées ({vendors.length})</h2>

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-surface-container border-b border-outline-variant text-xs text-on-surface-variant uppercase font-semibold">
              <tr>
                <th className="text-left p-3.5">Boutique</th>
                <th className="text-left p-3.5">Ville</th>
                <th className="text-left p-3.5">Forfait</th>
                <th className="text-left p-3.5">Articles</th>
                <th className="text-left p-3.5">Statut Certification</th>
                <th className="text-left p-3.5">Date Activation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {vendors.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-on-surface-variant">
                    Aucune boutique partenaire pour le moment.
                  </td>
                </tr>
              )}
              {vendors.map((v) => (
                <tr key={v.id} className="hover:bg-surface-container-low transition">
                  <td className="p-3.5">
                    <div className="font-bold text-primary">{v.shopName}</div>
                    <div className="text-xs text-on-surface-variant">{v.user?.email} — {v.whatsapp}</div>
                  </td>
                  <td className="p-3.5 text-xs">{v.city || "Kinshasa"}</td>
                  <td className="p-3.5">
                    <span className="bg-surface-container-high px-2 py-0.5 rounded text-xs font-bold uppercase text-primary">
                      {v.plan}
                    </span>
                  </td>
                  <td className="p-3.5 text-xs font-bold">
                    {v._count.products} article(s) en vente
                  </td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                      <span className="material-symbols-outlined text-[13px]">verified</span>
                      Certifiée Mwinda
                    </span>
                  </td>
                  <td className="p-3.5 text-xs text-on-surface-variant">
                    {new Date(v.createdAt).toLocaleDateString("fr-FR")}
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
