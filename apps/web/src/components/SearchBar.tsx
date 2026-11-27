'use client';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { DEPARTMENTS } from '@saotech/shared';
import { useT } from './I18n';
import { collectionHref, formatUsd, productImageUrl } from '../lib';

interface ShopHit { name: string; slug: string; city: string | null; country: string | null; certified: boolean; productCount: number }
interface Suggestion { id: number; name: string; priceUsd: number; category: string; image: string | null }

/** Recherche reliée au catalogue : suggestions de produits et de rayons pendant la frappe. */
export function SearchBar({ initial = '' }: { initial?: string }) {
  const router = useRouter();
  const t = useT();
  const [value, setValue] = useState(initial);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [shops, setShops] = useState<ShopHit[]>([]);
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const box = useRef<HTMLDivElement>(null);
  const q = value.trim();

  useEffect(() => {
    if (q.length < 2) { setItems([]); setShops([]); return; }
    const ctl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/v1/products/suggest?q=${encodeURIComponent(q)}`, { signal: ctl.signal })
        .then((r) => (r.ok ? r.json() : { suggestions: [] }))
        .then((d: { suggestions: Suggestion[] }) => { setItems(d.suggestions); setCursor(-1); })
        .catch(() => {});
      fetch(`/api/v1/shops?q=${encodeURIComponent(q)}&limit=3`, { signal: ctl.signal })
        .then((r) => (r.ok ? r.json() : { shops: [] }))
        .then((d: { shops: ShopHit[] }) => setShops(d.shops))
        .catch(() => {});
    }, 200);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q]);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const norm = (v: string) => v.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const rayons = q.length >= 2 ? DEPARTMENTS.filter((d) => norm(d.name).includes(norm(q))).slice(0, 3) : [];
  const go = (text = q) => { const t = text.trim(); if (t) { setOpen(false); router.push(collectionHref(undefined, undefined, t)); } };
  const goProduct = (id: number) => { setOpen(false); router.push(`/produit/${id}`); };

  function onKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setCursor((c) => Math.min(c + 1, items.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, -1)); }
    else if (e.key === 'Escape') setOpen(false);
    else if (e.key === 'Enter') { e.preventDefault(); const it = items[cursor]; if (open && it) goProduct(it.id); else go(); }
  }

  return (
    <div className="search-bar" ref={box} style={{ position: 'relative' }}>
      <input
        type="text"
        id="searchInput"
        autoComplete="off"
        role="combobox"
        aria-expanded={open && (items.length > 0 || rayons.length > 0 || shops.length > 0)}
        placeholder={t('Rechercher un produit, une boutique…')}
        value={value}
        onChange={(e) => { setValue(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
      />
      <button type="button" onClick={() => go()} aria-label="Rechercher"><i className="fas fa-search" /></button>
      {open && q.length >= 2 && (items.length > 0 || rayons.length > 0 || shops.length > 0) && (
        <div className="search-suggest" role="listbox">
          {rayons.map((d) => (
            <button type="button" key={d.slug} className="search-sug-row" onClick={() => { setOpen(false); router.push(collectionHref(d.slug)); }}>
              <i className={`fas ${d.icon}`} /><span><b>{d.name}</b><small>Rayon</small></span>
            </button>
          ))}
          {shops.map((s) => (
            <button type="button" key={s.slug} className="search-sug-row" onClick={() => { setOpen(false); router.push(`/boutique/${s.slug}`); }}>
              <i className="fas fa-store" /><span><b>{s.name}{s.certified && <i className="fas fa-check-circle" style={{ marginLeft: 6, color: 'var(--primary)', width: 'auto' }} />}</b><small>{t('Boutique')}{[s.city, s.country].filter(Boolean).length ? ` · ${[s.city, s.country].filter(Boolean).join(', ')}` : ''}</small></span>
            </button>
          ))}
          {items.map((p, i) => (
            <button type="button" key={p.id} role="option" aria-selected={i === cursor} className={`search-sug-row${i === cursor ? ' active' : ''}`} onClick={() => goProduct(p.id)}>
              {p.image ? <img src={productImageUrl(p.image, 80, 80)} alt="" /> : <i className="fas fa-box" />}
              <span><b>{p.name}</b><small>{p.category}</small></span><em>{formatUsd(p.priceUsd)}</em>
            </button>
          ))}
          <button type="button" className="search-sug-all" onClick={() => go()}>{t('Voir tous les résultats pour « {0} »', q)}</button>
          {shops.length > 0 && <button type="button" className="search-sug-all" onClick={() => { setOpen(false); router.push(`/boutiques?q=${encodeURIComponent(q)}`); }}>{t('Voir toutes les boutiques pour « {0} »', q)}</button>}
        </div>
      )}
    </div>
  );
}
