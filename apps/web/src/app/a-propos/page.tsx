import type { Metadata } from 'next';
import { Header, Footer } from '../../components/Chrome';

export const metadata: Metadata = { title: 'À propos de nous - Mwinda Market' };

export default function Page() {
  return (
    <>
      <Header active="about" />
      <div className="about-hero">
        <h1>À propos de nous</h1>
        <p>Des équipements électroniques premium accessibles à tous, partout en Afrique</p>
      </div>
      <div className="container about-container">
        <div className="about-intro">
          <p>
            Mwinda Market a été fondée avec une mission simple : rendre la technologie de pointe
            accessible à tous les Africains. Mwinda Market réunit des boutiques et des acheteurs sur une
            même place de marché, avec un lancement en République démocratique du Congo avant
            l'ouverture aux autres pays du continent.
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
              <i className="fas fa-check"></i> Des boutiques de plusieurs pays africains sur une seule plateforme
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
      </div>
      <Footer />
    </>
  );
}
