import { Header, Footer } from '../../components/Chrome';
import { AccountArea } from '../../components/AccountArea';

export const metadata = { title: 'Mon compte - Mwinda Market' };

export default function AccountPage() {
  return (
    <>
      <Header active="" />
      <div className="page-header">
        <h1>Mon compte</h1>
        <p>Suivez vos commandes, gérez vos informations et retrouvez votre historique d&apos;achats</p>
      </div>
      <div className="container">
        <div id="accountAreaContent"><AccountArea /></div>
      </div>
      <Footer />
    </>
  );
}
