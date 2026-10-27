import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mon Compte | Mwinda Market",
  description: "Gérez vos commandes, adresses et informations personnelles.",
  robots: { index: false, follow: false },
};

export default function MonCompteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
