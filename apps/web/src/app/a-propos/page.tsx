import type { Metadata } from 'next';
import { Header, Footer } from '../../components/Chrome';

export const metadata: Metadata = { title: 'À propos de nous - Sao Tech Market' };

export default function Page() {
  return (
    <>
      <Header active="about" />
      <div className="about-hero">
        <h1>À propos de nous</h1>
        <p>Des équipements électroniques premium accessibles à tous, partout en RDC, depuis 2015</p>
      </div>
      <div className="container about-container">
        <div className="about-intro">
          <p>
            Sao Tech Market a été fondée avec une mission simple : rendre la technologie de pointe
            accessible à tous les Congolais. Ce qui a commencé comme une petite boutique en ligne à
            Bukavu est devenu l'un des revendeurs d'électronique grand public les plus dynamiques de
            l'Est de la République Démocratique du Congo.
          </p>
          <p>
            Nous travaillons directement avec les grandes marques internationales pour éliminer les
            intermédiaires et vous faire profiter des meilleurs prix. Chaque produit est sélectionné
            avec soin, testé, et soutenu par notre engagement envers l'excellence.
          </p>
        </div>
        <section className="how-it-works">
          <h2>Comment ça marche</h2>
          <div className="steps-grid">
            <div className="step-card">
              <span className="step-number">01</span>
              <h3>Choisissez un produit</h3>
              <p>
                Parcourez plus de 10 000 produits électroniques sélectionnés parmi les plus grandes
                marques du monde.
              </p>
            </div>
            <div className="step-card">
              <span className="step-number">02</span>
              <h3>Passez votre commande</h3>
              <p>Paiement à la livraison (Mobile Money ou espèces) et traitement rapide.</p>
            </div>
            <div className="step-card">
              <span className="step-number">03</span>
              <h3>Recevez & profitez</h3>
              <p>Livraison rapide et retours faciles. Satisfaction garantie ou remboursé.</p>
            </div>
          </div>
        </section>
        <section className="why-us">
          <h2>Pourquoi nous choisir ?</h2>
          <ul className="benefits-list">
            <li>
              <i className="fas fa-check"></i> Plus de 10 000 produits répartis en 20 catégories
            </li>
            <li>
              <i className="fas fa-check"></i> Revendeur agréé de plus de 200 marques
            </li>
            <li>
              <i className="fas fa-check"></i> Retours gratuits sur toutes les commandes à Bukavu et
              Uvira
            </li>
            <li>
              <i className="fas fa-check"></i> Support 24/7 par chat et e-mail
            </li>
            <li>
              <i className="fas fa-check"></i> Garantie du meilleur prix
            </li>
            <li>
              <i className="fas fa-check"></i> Paiement à la livraison : Mobile Money ou espèces
            </li>
          </ul>
        </section>
        <section className="locations">
          <h2>Nos zones de service</h2>
          <div className="locations-grid">
            <div className="location-card">
              <h3>Bukavu (siège)</h3>
              <p>
                <i className="fas fa-clock"></i> 8h – 19h
              </p>
            </div>
            <div className="location-card">
              <h3>Uvira</h3>
              <p>
                <i className="fas fa-clock"></i> 9h – 18h
              </p>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
