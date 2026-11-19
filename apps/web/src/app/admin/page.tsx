import { Header, Footer } from '../../components/Chrome';
import { AdminArea } from '../../components/AdminArea';

export const metadata = { title: 'Administration - Mwinda Market', robots: { index: false, follow: false } };

export default function Page() {
  return (
    <>
      <Header active="" />
      <div className="page-header">
        <h1>Administration</h1>
        <p>Gérez la plateforme : utilisateurs, boutiques, produits, commandes, plans et textes.</p>
      </div>
      <div className="container" style={{ paddingBottom: '3rem' }}>
        <AdminArea />
      </div>
      <Footer />
    </>
  );
}
