'use client';
import { countryName } from '../i18n/translate';
import { useI18n } from './I18n';

/** « Ville, Pays » avec le pays dans la langue choisie. */
export function Place({ city, country }: { city?: string | null; country?: string | null }) {
  const { lang } = useI18n();
  return <>{[city, country && countryName(lang, country)].filter(Boolean).join(', ')}</>;
}
