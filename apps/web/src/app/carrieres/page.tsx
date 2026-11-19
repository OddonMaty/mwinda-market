import type { Metadata } from 'next';
import { Header, Footer } from '../../components/Chrome';
import { NavButton } from '../../components/NavButton';

export const metadata: Metadata = { title: 'Carrières - Mwinda Market' };

export default function Page() {
  return (
    <>
      <Header active="" />
      <div className="page-header">
        <h1>Carrières</h1>
        <p>Rejoignez l'équipe Mwinda Market</p>
      </div>
      <div className="container">
        <div className="info-page">
          <section>
            <h2>Pourquoi nous rejoindre ?</h2>
            <p>
              Nous sommes une équipe en pleine croissance qui veut changer la façon dont la
              technologie est distribuée en Afrique. Nous valorisons l'initiative, la rigueur et le sens
              du service client.
            </p>
          </section>
          <section>
            <h2>Postes ouverts</h2>
            <p>
              Aucun poste n'est ouvert pour le moment. Vous pouvez tout de même nous écrire une
              candidature spontanée en nous présentant votre parcours et la ville où vous souhaitez
              travailler : nous reviendrons vers vous dès qu'un besoin se présente.
            </p>
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
