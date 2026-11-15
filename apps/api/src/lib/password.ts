import { hash, verify } from '@node-rs/argon2';

// Paramètres argon2id recommandés par l'OWASP : 19 MiB, 2 itérations, 1 thread.
const OPTS = { algorithm: 2 /* Argon2id */, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

const COMMON = new Set(
  ['password', 'password1', 'password123', '12345678', '123456789', '1234567890', '123123123', 'qwertyui', 'qwerty123', 'azertyui', 'azerty123',
    'motdepasse', 'motdepasse1', 'iloveyou', 'abc12345', 'letmein1', 'welcome1', 'admin123', 'administrator', '11111111', '00000000', 'saotechmarket',
    'saotech123', 'bukavu123', 'goma1234', 'congo1234', 'kinshasa1', 'azertyuiop', 'qwertyuiop', 'passw0rd', 'p@ssw0rd', 'changeme', 'trustno1'],
);

export type PasswordProblem = 'too_short' | 'too_common' | 'contains_email';

export function checkPassword(password: string, email: string): PasswordProblem | null {
  if (password.length < 8) return 'too_short';
  const p = password.toLowerCase();
  if (COMMON.has(p) || /^(.)\1+$/.test(p)) return 'too_common';
  const local = email.toLowerCase().split('@')[0] ?? '';
  if (p.includes(email.toLowerCase()) || (local.length >= 4 && p.includes(local))) return 'contains_email';
  return null;
}

export const hashPassword = (password: string): Promise<string> => hash(password, OPTS);
export async function verifyPassword(stored: string, password: string): Promise<boolean> {
  try {
    return await verify(stored, password);
  } catch {
    return false;
  }
}
