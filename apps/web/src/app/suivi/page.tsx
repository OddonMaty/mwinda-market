import { Suspense } from 'react';
import { TrackingArea } from '../../components/Tracking';

export const metadata = { title: 'Suivre ma commande - Mwinda Market', robots: { index: false, follow: false } };

export default function TrackingPage() {
  return <Suspense><TrackingArea /></Suspense>;
}
