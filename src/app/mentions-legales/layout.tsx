import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions Légales",
  description: "Mentions légales Mwinda Market — éditeur, hébergeur, propriété intellectuelle.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
