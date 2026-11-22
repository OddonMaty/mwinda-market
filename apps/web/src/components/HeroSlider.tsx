'use client';
import { useEffect, useRef, useState } from 'react';

export interface Slide { tag: string; title: [string, string]; text: string; image: string; priceLabel: string }

export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [cur, setCur] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCur((c) => (c + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);
  const x0 = useRef<number | null>(null);
  const go = (n: number) => setCur((c) => (c + n + slides.length) % slides.length);
  return (
    <section className="hero-slider" onTouchStart={(e) => { x0.current = e.touches[0]?.clientX ?? null; }} onTouchEnd={(e) => { if (x0.current === null) return; const dx = (e.changedTouches[0]?.clientX ?? x0.current) - x0.current; x0.current = null; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); }}>
      {slides.map((s, i) => (
        <div key={s.tag} className={`hero-slide${i === cur ? ' active' : ''}`} style={{ backgroundImage: `url('${s.image}')` }}>
          <div className="hero-content">
            <span className="hero-tag">{s.tag}</span>
            <h1>{s.title[0]}<br />{s.title[1]}</h1>
            <p>{s.text}</p>
            <p className="hero-price">{s.priceLabel}</p>
            <button type="button" className="btn btn-primary">Acheter maintenant <i className="fas fa-arrow-right" /></button>
          </div>
        </div>
      ))}
      <button type="button" className="hero-nav hero-prev" onClick={() => go(-1)}><i className="fas fa-chevron-left" /></button>
      <button type="button" className="hero-nav hero-next" onClick={() => go(1)}><i className="fas fa-chevron-right" /></button>
      <div className="hero-dots">
        {slides.map((s, i) => <button type="button" key={s.tag} className={i === cur ? 'active' : ''} onClick={() => setCur(i)} aria-label={`Diapositive ${i + 1}`} />)}
      </div>
    </section>
  );
}
