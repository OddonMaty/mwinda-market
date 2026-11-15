'use client';
import { useEffect, useState } from 'react';

export interface Slide { tag: string; title: [string, string]; text: string; image: string; priceLabel: string }

export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [cur, setCur] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setCur((c) => (c + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);
  const go = (n: number) => setCur((c) => (c + n + slides.length) % slides.length);
  return (
    <section className="hero-slider">
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
