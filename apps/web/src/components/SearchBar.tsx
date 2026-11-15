'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { collectionHref } from '../lib';

export function SearchBar({ initial = '' }: { initial?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const go = () => {
    const q = value.trim();
    if (q) router.push(collectionHref(undefined, undefined, q));
  };
  return (
    <div className="search-bar">
      <input
        type="text"
        id="searchInput"
        placeholder="Rechercher un produit, une marque, une catégorie…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } }}
      />
      <button type="button" onClick={go}><i className="fas fa-search" /></button>
    </div>
  );
}
