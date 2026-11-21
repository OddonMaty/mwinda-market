import { Header, Footer } from '../../components/Chrome';
import { VerifyEmail } from '../../components/AuthPages';

export const metadata = { title: "Confirmation de l'e-mail - Mwinda Market" };

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <>
      <Header active="" />
      <div className="page-header" data-theme="compte"><h1>Confirmation de l&apos;e-mail</h1><p>Activation de votre compte Mwinda Market</p></div>
      <div className="container"><VerifyEmail token={token} /></div>
      <Footer />
    </>
  );
}
