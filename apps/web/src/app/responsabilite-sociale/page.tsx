import type { Metadata } from 'next';
import { Header, Footer } from '../../components/Chrome';

export const metadata: Metadata = { title: 'Responsabilité sociale - Sao Tech Market' };

export default function Page() {
  return (
    <>
      <Header active="" />
      <div className="page-header">
        <h1>Responsabilité sociale</h1>
        <p>Notre engagement envers les communautés de Bukavu et d'Uvira</p>
      </div>
      <div className="container">
        <div className="info-page">
          <section>
            <h2>Notre engagement local</h2>
            <p>
              Sao Tech Market est né à Bukavu et reste profondément ancré dans l'Est de la RDC. Une
              partie de notre mission consiste à rendre la technologie accessible tout en soutenant
              l'économie locale.
            </p>
          </section>
          <section>
            <h2>Emploi local</h2>
            <p>
              Nos deux agences, à Bukavu et à Uvira, emploient exclusivement du personnel local pour
              la logistique, la livraison et le service client.
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
