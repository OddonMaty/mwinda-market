import { z } from 'zod';

const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(1).max(200);
const phone = z.string().trim().regex(/^\+[1-9][0-9]{6,14}$/, 'phone_e164');
const name = z.string().trim().min(1).max(80);

export const RegisterBodySchema = z.object({
  email,
  password,
  firstName: name,
  lastName: name,
  phone,
  countryCode: z.string().length(2).toUpperCase().default('CD'),
  citySlug: z.string().max(100).optional(),
  locale: z.enum(['fr', 'en']).default('fr'),
});
export const LoginBodySchema = z.object({ email, password, client: z.enum(['web', 'api']).default('web') });
export const TokenBodySchema = z.object({ token: z.string().min(20).max(100) });
export const EmailBodySchema = z.object({ email });
export const ResetPasswordBodySchema = z.object({ token: z.string().min(20).max(100), password });
export const ChangePasswordBodySchema = z.object({ oldPassword: password, newPassword: password });
export const UpdateProfileBodySchema = z
  .object({ firstName: name, lastName: name, phone, countryCode: z.string().length(2).toUpperCase(), citySlug: z.string().max(100).nullable(), locale: z.enum(['fr', 'en']) })
  .partial();

export type RegisterBody = z.infer<typeof RegisterBodySchema>;
export type LoginBody = z.infer<typeof LoginBodySchema>;

/** Compte tel que renvoyé par l'API : jamais de hash ni de jeton. */
export const UserDtoSchema = z.object({
  id: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  countryCode: z.string().nullable(),
  cityId: z.string().nullable(),
  locale: z.string(),
  roles: z.array(z.enum(['moderator', 'finance', 'superadmin'])),
});
export type UserDto = z.infer<typeof UserDtoSchema>;
