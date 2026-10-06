import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { MarketProvider } from "@/context/MarketContext";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

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
    <html lang="fr" className={`${plusJakarta.variable} ${inter.variable} scroll-smooth`}>
      <body className="bg-background text-on-surface antialiased font-sans min-h-screen flex flex-col selection:bg-secondary selection:text-white">
        <MarketProvider>
          <CartProvider>{children}</CartProvider>
        </MarketProvider>
      </body>
    </html>
  );
}
