import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Espace membre Mwinda Market — connexion et inscription acheteur.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
