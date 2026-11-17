import { Header, Footer } from '../../components/Chrome';
import { CheckoutArea } from '../../components/CheckoutArea';

export const metadata = { title: 'Finaliser ma commande - Sao Tech Market' };

export default function CheckoutPage() {
  return (
    <>
      <Header active="" />
      <div className="page-header">
        <h1>Finaliser ma commande</h1>
        <p>Vérifiez votre commande et indiquez votre adresse de livraison</p>
      </div>
      <div className="container">
        <div id="checkoutContent"><CheckoutArea /></div>
      </div>
      <Footer />
    </>
  );
}
