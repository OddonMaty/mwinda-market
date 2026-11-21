'use client';

import { Sparkles, X } from 'lucide-react';
import { Button } from './button';

/** Chargement plein écran : un cercle orange qui tourne au centre de la page. */
export function PageLoader({ label = 'Chargement' }: { label?: string }) {
  return (
    <div className="ui ui-shell flex min-h-screen items-center justify-center bg-background" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <span className="block size-14 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}

/** Message d'accueil à l'ouverture d'un espace ; se ferme pour laisser voir le tableau de bord. */
export function WelcomeDialog({ title, text, action = 'Accéder à mon espace', onClose }: { title: string; text: string; action?: string; onClose: () => void }) {
  return (
    <div className="ui fixed inset-0 z-[4000] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="relative w-full max-w-md rounded-2xl bg-card p-8 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} aria-label="Fermer" className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted"><X className="size-4" /></button>
        <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary"><Sparkles className="size-7" /></span>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
        <Button className="mt-6 w-full" onClick={onClose} data-welcome-close>{action}</Button>
      </div>
    </div>
  );
}
