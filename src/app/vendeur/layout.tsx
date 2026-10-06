import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Espace Vendeur",
  description:
    "Gérez vos commandes, vos produits et vos performances depuis votre tableau de bord vendeur Mwinda Market.",
};

export default function VendeurLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
