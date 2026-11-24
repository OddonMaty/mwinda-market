import Link from 'next/link';
import { DEPARTMENTS } from '@saotech/shared';
import { collectionHref } from '../lib';

/** Rayons en pastilles rondes qui défilent sur une ligne (téléphone uniquement, masqué sur ordinateur par le CSS). */
export function MobileCatStrip({ active, withAll }: { active?: string; withAll?: boolean }) {
  return (
    <nav className="m-catstrip" aria-label="Rayons">
      {withAll && <Link href="/collection" className={!active || active === 'All' ? 'on' : ''}><span><i className="fas fa-border-all" /></span><em>Tous</em></Link>}
      {DEPARTMENTS.map((d) => (
        <Link key={d.slug} href={collectionHref(d.slug)} className={active === d.slug ? 'on' : ''}><span><i className={`fas ${d.icon}`} /></span><em>{d.name}</em></Link>
      ))}
    </nav>
  );
}
