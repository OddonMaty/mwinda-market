import type { Metadata } from 'next';
import { Header, Footer } from '../../components/Chrome';
import { NavButton } from '../../components/NavButton';

export const metadata: Metadata = { title: 'Carrières - Sao Tech Market' };

export default function Page() {
  return (
    <>
      <Header active="" />
      <div className="page-header">
        <h1>Carrières</h1>
        <p>Rejoignez l'équipe Sao Tech Market à Bukavu ou Uvira</p>
      </div>
      <div className="container">
        <div className="info-page">
          <section>
            <h2>Pourquoi nous rejoindre ?</h2>
            <p>
              Nous sommes une équipe en pleine croissance qui veut changer la façon dont la
              technologie est distribuée en RDC. Nous valorisons l'initiative, la rigueur et le sens
              du service client.
            </p>
          </section>
          <section>
            <h2>Postes ouverts</h2>
            <div className="job-card">
              <div className="job-meta">
                <span>Bukavu</span>
                <span>Temps plein</span>
              </div>
              <h3>Agent(e) de service client</h3>
              <p>
                Répondre aux demandes des clients par téléphone, WhatsApp et en agence ; suivre les
                commandes et les retours.
              </p>
            </div>
            <div className="job-card">
              <div className="job-meta">
                <span>Uvira</span>
                <span>Temps plein</span>
              </div>
              <h3>Livreur / Livreuse</h3>
              <p>
                Assurer la livraison des commandes dans Uvira et ses environs, avec suivi rigoureux
                des créneaux horaires.
              </p>
            </div>
            <div className="job-card">
              <div className="job-meta">
                <span>Bukavu</span>
                <span>Stage</span>
              </div>
              <h3>Assistant(e) marketing digital</h3>
              <p>
                Participer à la gestion des réseaux sociaux et à la mise en avant des nouveaux
                produits sur le site.
              </p>
            </div>
          </section>
          <div className="info-cta">
            <p>Intéressé(e) par un poste ? Envoyez-nous votre candidature.</p>
            <NavButton className="btn btn-primary" to="/contact">
              Postuler maintenant
            </NavButton>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
