'use client';
import { nowLocale, useI18n } from './I18n';

/** Date affichée dans la langue choisie (utilisable depuis un composant serveur). */
export function LocalDate({ iso }: { iso: string }) {
  useI18n();
  return <>{new Date(iso).toLocaleDateString(nowLocale(), { day: 'numeric', month: 'long', year: 'numeric' })}</>;
}
