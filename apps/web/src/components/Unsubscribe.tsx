'use client';
import { useState } from 'react';
import { api } from './AuthProvider';
import { T } from './I18n';

export function Unsubscribe({ token }: { token: string }) {
  const [state, setState] = useState<'idle' | 'done' | 'error'>('idle');
  async function go() {
    const r = await api<{ done?: boolean }>('/newsletter/unsubscribe', { method: 'POST', body: { token } });
    setState(r.ok ? 'done' : 'error');
  }
  return (
    <div style={{ textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.4rem' }}><T>Désabonnement de la newsletter</T></h1>
      {state === 'done' ? <p><T>Vous êtes désabonné(e). Vous ne recevrez plus nos e-mails.</T></p>
        : !token ? <p><T>Lien de désabonnement invalide.</T></p>
        : (<>
          <p><T>Confirmez-vous ne plus vouloir recevoir la newsletter Mwinda Market ?</T></p>
          <button type="button" className="btn btn-primary" onClick={go}><T>Me désabonner</T></button>
          {state === 'error' && <p style={{ color: '#b00020' }}><T>Lien invalide ou expiré.</T></p>}
        </>)}
    </div>
  );
}
