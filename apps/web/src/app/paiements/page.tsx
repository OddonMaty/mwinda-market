import type { Metadata } from 'next';
import { Header, Footer } from '../../components/Chrome';
import { LegalPage } from '../../components/LegalPage';
import { getLegalPage } from '../../data/source';
import { NavButton } from '../../components/NavButton';

export const metadata: Metadata = { title: 'Paiements & Retours - Mwinda Market' };

function StaticPage() {
  return (
    <>
      <Header active="" />
      <div className="page-header" data-theme="paiements">
        <h1>Paiements & Retours</h1>
        <p>Les moyens de paiement acceptés et notre politique de remboursement</p>
      </div>
      <div className="container">
        <div className="info-page">
          <section>
            <h2>Moyens de paiement acceptés</h2>
            <ul>
              <li>
                <strong>Mobile Money</strong> — M-Pesa, Airtel Money, Orange Money
              </li>
              <li>
                <strong>Cash à la livraison</strong> — selon les villes desservies par la boutique
              </li>
            </ul>
            <p>
              Le paiement en ligne par carte bancaire n'est pas encore disponible. Après avoir passé
              votre commande sur le site, notre équipe vous contacte par téléphone ou WhatsApp pour
              confirmer les modalités : soit un transfert Mobile Money au numéro communiqué, soit un
              paiement en espèces directement au livreur.
            </p>
          </section>
          <section>
            <h2>Devises</h2>
            <p>
              Les prix sont affichés en francs congolais (CDF) pour le lancement, convertis
              automatiquement selon le taux de change du jour ; d'autres devises africaines seront
              ajoutées à l'ouverture de nouveaux pays. Le montant à régler vous est confirmé par notre
              équipe avant la livraison.
            </p>
          </section>
          <section>
            <h2>Remboursements</h2>
            <p>
              En cas de retour accepté, le remboursement est effectué par Mobile Money, sur le
              numéro de votre choix, sous 5 à 7 jours ouvrables.
            </p>
          </section>
          <section>
            <h2>Échéancier de paiement</h2>
            <p>
              Mwinda Market ne propose pas encore le paiement en plusieurs fois. Cette option est
              à l'étude pour les commandes de plus de 1 400 000 FC.
            </p>
          </section>
          <div className="info-cta">
            <p>Besoin d'aide pour un paiement ou un remboursement ?</p>
            <NavButton className="btn btn-primary" to="/contact">
              Contactez notre service client
            </NavButton>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export const revalidate = 30;

export default async function Page() {
  const page = await getLegalPage('paiements');
  return page ? <LegalPage page={page} /> : <StaticPage />;
}
