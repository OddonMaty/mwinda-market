import Link from 'next/link';
import { NavButton } from './NavButton';
import { SearchBar } from './SearchBar';
import { AccountButton } from './AccountButton';
import { CartButton } from './CartButton';
import { CountrySelector } from './CountrySelector';
import { collectionHref } from '../lib';
import { MobileNav } from './MobileNav';

type Active = 'home' | 'collection' | 'about' | 'contact' | 'faq' | '';

/** Bouton de navigation (rendu identique à l'ancien site) ; sans `to` : page pas encore portée. */
const Nav = NavButton;

export function Header({ active }: { active: Active }) {
  const is = (n: Active) => (active === n ? ' active' : '');
  return (
    <>
      <div className="top-bar">
        <div className="container">
          <div className="top-bar-left">
            <span><i className="fas fa-phone" /> +243 972 584 021</span>
            <span className="hidden-mobile"><i className="fas fa-envelope" /> contact@mwindamarket.com</span>
          </div>
          <div className="top-bar-right">
            <span className="hidden-mobile">La place de marché africaine · Lancement en RDC, bientôt partout en Afrique</span>
            <CountrySelector />
            <span>Français</span>
          </div>
        </div>
      </div>

      <header className="header">
        <div className="container header-content">
          <MobileNav />
          <Link href="/" className="logo">
            <img src="/images/brand/mwinda-h-light.png" alt="Mwinda Market" className="logo-img" />
          </Link>
          <div className="m-country"><CountrySelector /></div>
          <SearchBar />
          <div className="header-actions">
            <NavButton to="/vendeur" className="header-btn"><i className="fas fa-store" /><span className="hidden-mobile">Vendeur</span></NavButton>
            <AccountButton />
            <button type="button" className="header-btn"><i className="fas fa-heart" /><span className="hidden-mobile">Favoris</span></button>
            <CartButton />
          </div>
        </div>
      </header>

      <nav className="navigation">
        <div className="container">
          <Nav to="/" className={`nav-item${is('home')}`}>Accueil</Nav>
          <Nav to={collectionHref()} className={`nav-item${is('collection')}`}>Nos produits</Nav>
          <Nav to="/a-propos" className={`nav-item${is('about')}`}>À propos</Nav>
          <Nav to="/contact" className={`nav-item${is('contact')}`}>Contact</Nav>
          <Nav to="/faq" className={`nav-item${is('faq')}`}>FAQ</Nav>
        </div>
      </nav>
    </>
  );
}

const FOOTER_COLS: [string, [string, string?][]][] = [
  ['Service Client', [['Contactez-nous', '/contact'], ['Aide & conseils', '/faq'], ['Suivre ma commande', '/suivi'], ['Livraison', '/livraison'], ['Conditions générales', '/conditions'], ['Conditions vendeur', '/conditions-vendeur'], ['Retours et remboursements', '/remboursement']]],
  ['Informations', [['À propos de nous', '/a-propos'], ['Mon compte'], ['Paiements', '/paiements'], ['Tarifs vendeurs', '/tarifs'], ['Voir les catalogues', '/collection']]],
  ['À propos', [['Qui sommes-nous', '/a-propos'], ['Responsabilité sociale', '/responsabilite-sociale'], ['Carrières', '/carrieres'], ['Politique de confidentialité', '/confidentialite']]],
];

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-newsletter">
        <div className="container">
          <div className="newsletter-footer">
            <div><p>Restez informé — <span>Abonnez-vous à la newsletter</span></p></div>
            <div className="newsletter-input">
              <input type="email" placeholder="Votre adresse e-mail" />
              <button type="button" className="btn btn-primary">S&apos;abonner</button>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-content">
        <div className="container">
          <div className="footer-columns">
            {FOOTER_COLS.map(([title, items]) => (
              <div className="footer-column" key={title}>
                <h4>{title}</h4>
                <ul>{items.map(([label, to]) => <li key={label}><NavButton to={to}>{label}</NavButton></li>)}</ul>
              </div>
            ))}
            <div className="footer-column">
              <h4>Contactez-nous</h4>
              <ul className="contact-list">
                <li><i className="fas fa-phone" /> +243 972 584 021</li>
                <li><i className="fas fa-envelope" /> contact@mwindamarket.com</li>
                <li><i className="fas fa-clock" /> Lun–Sam : 8h – 19h</li>
              </ul>
              <div className="social-links">
                <button type="button"><i className="fab fa-facebook" /></button>
                <button type="button"><i className="fab fa-instagram" /></button>
                <button type="button"><i className="fab fa-twitter" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">
          <p>&copy; 2026 Mwinda Market. Tous droits réservés.</p>
          <p>La place de marché africaine</p>
        </div>
      </div>
    </footer>
  );
}
