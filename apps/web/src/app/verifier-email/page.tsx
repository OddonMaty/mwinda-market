import { Header, Footer } from '../../components/Chrome';
import { VerifyEmail } from '../../components/AuthPages';

export const metadata = { title: "Confirmation de l'e-mail - Sao Tech Market" };

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <>
      <Header active="" />
      <div className="page-header"><h1>Confirmation de l&apos;e-mail</h1><p>Activation de votre compte Sao Tech Market</p></div>
      <div className="container"><VerifyEmail token={token} /></div>
      <Footer />
    </>
  );
}
