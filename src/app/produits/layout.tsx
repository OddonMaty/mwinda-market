import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catalogue Produits",
  description:
    "Découvrez notre sélection de produits électroniques, mode, beauté et plus encore. Commandez depuis votre pays africain, payez en devise locale.",
};

export default function ProduitsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
