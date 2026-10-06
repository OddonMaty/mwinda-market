import type { Metadata } from "next";

interface Props {
  params: { reference: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const ref = (params.reference || "").toUpperCase();
  return {
    title: `Commande #${ref}`,
    description: `Suivez l'avancement de votre commande ${ref} sur Mwinda Market — carte temps réel, jalons de livraison et contact livreur.`,
  };
}

export default function SuiviReferenceLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
