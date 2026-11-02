import { prisma } from "@/lib/prisma";
import { saveSetting } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminReglages() {
  const [mmNumbersSetting, whatsappTextSetting] = await Promise.all([
    prisma.setting.findUnique({ where: { key: "official_mm_numbers" } }),
    prisma.setting.findUnique({ where: { key: "whatsapp_help_message" } }),
  ]);

  const mmNumbers = mmNumbersSetting?.value || "M-Pesa: +243 818 900 125 / Airtel Money: +243 999 000 000 / Orange: +243 890 000 000";
  const whatsappHelp = whatsappTextSetting?.value || "Bonjour Mwinda Market, j'ai une question concernant ma commande.";

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-primary">Réglages Opérationnels de la Plateforme</h1>
        <p className="text-sm text-on-surface-variant">
          Paramètres des paiements manuels et support client affichés aux acheteurs.
        </p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm space-y-6">
        <form
          action={async (formData: FormData) => {
            "use server";
            const val = formData.get("official_mm_numbers") as string;
            await saveSetting("official_mm_numbers", val || "");
          }}
          className="space-y-2"
        >
          <label className="text-sm font-bold text-primary block">
            Numéros Mobile Money Officiels pour les Dépôts
          </label>
          <p className="text-xs text-on-surface-variant">
            Ces coordonnées s'affichent automatiquement à l'acheteur lors de la validation du panier en mode Mobile Money manuel.
          </p>
          <textarea
            name="official_mm_numbers"
            defaultValue={mmNumbers}
            rows={3}
            className="w-full border border-outline-variant rounded-xl p-3 text-sm focus:outline-primary bg-surface font-mono"
            required
          />
          <button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
          >
            Enregistrer les Coordonnées Mobile Money
          </button>
        </form>

        <hr className="border-outline-variant" />

        <form
          action={async (formData: FormData) => {
            "use server";
            const val = formData.get("whatsapp_help_message") as string;
            await saveSetting("whatsapp_help_message", val || "");
          }}
          className="space-y-2"
        >
          <label className="text-sm font-bold text-primary block">
            Message WhatsApp d'Assistance Client
          </label>
          <p className="text-xs text-on-surface-variant">
            Texte par défaut pré-rempli lorsque le client clique sur l'assistance WhatsApp.
          </p>
          <textarea
            name="whatsapp_help_message"
            defaultValue={whatsappHelp}
            rows={3}
            className="w-full border border-outline-variant rounded-xl p-3 text-sm focus:outline-primary bg-surface"
            required
          />
          <button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm"
          >
            Enregistrer le Message WhatsApp
          </button>
        </form>
      </div>
    </div>
  );
}
