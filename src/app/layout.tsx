import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { MarketProvider } from "@/context/MarketContext";

export const viewport: Viewport = {
  themeColor: "#0B1B3D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "Mwinda Market | Marketplace Panafricaine - Marchés Connectés",
    template: "%s | Mwinda Market",
  },
  description:
    "La marketplace e-commerce panafricaine connectant les marchés d'Afrique. Commandez dans votre devise locale, payez par Mobile Money et faites-vous livrer rapidement.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mwinda Market",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body className="bg-background text-on-surface antialiased font-sans min-h-screen flex flex-col selection:bg-secondary selection:text-white">
        <MarketProvider>
          <CartProvider>{children}</CartProvider>
        </MarketProvider>
      </body>
    </html>
  );
}
