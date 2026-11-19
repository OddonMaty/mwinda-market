import { Header, Footer } from '../../components/Chrome';
import { PlansArea } from '../../components/PlansArea';

export const metadata = { title: 'Tarifs vendeurs - Mwinda Market' };

export default function Page() {
  return (
    <>
      <Header active="" />
      <div className="page-header">
        <h1>Tarifs vendeurs</h1>
        <p>Commencez gratuitement, payez moins de commission quand votre boutique grandit.</p>
      </div>
      <div className="container" style={{ paddingBottom: '3rem' }}>
        <PlansArea />
      </div>
      <Footer />
    </>
  );
}
