import type { Metadata } from 'next';
import { LegalPage } from '../../components/LegalPage';
import { getLegalPage } from '../../data/source';

export const metadata: Metadata = { title: 'Paiements - Mwinda Market' };
export const revalidate = 30;

export default async function Page() {
  return <LegalPage page={await getLegalPage('paiements')} />;
}
