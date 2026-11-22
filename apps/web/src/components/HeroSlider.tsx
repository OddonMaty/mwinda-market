'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export interface Slide { id: string; tag: string; title: string; text: string; image: string; priceLabel: string; href: string }

export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [cur, setCur] = useState(0);
  const many = slides.length > 1;
  useEffect(() => {
    if (!many) return;
    const t = setInterval(() => setCur((c) => (c + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length, many]);
  const x0 = useRef<number | null>(null);
  const go = (n: number) => setCur((c) => (c + n + slides.length) % slides.length);
  return (
    <section className="hero-slider" onTouchStart={(e) => { x0.current = e.touches[0]?.clientX ?? null; }} onTouchEnd={(e) => { if (x0.current === null || !many) return; const dx = (e.changedTouches[0]?.clientX ?? x0.current) - x0.current; x0.current = null; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); }}>
      {slides.map((s, i) => (
        <div key={s.id} className={`hero-slide${i === cur ? ' active' : ''}`} style={{ backgroundImage: s.image ? `url('${s.image}')` : 'linear-gradient(135deg,#0b3d2e,#1a7f5a)' }}>
          <div className="hero-content">
            {s.tag && <span className="hero-tag">{s.tag}</span>}
            <h1>{s.title}</h1>
            {s.text && <p>{s.text}</p>}
            {s.priceLabel && <p className="hero-price">{s.priceLabel}</p>}
            <Link href={s.href} className="btn btn-primary">Découvrir <i className="fas fa-arrow-right" /></Link>
          </div>
        </div>
      ))}
      {many && <button type="button" className="hero-nav hero-prev" onClick={() => go(-1)} aria-label="Précédent"><i className="fas fa-chevron-left" /></button>}
      {many && <button type="button" className="hero-nav hero-next" onClick={() => go(1)} aria-label="Suivant"><i className="fas fa-chevron-right" /></button>}
      {many && (
        <div className="hero-dots">
          {slides.map((s, i) => <button type="button" key={s.id} className={i === cur ? 'active' : ''} onClick={() => setCur(i)} aria-label={`Diapositive ${i + 1}`} />)}
        </div>
      )}
    </section>
  );
}
