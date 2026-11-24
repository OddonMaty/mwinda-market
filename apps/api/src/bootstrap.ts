import type { AppDeps } from './app.js';
import type { EnvConfig } from './config/env.js';
import type { Db } from './db/client.js';
import { NoopMailer, SmtpMailer } from './mail/mailer.js';
import { GoogleClient } from './services/google.js';
import { ChannelMessenger } from './services/messenger.js';
import { WebPushSender } from './services/push.js';
import { VercelBlobStore } from './services/storage.js';
import { publicUrl } from './services/auth.js';

/** Branche tous les services externes selon les variables d'environnement. Utilisé par le serveur local ET par la fonction Vercel. */
export function buildDeps(config: EnvConfig, db: Db): AppDeps {
  return {
    db,
    mailer: config.SMTP_URL ? new SmtpMailer(config.SMTP_URL, config.MAIL_FROM, publicUrl(config)) : new NoopMailer(),
    store: config.BLOB_READ_WRITE_TOKEN ? new VercelBlobStore(config.BLOB_READ_WRITE_TOKEN) : undefined,
    google: config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET ? new GoogleClient(config.GOOGLE_CLIENT_ID, config.GOOGLE_CLIENT_SECRET, `${publicUrl(config)}/api/v1/auth/google/callback`) : undefined,
    messenger: new ChannelMessenger({ whatsappToken: config.WHATSAPP_TOKEN, whatsappPhoneId: config.WHATSAPP_PHONE_ID, twilioSid: config.TWILIO_ACCOUNT_SID, twilioToken: config.TWILIO_AUTH_TOKEN, twilioFrom: config.TWILIO_FROM }),
    push: new WebPushSender(db, { publicKey: config.VAPID_PUBLIC_KEY, privateKey: config.VAPID_PRIVATE_KEY, subject: 'mailto:contact@mwindamarket.com' }),
  };
}
