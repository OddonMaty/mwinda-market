import type { Metadata } from 'next';
import { Header, Footer } from '../../components/Chrome';
import { NavButton } from '../../components/NavButton';

export const metadata: Metadata = { title: 'Livraison & Retours - Sao Tech Market' };

export default function Page() {
  return (
    <>
      <Header active="" />
      <div className="page-header">
        <h1>Livraison & Retours</h1>
        <p>Tout ce qu'il faut savoir sur la réception et le retour de vos commandes en RDC</p>
      </div>
      <div className="container">
        <div className="info-page">
          <section>
            <h2>Zones de livraison</h2>
            <p>
              Nous livrons actuellement à <strong>Bukavu</strong>, <strong>Uvira</strong>,{' '}
              <strong>Goma</strong> et <strong>Baraka</strong> (territoire de Fizi), ainsi que dans
              les communes environnantes. Pour les autres villes de la RDC, la commande est
              acheminée via notre partenaire transporteur jusqu'au point de retrait le plus proche.
            </p>
            <table className="info-table">
              <tbody>
                <tr>
                  <th>Zone</th>
                  <th>Délai estimé</th>
                  <th>Frais</th>
                </tr>
                <tr>
                  <td>Bukavu (centre-ville)</td>
                  <td>24 à 48 heures</td>
                  <td>Gratuit dès 280 000 FC d'achat</td>
                </tr>
                <tr>
                  <td>Uvira</td>
                  <td>2 à 4 jours</td>
                  <td>14 000 FC</td>
                </tr>
                <tr>
                  <td>Goma</td>
                  <td>3 à 5 jours</td>
                  <td>20 000 FC</td>
                </tr>
                <tr>
                  <td>Baraka (territoire de Fizi)</td>
                  <td>4 à 7 jours</td>
                  <td>25 000 FC</td>
                </tr>
                <tr>
                  <td>Autres villes (RDC)</td>
                  <td>4 à 8 jours</td>
                  <td>Calculé au moment de la commande</td>
                </tr>
              </tbody>
            </table>
          </section>
          <section>
            <h2>Suivi de commande</h2>
            <p>
              Dès l'expédition de votre commande, vous recevez une confirmation par SMS ou WhatsApp
              au numéro fourni lors de l'achat, avec le nom du livreur et un créneau horaire estimé.
              Vous pouvez aussi suivre l'état de vos commandes à tout moment depuis{' '}
              <NavButton className="link-btn">Mon compte</NavButton>.
            </p>
          </section>
          <section>
            <h2>Retours & échanges</h2>
            <p>
              Vous disposez de <strong>30 jours</strong> à compter de la réception pour retourner un
              article qui ne vous convient pas.
            </p>
            <ul>
              <li>
                L'article doit être dans son état d'origine, avec l'emballage et les accessoires
              </li>
              <li>Retours gratuits pour toute commande passée depuis Bukavu ou Uvira</li>
              <li>
                Remboursement traité sous 5 à 7 jours ouvrables après réception de l'article
                retourné
              </li>
              <li>
                Échange possible pour une autre couleur ou capacité, selon le stock disponible
              </li>
            </ul>
            <p>
              Pour lancer un retour, contactez notre service client avec votre numéro de commande.
            </p>
          </section>
          <div className="info-cta">
            <p>Une question sur une livraison en cours ou un retour ?</p>
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
