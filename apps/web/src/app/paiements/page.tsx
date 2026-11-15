import type { Metadata } from 'next';
import { Header, Footer } from '../../components/Chrome';
import { NavButton } from '../../components/NavButton';

export const metadata: Metadata = { title: 'Paiements & Retours - Sao Tech Market' };

export default function Page() {
  return (
    <>
      <Header active="" />
      <div className="page-header">
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
                <strong>Cash à la livraison</strong> — disponible à Bukavu, Uvira, Goma et Baraka
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
              Les prix sont affichés uniquement en francs congolais (CDF), convertis automatiquement
              selon le taux de change du jour. Le montant à régler vous est confirmé par notre
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
              Sao Tech Market ne propose pas encore le paiement en plusieurs fois. Cette option est
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
