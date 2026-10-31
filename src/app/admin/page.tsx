export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Tableau de bord administrateur</h1>
      <p className="text-on-surface-variant">
        Console de gestion Mwinda Market — migration vers hébergement NitroHost.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
          <p className="text-sm text-on-surface-variant">Commandes en attente de paiement</p>
          <p className="text-3xl font-bold text-primary">0</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
          <p className="text-sm text-on-surface-variant">Candidatures vendeurs</p>
          <p className="text-3xl font-bold text-primary">0</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4">
          <p className="text-sm text-on-surface-variant">Boutiques actives</p>
          <p className="text-3xl font-bold text-primary">0</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
        <strong>En cours de migration :</strong> abandon de Supabase / Vercel.
        Backend à reconstruire pour PostgreSQL (ou autre) sur NitroHost.
        Cette interface est un squelette fonctionnel.
      </div>
    </div>
  );
}
