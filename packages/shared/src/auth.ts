import { z } from 'zod';

const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(1).max(200);
const phone = z.string().trim().regex(/^\+[1-9][0-9]{6,14}$/, 'phone_e164');
const name = z.string().trim().min(1).max(80);
export const LOCALES = ['fr', 'en', 'sw', 'zh', 'es'] as const;
const locale = z.enum(LOCALES);

/** E-mail ou numéro (+243…, espaces et tirets tolérés) : renvoie l'identifiant normalisé. */
export function normalizeIdentifier(v: string): string {
  const t = v.trim();
  if (t.includes('@')) return t.toLowerCase();
  const digits = t.replace(/[\s().-]/g, '');
  return digits.startsWith('00') ? `+${digits.slice(2)}` : digits;
}
const identifier = z.string().trim().min(3).max(254).transform(normalizeIdentifier);
/** Accepte l'ancien champ `email` comme identifiant. */
const withIdentifier = (v: unknown) => (v && typeof v === 'object' && !('identifier' in v) && 'email' in v ? { ...(v as object), identifier: (v as { email: unknown }).email } : v);

export const RegisterBodySchema = z.object({
  email: z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), email.optional()),
  password,
  firstName: name,
  lastName: name,
  phone,
  countryCode: z.string().length(2).toUpperCase().default('CD'),
  citySlug: z.string().max(100).optional(),
  locale: locale.default('fr'),
});
export const LoginBodySchema = z.preprocess(withIdentifier, z.object({ identifier, password, client: z.enum(['web', 'api']).default('web') }));
export const ForgotBodySchema = z.preprocess(withIdentifier, z.object({ identifier }));
export const ResetPhoneBodySchema = z.object({ phone, code: z.string().regex(/^[0-9]{6}$/), password });
export const VerifyStartBodySchema = z.object({ channel: z.enum(['email', 'sms', 'whatsapp']) });
export const VerifyConfirmBodySchema = z.object({ code: z.string().regex(/^[0-9]{6}$/) });
export const TokenBodySchema = z.object({ token: z.string().min(20).max(100) });
export const EmailBodySchema = z.object({ email });
export const ResetPasswordBodySchema = z.object({ token: z.string().min(20).max(100), password });
export const ChangePasswordBodySchema = z.object({ oldPassword: password, newPassword: password });
export const UpdateProfileBodySchema = z
  .object({ firstName: name, lastName: name, phone, countryCode: z.string().length(2).toUpperCase(), citySlug: z.string().max(100).nullable(), locale })
  .partial();

export type RegisterBody = z.infer<typeof RegisterBodySchema>;
export type LoginBody = z.infer<typeof LoginBodySchema>;

/** Compte tel que renvoyé par l'API : jamais de hash ni de jeton. */
export const UserDtoSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  emailVerified: z.boolean(),
  phoneVerified: z.boolean(),
  verified: z.boolean(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  countryCode: z.string().nullable(),
  cityId: z.string().nullable(),
  locale: z.string(),
  roles: z.array(z.enum(['moderator', 'finance', 'superadmin'])),
});
export type UserDto = z.infer<typeof UserDtoSchema>;
