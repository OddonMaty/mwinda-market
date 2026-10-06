import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Centre d'Assistance",
  description: "Centre d'assistance Mwinda Market — FAQ commandes, livraison et contact direct.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
