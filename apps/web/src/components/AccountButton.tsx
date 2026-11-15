'use client';

import { useAuth } from './AuthProvider';

/** Bouton « Compte » : connecté → /compte, sinon ouvre la fenêtre de connexion. */
export function AccountButton() {
  const { accountClick } = useAuth();
  return (
    <button type="button" className="header-btn" onClick={accountClick}>
      <i className="fas fa-user" /><span className="hidden-mobile">Compte</span>
    </button>
  );
}
