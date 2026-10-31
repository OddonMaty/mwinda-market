export default function AdminVendeurs() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Candidatures vendeurs</h1>
      <p className="text-on-surface-variant text-sm">
        Approuver ou rejeter les demandes pour créer boutique + compte vendeur.
      </p>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 text-center text-on-surface-variant">
        Aucune candidature en attente.
      </div>
    </div>
  );
}
