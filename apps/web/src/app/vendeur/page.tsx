import { Header, Footer } from '../../components/Chrome';
import { SellerArea } from '../../components/SellerArea';

export const metadata = { title: 'Espace vendeur - Mwinda Market' };

export default function SellerPage() {
  return (
    <>
      <Header active="" />
      <div className="page-header">
        <h1>Devenez vendeur sur Mwinda Market</h1>
        <p>Ouvrez votre boutique en ligne et vendez vos produits électroniques à des milliers de clients, dans votre pays et partout en Afrique.</p>
      </div>
      <div className="container">
        <div id="sellerAreaContent"><SellerArea /></div>
      </div>
      <Footer />
    </>
  );
}
