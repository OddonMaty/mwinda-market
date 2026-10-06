import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Panier",
  description:
    "Consultez et finalisez votre panier Mwinda Market. Calculez les frais de livraison par province et passez votre commande en toute sécurité.",
};

export default function PanierLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
