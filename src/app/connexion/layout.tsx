import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Espace membre Mwinda Market — connexion acheteur bientôt disponible.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
