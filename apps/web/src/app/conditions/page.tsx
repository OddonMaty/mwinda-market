import type { Metadata } from 'next';
import { Header, Footer } from '../../components/Chrome';
import { NavButton } from '../../components/NavButton';

export const metadata: Metadata = { title: 'Conditions générales de vente - Sao Tech Market' };

export default function Page() {
  return (
    <>
      <Header active="" />
      <div className="page-header">
        <h1>Conditions générales de vente</h1>
        <p>Dernière mise à jour : janvier 2026</p>
      </div>
      <div className="container">
        <div className="info-page">
          <section>
            <h2>1. Objet</h2>
            <p>
              Les présentes conditions générales de vente régissent les ventes de produits
              électroniques réalisées par Sao Tech Market sur ce site, à destination de tout client
              situé en République Démocratique du Congo.
            </p>
          </section>
          <section>
            <h2>2. Commandes</h2>
            <p>
              Toute commande passée sur le site vaut acceptation des présentes conditions. Sao Tech
              Market se réserve le droit d'annuler ou de refuser toute commande en cas de rupture de
              stock, d'erreur manifeste sur le prix, ou de suspicion de fraude.
            </p>
          </section>
          <section>
            <h2>3. Prix</h2>
            <p>
              Les prix sont indiqués en francs congolais (CDF), toutes taxes comprises, calculés
              selon le taux de change du jour. Sao Tech Market se réserve le droit de modifier ses
              prix à tout moment, étant entendu que le prix figurant sur la commande au moment de sa
              validation est le seul applicable.
            </p>
          </section>
          <section>
            <h2>4. Paiement</h2>
            <p>
              Le paiement peut être effectué par Mobile Money ou en espèces à la livraison, selon
              les options disponibles dans votre zone. Le paiement par carte bancaire n'est pas
              encore proposé.
            </p>
          </section>
          <section>
            <h2>5. Livraison</h2>
            <p>
              Les délais de livraison sont communiqués à titre indicatif et détaillés sur notre page{' '}
              <NavButton
                style={{
                  display: 'inline',
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: '0',
                  font: 'inherit',
                }}
                to="/livraison"
              >
                Livraison & Retours
              </NavButton>
              . Le risque de perte ou d'endommagement est transféré au client à la remise du colis.
            </p>
          </section>
          <section>
            <h2>6. Garantie</h2>
            <p>
              Tous les produits vendus bénéficient d'une garantie constructeur de 12 mois contre les
              défauts de fabrication, sauf indication contraire sur la fiche produit.
            </p>
          </section>
          <section>
            <h2>7. Droit de rétractation</h2>
            <p>
              Conformément à notre politique de retours, le client dispose de 30 jours pour
              retourner un produit non conforme à ses attentes, dans les conditions décrites sur la
              page Livraison & Retours.
            </p>
          </section>
          <section>
            <h2>8. Contact</h2>
            <p>
              Pour toute question relative à ces conditions, vous pouvez nous contacter à
              contact@saotechmarket.com ou au +243 907 261 113.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}
