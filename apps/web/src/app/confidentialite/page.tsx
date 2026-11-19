import type { Metadata } from 'next';
import { Header, Footer } from '../../components/Chrome';
import { LegalPage } from '../../components/LegalPage';
import { getLegalPage } from '../../data/source';

export const metadata: Metadata = { title: 'Politique de confidentialité - Mwinda Market' };

function StaticPage() {
  return (
    <>
      <Header active="" />
      <div className="page-header">
        <h1>Politique de confidentialité</h1>
        <p>Dernière mise à jour : janvier 2026</p>
      </div>
      <div className="container">
        <div className="info-page">
          <section>
            <h2>1. Données collectées</h2>
            <p>
              Lorsque vous passez commande ou nous contactez, nous collectons votre nom, votre
              numéro de téléphone, votre adresse e-mail et votre adresse de livraison. Ces
              informations sont nécessaires au traitement de votre commande.
            </p>
          </section>
          <section>
            <h2>2. Utilisation des données</h2>
            <ul>
              <li>Traiter et livrer vos commandes</li>
              <li>Vous contacter au sujet du statut de votre commande</li>
              <li>Vous envoyer notre newsletter, si vous y avez consenti</li>
              <li>Améliorer nos produits et notre service client</li>
            </ul>
          </section>
          <section>
            <h2>3. Partage des données</h2>
            <p>
              Vos données ne sont jamais vendues à des tiers. Elles peuvent être partagées avec nos
              partenaires de livraison, uniquement dans la mesure nécessaire à l'acheminement de
              votre commande.
            </p>
          </section>
          <section>
            <h2>4. Sécurité</h2>
            <p>
              Nous ne demandons jamais vos identifiants Mobile Money ou vos données bancaires sur le
              site. Le paiement se fait directement avec vous, par téléphone ou à la livraison.
            </p>
          </section>
          <section>
            <h2>5. Vos droits</h2>
            <p>
              Vous pouvez à tout moment demander l'accès, la correction ou la suppression de vos
              données personnelles en nous contactant à contact@saotechmarket.com.
            </p>
          </section>
          <section>
            <h2>6. Cookies</h2>
            <p>
              Ce site utilise le stockage local de votre navigateur (localStorage) uniquement pour
              mémoriser le contenu de votre panier d'achat entre deux visites. Aucune donnée n'est
              transmise à des tiers à cette fin.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}

export const revalidate = 30;

export default async function Page() {
  const page = await getLegalPage('confidentialite');
  return page ? <LegalPage page={page} /> : <StaticPage />;
}
