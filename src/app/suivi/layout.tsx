import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Suivi de Commande",
  description:
    "Suivez votre colis Mwinda Market en temps réel. Entrez votre référence de commande et localisez votre livraison à travers toutes les provinces.",
};

export default function SuiviLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
