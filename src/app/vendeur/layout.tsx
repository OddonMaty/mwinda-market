import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Espace Vendeur | Mwinda Market",
  description:
    "Gérez vos commandes, vos produits et vos retraits de fonds depuis votre tableau de bord vendeur Mwinda Market.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function VendeurLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased">{children}</div>;
}
