'use client';
import { useState } from 'react';

export function FaqList({ faqs }: { faqs: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const toggle = (i: number) => setOpen((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  return (
    <div className="faq-list">
      {faqs.map((f, i) => (
        <div key={f.q} className={`faq-item${open.has(i) ? ' open' : ''}`} onClick={() => toggle(i)}>
          <button type="button" className="faq-question">
            {f.q}
            <span className="faq-toggle"><i className="fas fa-plus" /></span>
          </button>
          <div className="faq-answer">{f.a}</div>
        </div>
      ))}
    </div>
  );
}
