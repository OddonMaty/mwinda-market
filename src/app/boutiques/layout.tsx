import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Boutiques",
  description:
    "Explorez les boutiques vérifiées de Mwinda Market à travers l'Afrique. Trouvez votre vendeur de confiance et commandez en toute sécurité.",
};

export default function BoutiquesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
