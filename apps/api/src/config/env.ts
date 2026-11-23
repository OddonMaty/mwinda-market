import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env file if present
dotenv.config();

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().min(1).default('0.0.0.0'),
  /** Adresse(s) autorisée(s) du site web, séparées par des virgules. */
  WEB_ORIGIN: z
    .string()
    .refine((v) => v.split(',').every((o) => z.string().url().safeParse(o.trim()).success), 'WEB_ORIGIN must be one or more URLs'),
  /** Expression régulière optionnelle pour autoriser aussi des adresses générées (ex. déploiements Vercel). */
  WEB_ORIGIN_REGEX: z.string().optional(),
  SMTP_URL: z.string().optional(),
  MAIL_FROM: z.string().default('Mwinda Market <no-reply@mwindamarket.com>'),
  /** Jeton Vercel Blob : active le stockage dédié des photos (sinon, stockage en base). */
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  /** Identifiants OAuth Google : activent le bouton « Continuer avec Google ». */
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  /** WhatsApp (API officielle Meta) et SMS (Twilio) : vérification de compte et notifications. */
  WHATSAPP_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_ID: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM: z.string().optional(),
  DATABASE_URL: z.string().min(1),
  API_SECRET: z.string().min(16, 'API_SECRET must be at least 16 characters long'),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export const webOrigins = (c: Pick<EnvConfig, 'WEB_ORIGIN'>): string[] =>
  c.WEB_ORIGIN.split(',').map((o) => o.trim().replace(/\/$/, ''));

export const isAllowedOrigin = (c: Pick<EnvConfig, 'WEB_ORIGIN' | 'WEB_ORIGIN_REGEX'>, origin: string): boolean => {
  const o = origin.replace(/\/$/, '');
  return webOrigins(c).includes(o) || (!!c.WEB_ORIGIN_REGEX && new RegExp(c.WEB_ORIGIN_REGEX).test(o));
};

export function parseEnv(customEnv?: Record<string, string | undefined>): EnvConfig {
  const source = customEnv ?? process.env;
  const result = EnvSchema.safeParse(source);

  if (!result.success) {
    const formattedErrors = result.error.errors
      .map((err) => `  - ${err.path.join('.')}: ${err.message}`)
      .join('\n');
    throw new Error(
      `Invalid application configuration. Missing or invalid environment variables:\n${formattedErrors}`
    );
  }

  return result.data;
}

// Lazy-loaded or singleton env config
let currentConfig: EnvConfig | null = null;

export function getConfig(): EnvConfig {
  if (!currentConfig) {
    currentConfig = parseEnv();
  }
  return currentConfig;
}

export function setConfig(config: EnvConfig | null): void {
  currentConfig = config;
}

// Origines autorisées : WEB_ORIGIN (liste) et WEB_ORIGIN_REGEX, à mettre à jour si le site change d'adresse.
