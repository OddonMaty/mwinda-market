'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage, useAuth } from './AuthProvider';

interface SessionRow { id: string; kind: string; createdAt: string; lastUsedAt: string; userAgent: string | null; ip: string | null; current: boolean }

const fmt = (d: string) => new Date(d).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

export function AccountArea() {
  const { user, ready, openLogin, logout, notify, refresh } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[]>([]);

  const loadSessions = useCallback(async () => {
    const r = await api<{ sessions: SessionRow[] }>('/me/sessions');
    if (r.ok) setSessions(r.data.sessions);
  }, []);
  useEffect(() => { if (user) void loadSessions(); }, [user, loadSessions]);

  if (!ready) return <p className="empty-collection">Chargement…</p>;

  if (!user) {
    return (
      <div className="seller-landing" style={{ gridTemplateColumns: '1fr' }}>
        <div className="seller-auth-card" style={{ maxWidth: 420, margin: '0 auto' }}>
          <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>Connectez-vous ou créez un compte pour suivre vos commandes, enregistrer vos adresses et retrouver votre historique d&apos;achats.</p>
          <button type="button" className="btn btn-primary full-width" onClick={() => openLogin('signin')}>Se connecter / Créer un compte</button>
        </div>
      </div>
    );
  }

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await api('/me', { method: 'PATCH', body: { firstName: f.get('firstName'), lastName: f.get('lastName'), phone: String(f.get('phone') ?? '').replace(/[\s.-]/g, '') } });
    if (!r.ok) return notify(errorMessage(r.data.code));
    await refresh();
    notify('Profil mis à jour');
  }

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const r = await api('/auth/change-password', { method: 'POST', body: { oldPassword: f.get('oldPassword'), newPassword: f.get('newPassword') } });
    if (!r.ok) return notify(errorMessage(r.data.code));
    form.reset();
    await loadSessions();
    notify('Mot de passe modifié. Vos autres appareils ont été déconnectés.');
  }

  async function revoke(id: string) {
    const r = await api(`/me/sessions/${id}`, { method: 'DELETE' });
    if (!r.ok) return notify(errorMessage(r.data.code));
    await loadSessions();
    notify('Appareil déconnecté');
  }

  return (
    <>
      <div className="seller-dashboard-header">
        <div>
          <h1>{user.firstName} {user.lastName}</h1>
          <p>{user.email}{user.phone ? ` · ${user.phone}` : ''}{user.emailVerified ? '' : ' · e-mail non vérifié'}</p>
        </div>
        <div className="seller-dashboard-actions">
          <button type="button" className="btn btn-outline" onClick={() => void logout()}>Déconnexion</button>
        </div>
      </div>

      <div className="seller-products-table-wrapper">
        <h2>Mes informations</h2>
        <form onSubmit={saveProfile} key={user.id + user.firstName + user.lastName + user.phone}>
          <div className="form-row">
            <input type="text" name="firstName" defaultValue={user.firstName} placeholder="Prénom *" required />
            <input type="text" name="lastName" defaultValue={user.lastName} placeholder="Nom *" required />
          </div>
          <div className="form-group"><input type="tel" name="phone" defaultValue={user.phone ?? ''} placeholder="Téléphone (+243...)" required /></div>
          <button type="submit" className="btn btn-primary">Enregistrer</button>
        </form>
      </div>

      <div className="seller-products-table-wrapper">
        <h2>Mot de passe</h2>
        <form onSubmit={changePassword}>
          <div className="form-group"><input type="password" name="oldPassword" placeholder="Mot de passe actuel *" required /></div>
          <div className="form-group"><input type="password" name="newPassword" placeholder="Nouveau mot de passe (8 caractères minimum) *" required minLength={8} /></div>
          <button type="submit" className="btn btn-primary">Changer le mot de passe</button>
        </form>
      </div>

      <div className="seller-products-table-wrapper">
        <h2>Appareils connectés</h2>
        {sessions.map((s) => (
          <div key={s.id} className="seller-dashboard-header" style={{ padding: '0.75rem 0', marginBottom: 0 }}>
            <div>
              <p style={{ fontWeight: 600 }}>{s.userAgent ?? 'Appareil inconnu'}{s.current ? ' (cet appareil)' : ''}</p>
              <p>Connecté le {fmt(s.createdAt)} · dernière activité {fmt(s.lastUsedAt)}</p>
            </div>
            {!s.current && <button type="button" className="btn btn-outline" onClick={() => void revoke(s.id)}>Déconnecter</button>}
          </div>
        ))}
      </div>

      <div className="seller-products-table-wrapper">
        <h2>Mes commandes</h2>
        <p className="empty-collection">Vous n&apos;avez pas encore passé de commande. Vos achats apparaîtront ici.</p>
      </div>
    </>
  );
}
