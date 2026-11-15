'use client';
import { useRouter } from 'next/navigation';

/** <button> identique à l'ancien site (rendu exact), qui navigue vers `to`. */
export function NavButton({ to, className, children }: { to?: string; className?: string; children: React.ReactNode }) {
  const router = useRouter();
  return (
    <button type="button" className={className} onClick={to ? () => router.push(to) : undefined}>
      {children}
    </button>
  );
}
