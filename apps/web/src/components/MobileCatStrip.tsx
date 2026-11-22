import Link from 'next/link';
import { DEPARTMENTS } from '@saotech/shared';
import { collectionHref } from '../lib';

/** Rayons en pastilles rondes qui défilent sur une ligne (téléphone uniquement, masqué sur ordinateur par le CSS). */
export function MobileCatStrip() {
  return (
    <nav className="m-catstrip" aria-label="Rayons">
      {DEPARTMENTS.map((d) => (
        <Link key={d.slug} href={collectionHref(d.slug)}><span><i className={`fas ${d.icon}`} /></span><em>{d.name}</em></Link>
      ))}
    </nav>
  );
}
