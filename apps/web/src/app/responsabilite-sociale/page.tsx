import type { Metadata } from 'next';
import { Header, Footer } from '../../components/Chrome';

export const metadata: Metadata = { title: 'Responsabilité sociale - Mwinda Market' };

export default function Page() {
  return (
    <>
      <Header active="" />
      <div className="page-header">
        <h1>Responsabilité sociale</h1>
        <p>Notre engagement envers les communautés africaines</p>
      </div>
      <div className="container">
        <div className="info-page">
          <section>
            <h2>Notre engagement local</h2>
            <p>
              Mwinda Market est une place de marché africaine, lancée en République démocratique du
              Congo. Une partie de notre mission consiste à rendre la technologie accessible tout en soutenant
              l'économie locale.
            </p>
          </section>
          <section>
            <h2>Emploi local</h2>
            <p>
              Nous privilégions le recrutement local dans chaque ville où nous nous implantons, pour
              la logistique, la livraison et le service client, et nous aidons les commerçants
              locaux à vendre en ligne.
            </p>
          </section>
          <section>
            <h2>Recyclage des appareils électroniques</h2>
            <p>
              Nous encourageons nos clients à nous rapporter leurs anciens appareils électroniques
              lors d'un nouvel achat en magasin, afin de garantir un recyclage responsable plutôt
              qu'un rejet dans la nature.
            </p>
          </section>
          <section>
            <h2>Accès à la technologie</h2>
            <p>
              Nous proposons régulièrement des offres réduites sur du matériel reconditionné pour
              les écoles et associations locales. Contactez-nous pour en savoir plus sur nos
              partenariats éducatifs.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}
