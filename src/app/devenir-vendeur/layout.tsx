import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Devenir Vendeur",
  description:
    "Ouvrez votre boutique sur Mwinda Market et vendez dans toute l'Afrique. Inscription gratuite, paiement sécurisé via Mwinda Pay, logistique simplifiée.",
};

export default function DevenirVendeurLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
