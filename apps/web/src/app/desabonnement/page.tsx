import { Header, Footer } from '../../components/Chrome';
import { Unsubscribe } from '../../components/Unsubscribe';

export const metadata = { title: 'Désabonnement - Mwinda Market', robots: { index: false, follow: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (<><Header active="" /><div className="container" style={{ padding: '2rem 0', maxWidth: 520 }}><Unsubscribe token={token ?? ''} /></div><Footer /></>);
}
