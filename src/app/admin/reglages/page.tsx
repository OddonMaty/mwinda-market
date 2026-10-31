export default function AdminReglages() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-primary">Réglages</h1>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 space-y-4">
        <div>
          <label className="text-sm font-bold">Numéros Mobile Money officiels</label>
          <p className="text-xs text-on-surface-variant">À afficher au client lors du paiement manuel</p>
          <input
            className="mt-1 w-full border border-outline-variant rounded-lg p-2 text-sm"
            placeholder="Ex: M-Pesa 0818... / Airtel 099..."
            disabled
          />
        </div>
        <div>
          <label className="text-sm font-bold">Message d’aide WhatsApp</label>
          <textarea
            className="mt-1 w-full border border-outline-variant rounded-lg p-2 text-sm"
            rows={3}
            placeholder="Texte du bouton WhatsApp Mwinda"
            disabled
          />
        </div>
        <button className="bg-secondary text-on-secondary px-4 py-2 rounded-lg text-sm font-bold" disabled>
          Enregistrer (bientôt)
        </button>
      </div>
    </div>
  );
}
