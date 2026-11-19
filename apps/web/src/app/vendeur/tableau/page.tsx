import { Header, Footer } from '../../../components/Chrome';
import { SellerDashboard } from '../../../components/SellerDashboard';

export const metadata = { title: 'Tableau de bord vendeur - Mwinda Market' };

export default function SellerDashboardPage() {
  return (
    <>
      <Header active="" />
      <div className="container">
        <div id="sellerDashboardContent"><SellerDashboard /></div>
      </div>
      <Footer />
    </>
  );
}
