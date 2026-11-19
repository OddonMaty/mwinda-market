import type { Metadata } from 'next';
import { Header, Footer } from '../../components/Chrome';
import { LegalPage } from '../../components/LegalPage';
import { getLegalPage } from '../../data/source';
import { NavButton } from '../../components/NavButton';

export const metadata: Metadata = { title: 'Livraison & Retours - Mwinda Market' };

function StaticPage() {
  return (
    <>
      <Header active="" />
      <div className="page-header">
        <h1>Livraison & Retours</h1>
        <p>Tout ce qu'il faut savoir sur la réception et le retour de vos commandes en Afrique</p>
      </div>
      <div className="container">
        <div className="info-page">
          <section>
            <h2>Zones de livraison</h2>
            <p>
              Mwinda Market est une place de marché africaine : chaque boutique indique le pays et la
              ville d'où elle expédie. Les frais et les délais de livraison dépendent de la boutique
              et de votre ville ; ils vous sont confirmés par le vendeur lors de la validation de
              votre commande. La plateforme démarre en République démocratique du Congo et
              s'ouvre progressivement aux autres pays africains.
            </p>
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
              <li>Les conditions de retour (frais, délais) sont précisées par chaque boutique</li>
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

export const revalidate = 30;

export default async function Page() {
  const page = await getLegalPage('livraison');
  return page ? <LegalPage page={page} /> : <StaticPage />;
}
