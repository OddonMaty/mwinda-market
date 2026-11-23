import { createHash, randomBytes } from 'node:crypto';

export interface GoogleProfile { sub: string; email: string; emailVerified: boolean; firstName: string; lastName: string }

/** Connexion Google (OAuth 2.0, flux « code » avec PKCE). Interface séparée pour pouvoir la simuler dans les tests. */
export interface GoogleOAuth {
  authUrl(state: string, challenge: string): string;
  exchange(code: string, verifier: string): Promise<GoogleProfile>;
}

export const newPkce = () => {
  const verifier = randomBytes(32).toString('base64url');
  return { verifier, challenge: createHash('sha256').update(verifier).digest('base64url') };
};

export class GoogleClient implements GoogleOAuth {
  constructor(private clientId: string, private clientSecret: string, private redirectUri: string) {}

  authUrl(state: string, challenge: string): string {
    const q = new URLSearchParams({
      client_id: this.clientId, redirect_uri: this.redirectUri, response_type: 'code', scope: 'openid email profile',
      state, code_challenge: challenge, code_challenge_method: 'S256', prompt: 'select_account',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
  }

  async exchange(code: string, verifier: string): Promise<GoogleProfile> {
    const tok = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, signal: AbortSignal.timeout(8000),
      body: new URLSearchParams({ code, client_id: this.clientId, client_secret: this.clientSecret, redirect_uri: this.redirectUri, grant_type: 'authorization_code', code_verifier: verifier }),
    });
    if (!tok.ok) throw new Error(`google_token_${tok.status}`);
    const { access_token } = (await tok.json()) as { access_token?: string };
    if (!access_token) throw new Error('google_no_token');
    const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { authorization: `Bearer ${access_token}` }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`google_userinfo_${res.status}`);
    const p = (await res.json()) as { sub?: string; email?: string; email_verified?: boolean; given_name?: string; family_name?: string; name?: string };
    if (!p.sub || !p.email) throw new Error('google_profile_incomplete');
    const [first = '', ...rest] = (p.name ?? '').split(' ');
    return { sub: p.sub, email: p.email.toLowerCase(), emailVerified: p.email_verified === true, firstName: (p.given_name ?? first) || 'Client', lastName: (p.family_name ?? rest.join(' ')) || '-' };
  }
}
