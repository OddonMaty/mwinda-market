import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Électronique & Énergie",
  description:
    "Smartphones, panneaux solaires, batteries, électroménagers et accessoires électroniques — Livraison dans toute l'Afrique via Mwinda Market.",
};

export default function ElectroniqueLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
