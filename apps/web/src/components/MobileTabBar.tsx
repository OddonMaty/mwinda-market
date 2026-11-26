'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { useCart } from './CartProvider';
import { useT } from './I18n';
import { useWishlist } from './WishlistProvider';

/** Barre d'onglets du téléphone, fixe en bas de TOUTES les pages (masquée sur ordinateur par le CSS). */
export function MobileTabBar() {
  const path = usePathname() ?? '/';
  const { accountClick, user } = useAuth();
  const t = useT();
  const { count, toggle } = useCart();
  const wl = useWishlist();
  const on = (p: string) => (p === '/' ? path === '/' : path.startsWith(p));
  return (
    <nav className="m-tabbar" aria-label="Navigation principale">
        <Link href="/" className={on('/') ? 'on' : ''}><i className="fas fa-house" /><span>{t('Accueil')}</span></Link>
        <Link href="/collection" className={path.startsWith('/collection') ? 'on' : ''}><i className="fas fa-table-cells-large" /><span>{t('Catégories')}</span></Link>
        <Link href="/favoris" className={path.startsWith('/favoris') ? 'on' : ''}><i className="fas fa-heart" />{wl.ids.length > 0 && <b className="m-badge">{wl.ids.length}</b>}<span>{t('Favoris')}</span></Link>
        <Link href="/vendeur" className={path.startsWith('/vendeur') ? 'on' : ''}><i className="fas fa-store" /><span>{t('Boutique')}</span></Link>
        <button type="button" onClick={() => { toggle(); }}>
          <i className="fas fa-shopping-cart" />{count > 0 && <b className="m-badge">{count}</b>}<span>{t('Panier')}</span>
        </button>
        <button type="button" className={on('/compte') ? 'on' : ''} onClick={() => { accountClick(); }}><i className="fas fa-user" /><span>{t(user ? 'Compte' : 'Connexion')}</span></button>
      </nav>
  );
}
