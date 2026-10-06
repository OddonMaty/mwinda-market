import type { Metadata } from "next";
import { ELECTRONICS_PRODUCTS } from "@/data/electronics";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product =
    ELECTRONICS_PRODUCTS.find((p) => p.id === params.id) ||
    ELECTRONICS_PRODUCTS.find((p) => p.id === "station-energie-solaire-1000w") ||
    ELECTRONICS_PRODUCTS[0];

  const title = product
    ? `${product.title} — ${product.shopName}`
    : "Fiche Produit";
  const description = product?.description
    ? product.description.slice(0, 155)
    : `${product?.title ?? "Produit"} disponible sur Mwinda Market. Payez en devise locale, livraison rapide.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Mwinda Market`,
      description,
      images: product?.image ? [{ url: product.image }] : [],
    },
  };
}

export default function ProductIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
