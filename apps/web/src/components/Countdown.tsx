'use client';
import { useEffect, useState } from 'react';

function left() {
  const ms = new Date().setHours(23, 59, 59, 999) - Date.now();
  return { h: Math.floor((ms % 86_400_000) / 3_600_000), m: Math.floor((ms % 3_600_000) / 60_000), s: Math.floor((ms % 60_000) / 1000) };
}

export function Countdown() {
  const [t, setT] = useState<{ h: number; m: number; s: number } | null>(null);
  useEffect(() => {
    setT(left());
    const i = setInterval(() => setT(left()), 1000);
    return () => clearInterval(i);
  }, []);
  const p = (n: number) => String(n).padStart(2, '0');
  const cells: [string, number | undefined][] = [['H', t?.h], ['MIN', t?.m], ['S', t?.s]];
  return (
    <div className="countdown-timer">
      {cells.map(([label, v]) => (
        <div className="countdown-item" key={label}>
          <div className="countdown-value">{v === undefined ? '--' : p(v)}</div>
          <div className="countdown-label">{label}</div>
        </div>
      ))}
    </div>
  );
}
