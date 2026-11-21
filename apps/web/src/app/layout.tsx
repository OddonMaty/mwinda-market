import type { Metadata } from 'next';
import './globals.css';
import 'flag-icons/css/flag-icons.min.css';
import { LocaleProvider } from '../components/Locale';
import { AuthProvider } from '../components/AuthProvider';
import { ChatProvider } from '../components/Chat';
import { CartProvider } from '../components/CartProvider';

export const metadata: Metadata = {
  title: 'Mwinda Market - La marketplace africaine',
  description:
    "Découvrez des équipements électroniques premium avec livraison rapide, des prix compétitifs et 30 jours pour changer d'avis, partout en Afrique, avec un lancement en République démocratique du Congo.",
  icons: {
    icon: [
      { url: '/images/brand/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/images/brand/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/images/brand/favicon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: { url: '/images/brand/favicon-180.png', sizes: '180x180' },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body><AuthProvider><LocaleProvider><ChatProvider><CartProvider>{children}</CartProvider></ChatProvider></LocaleProvider></AuthProvider></body>
    </html>
  );
}
