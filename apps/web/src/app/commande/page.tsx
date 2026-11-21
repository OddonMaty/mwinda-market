import { Header, Footer } from '../../components/Chrome';
import { CheckoutArea } from '../../components/CheckoutArea';

export const metadata = { title: 'Finaliser ma commande - Mwinda Market' };

export default function CheckoutPage() {
  return (
    <>
      <Header active="" />
      <div className="page-header" data-theme="commande">
        <h1>Finaliser ma commande</h1>
        <p>Vérifiez votre commande et indiquez votre adresse de livraison</p>
      </div>
      <div className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
        <div id="checkoutContent"><CheckoutArea /></div>
      </div>
      <Footer />
    </>
  );
}
