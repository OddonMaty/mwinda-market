import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Zones de Livraison",
  description:
    "Consultez les zones et délais de livraison Mwinda Market par pays et province. Simulez vos frais de port en CDF, XAF, RWF, KES, XOF ou AOA.",
};

export default function ZonesLivraisonLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
