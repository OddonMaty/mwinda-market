'use client';

import { useT } from './I18n';
import { useAuth } from './AuthProvider';

/** Bouton « Compte » : connecté → /compte, sinon ouvre la fenêtre de connexion. */
export function AccountButton() {
  const { accountClick } = useAuth();
  const t = useT();
  return (
    <button type="button" className="header-btn" onClick={accountClick}>
      <i className="fas fa-user" /><span className="hidden-mobile">{t('Compte')}</span>
    </button>
  );
}
