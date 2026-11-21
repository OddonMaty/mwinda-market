import { Header, Footer } from '../../components/Chrome';
import { PlansArea } from '../../components/PlansArea';

export const metadata = { title: 'Tarifs vendeurs - Mwinda Market' };

export default function Page() {
  return (
    <>
      <Header active="" />
      <div className="page-header" data-theme="tarifs">
        <h1>Tarifs vendeurs</h1>
        <p>Commencez gratuitement, payez moins de commission quand votre boutique grandit.</p>
      </div>
      <div className="container" style={{ paddingTop: '3.5rem', paddingBottom: '4rem' }}>
        <PlansArea />
      </div>
      <Footer />
    </>
  );
}
