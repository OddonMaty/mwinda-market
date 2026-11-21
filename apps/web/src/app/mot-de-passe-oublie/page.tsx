import { Header, Footer } from '../../components/Chrome';
import { ForgotPassword } from '../../components/AuthPages';

export const metadata = { title: 'Mot de passe oublié - Mwinda Market' };

export default function Page() {
  return (
    <>
      <Header active="" />
      <div className="page-header" data-theme="compte"><h1>Mot de passe oublié</h1><p>Recevez un lien pour réinitialiser votre mot de passe</p></div>
      <div className="container"><ForgotPassword /></div>
      <Footer />
    </>
  );
}
