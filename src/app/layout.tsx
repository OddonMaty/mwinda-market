import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { MarketProvider } from "@/context/MarketContext";
import { CatalogProvider } from "@/context/CatalogContext";
import { FloatingBar } from "@/components/FloatingBar";
import { DemoBanner } from "@/components/DemoBanner";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    for (var r of regs) r.unregister();
                  });
                  if ('caches' in window) {
                    caches.keys().then(function(keys) {
                      for (var k of keys) caches.delete(k);
                    });
                  }
                }
              }
            `,
          }}
        />
      </head>
      <body
        className="bg-background text-on-surface antialiased font-sans min-h-screen flex flex-col selection:bg-secondary selection:text-white max-w-full"
        suppressHydrationWarning
      >
        <MarketProvider>
          <CatalogProvider>
            <DemoBanner />
            <CartProvider>
              {children}
              <FloatingBar />
            </CartProvider>
          </CatalogProvider>
        </MarketProvider>
      </body>
    </html>
  );
}
