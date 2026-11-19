import { Header, Footer } from '../../components/Chrome';
import { ResetPassword } from '../../components/AuthPages';

export const metadata = { title: 'Nouveau mot de passe - Mwinda Market' };

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <>
      <Header active="" />
      <div className="page-header"><h1>Nouveau mot de passe</h1><p>Choisissez un nouveau mot de passe pour votre compte</p></div>
      <div className="container"><ResetPassword token={token} /></div>
      <Footer />
    </>
  );
}
