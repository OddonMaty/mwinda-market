'use client';

import Link from 'next/link';
import { useState } from 'react';
import { DEPARTMENTS } from '@saotech/shared';
import { collectionHref } from '../lib';

/** Menu des catégories (rayons) avec volet des sous-catégories au survol, comme sur Alibaba. */
export function CategorySidebar({ active, className = '' }: { active?: string; className?: string }) {
  const [hover, setHover] = useState<string | null>(null);
  const dep = DEPARTMENTS.find((d) => d.slug === hover);
  return (
    <aside className={`cat-sidebar ${className}`} onMouseLeave={() => setHover(null)}>
      <p className="cat-sidebar-title"><i className="fas fa-bars" /> Toutes les catégories</p>
      <ul className="cat-sidebar-list">
        {DEPARTMENTS.map((d) => (
          <li key={d.slug} onMouseEnter={() => setHover(d.slug)} className={hover === d.slug || active === d.slug ? 'on' : ''}>
            <Link href={collectionHref(d.slug)}><i className={`fas ${d.icon}`} /><span>{d.name}</span><i className="fas fa-chevron-right cat-arrow" /></Link>
          </li>
        ))}
      </ul>
      {dep && (
        <div className="cat-flyout">
          <p className="cat-flyout-title"><Link href={collectionHref(dep.slug)}>{dep.name}</Link></p>
          <div className="cat-flyout-grid">
            {dep.categories.map((c) => <Link key={c} href={collectionHref(dep.slug, c)}>{c}</Link>)}
          </div>
        </div>
      )}
    </aside>
  );
}
