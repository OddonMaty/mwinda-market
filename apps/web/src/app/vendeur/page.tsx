import { Header, Footer } from '../../components/Chrome';
import { SellerArea } from '../../components/SellerArea';

export const metadata = { title: 'Espace vendeur - Sao Tech Market' };

export default function SellerPage() {
  return (
    <>
      <Header active="" />
      <div className="page-header">
        <h1>Devenez vendeur sur Sao Tech Market</h1>
        <p>Ouvrez votre boutique en ligne et vendez vos produits électroniques à des milliers de clients à Bukavu, Uvira et partout en RDC.</p>
      </div>
      <div className="container">
        <div id="sellerAreaContent"><SellerArea /></div>
      </div>
      <Footer />
    </>
  );
}
