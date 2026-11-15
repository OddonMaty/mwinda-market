import { createHash, randomBytes } from 'node:crypto';
import { ulid } from 'ulid';

/** Jeton aléatoire de 32 octets (crypto), encodé pour les URL. */
export const newToken = (): string => randomBytes(32).toString('base64url');
/** Seul ce hash est enregistré en base, jamais le jeton. */
export const hashToken = (t: string): string => createHash('sha256').update(t).digest('hex');
export const newId = (): string => ulid();
