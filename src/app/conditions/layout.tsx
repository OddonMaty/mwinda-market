import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente",
  description: "CGV Mwinda Market — commande, paiement Mwinda Pay, livraison et retours.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
