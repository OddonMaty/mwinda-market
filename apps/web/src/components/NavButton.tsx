'use client';
import { useRouter } from 'next/navigation';
import type { CSSProperties } from 'react';

/** <button> identique à l'ancien site (rendu exact), qui navigue vers `to`. */
export function NavButton({ to, className, style, children }: { to?: string; className?: string; style?: CSSProperties; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <button type="button" className={className} style={style} onClick={to ? () => router.push(to) : undefined}>
      {children}
    </button>
  );
}
