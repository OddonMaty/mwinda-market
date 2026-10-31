export default function AdminCommandes() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Commandes & Paiements</h1>
      <p className="text-on-surface-variant text-sm">
        File d’attente des paiements manuels (Mobile Money) et suivi des statuts.
      </p>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-container">
            <tr>
              <th className="text-left p-3">Référence</th>
              <th className="text-left p-3">Client</th>
              <th className="text-left p-3">Montant</th>
              <th className="text-left p-3">Statut</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="p-6 text-center text-on-surface-variant">
                Aucune commande pour le moment.<br />
                <span className="text-xs">(Données à brancher sur la nouvelle base PostgreSQL)</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
