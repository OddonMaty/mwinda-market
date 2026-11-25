'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { DEPARTMENTS } from '@saotech/shared';
import { collectionHref } from '../lib';
import { useAuth } from './AuthProvider';
import { useCart } from './CartProvider';
import { LanguageChips, useT } from './I18n';
import { useWishlist } from './WishlistProvider';

const LINKS: [string, string, string][] = [
  ['fa-house', 'Accueil', '/'],
  ['fa-box-open', 'Nos produits', '/collection'],
  ['fa-truck-fast', 'Suivre ma commande', '/suivi'],
  ['fa-store', 'Espace vendeur', '/vendeur'],
  ['fa-tags', 'Tarifs vendeurs', '/tarifs'],
  ['fa-circle-info', 'À propos', '/a-propos'],
  ['fa-envelope', 'Contact', '/contact'],
  ['fa-circle-question', 'Aide & FAQ', '/faq'],
];
const LEGAL: [string, string][] = [['Conditions générales', '/conditions'], ['Conditions vendeur', '/conditions-vendeur'], ['Livraison', '/livraison'], ['Remboursement', '/remboursement'], ['Confidentialité', '/confidentialite']];

type Sheet = null | 'menu' | 'cats';

/** Navigation mobile : bouton menu (tiroir), barre d'onglets fixe en bas et feuille des catégories. Masquée sur ordinateur par le CSS. */
export function MobileNav() {
  const path = usePathname() ?? '/';
  const { accountClick, user } = useAuth();
  const t = useT();
  const { count, toggle } = useCart();
  const wl = useWishlist();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [openDep, setOpenDep] = useState<string | null>(null);

  useEffect(() => { setSheet(null); }, [path]);
  useEffect(() => {
    document.body.classList.toggle('sheet-open', sheet !== null);
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setSheet(null); };
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('keydown', esc); document.body.classList.remove('sheet-open'); };
  }, [sheet]);

  const hideBar = path.startsWith('/admin') || path.startsWith('/vendeur');
  const on = (p: string) => (p === '/' ? path === '/' : path.startsWith(p));

  return (
    <>
      <button type="button" className="m-menu-btn" aria-label={t('Ouvrir le menu')} onClick={() => setSheet('menu')}><i className="fas fa-bars" /></button>

      {!hideBar && (
        <nav className="m-tabbar" aria-label="Navigation principale">
          <Link href="/" className={on('/') ? 'on' : ''}><i className="fas fa-house" /><span>{t('Accueil')}</span></Link>
          <Link href="/collection" className={path.startsWith('/collection') ? 'on' : ''}><i className="fas fa-table-cells-large" /><span>{t('Catégories')}</span></Link>
          <Link href="/favoris" className={path.startsWith('/favoris') ? 'on' : ''}><i className="fas fa-heart" />{wl.ids.length > 0 && <b className="m-badge">{wl.ids.length}</b>}<span>{t('Favoris')}</span></Link>
          <Link href="/vendeur" className={path.startsWith('/vendeur') ? 'on' : ''}><i className="fas fa-store" /><span>{t('Boutique')}</span></Link>
          <button type="button" onClick={() => { setSheet(null); toggle(); }}>
            <i className="fas fa-shopping-cart" />{count > 0 && <b className="m-badge">{count}</b>}<span>{t('Panier')}</span>
          </button>
          <button type="button" className={on('/compte') ? 'on' : ''} onClick={() => { setSheet(null); accountClick(); }}><i className="fas fa-user" /><span>{t(user ? 'Compte' : 'Connexion')}</span></button>
        </nav>
      )}

      {sheet && <div className="m-backdrop" onClick={() => setSheet(null)} />}

      <aside className={`m-drawer${sheet === 'menu' ? ' open' : ''}`} aria-hidden={sheet !== 'menu'}>
        <div className="m-sheet-head">
          <img src="/images/brand/mwinda-h-light.png" alt="Mwinda Market" />
          <button type="button" onClick={() => setSheet(null)} aria-label={t('Fermer')}><i className="fas fa-times" /></button>
        </div>
        <ul className="m-links">
          {LINKS.map(([icon, label, to]) => (
            <li key={to}><Link href={to} className={on(to) && to !== '/' ? 'on' : ''}><i className={`fas ${icon}`} /><span>{t(label)}</span><i className="fas fa-chevron-right" /></Link></li>
          ))}
        </ul>
        <LanguageChips />
        <div className="m-legal">{LEGAL.map(([l, to]) => <Link key={to} href={to}>{t(l)}</Link>)}</div>
        <div className="m-contact">
          <a href="tel:+243972584021"><i className="fas fa-phone" /> +243 972 584 021</a>
          <a href="mailto:contact@mwindamarket.com"><i className="fas fa-envelope" /> contact@mwindamarket.com</a>
          <small>{t('La place de marché africaine · Lancement en RDC, bientôt partout en Afrique')}</small>
        </div>
      </aside>

      <section className={`m-cats${sheet === 'cats' ? ' open' : ''}`} aria-hidden={sheet !== 'cats'}>
        <div className="m-sheet-head"><b>{t('Catégories')}</b><button type="button" onClick={() => setSheet(null)} aria-label={t('Fermer')}><i className="fas fa-times" /></button></div>
        <ul className="m-links">
          {DEPARTMENTS.map((d) => (
            <li key={d.slug}>
              <button type="button" onClick={() => setOpenDep(openDep === d.slug ? null : d.slug)} aria-expanded={openDep === d.slug}>
                <i className={`fas ${d.icon}`} /><span>{d.name}</span><i className={`fas fa-chevron-${openDep === d.slug ? 'up' : 'down'}`} />
              </button>
              {openDep === d.slug && (
                <div className="m-sub">
                  <Link href={collectionHref(d.slug)}>{`Tout voir dans ${d.name}`}</Link>
                  {d.categories.map((c) => <Link key={c} href={collectionHref(d.slug, c)}>{c}</Link>)}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
