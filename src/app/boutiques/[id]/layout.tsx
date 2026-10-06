import type { Metadata } from "next";
import { getShopById, SHOPS_DATA } from "@/data/shops";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const shop = getShopById(params.id) || SHOPS_DATA[0];
  const title = shop ? `${shop.name} — ${shop.city}` : "Fiche Boutique";
  const description = shop?.bio
    ? shop.bio.slice(0, 155)
    : `${shop?.name ?? "Boutique"} sur Mwinda Market. Produits vérifiés, paiement sécurisé.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Mwinda Market`,
      description,
      images: shop?.bannerImage ? [{ url: shop.bannerImage }] : [],
    },
  };
}

export default function ShopIdLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
