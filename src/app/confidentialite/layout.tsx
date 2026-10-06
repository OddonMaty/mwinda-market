import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de Confidentialité",
  description: "Politique de confidentialité Mwinda Market — données, droits et contact.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
