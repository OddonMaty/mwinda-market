/** Donne le rôle de super-administrateur à un compte existant : pnpm --filter @saotech/api make-admin <email> */
import { getConfig } from './config/env.js';
import { createPgDb } from './db/client.js';

const email = process.argv[2]?.trim().toLowerCase();
if (!email) { console.error('Usage : make-admin <email>'); process.exit(1); }
const db = createPgDb(getConfig().DATABASE_URL);
const u = (await db.query<{ id: string }>('SELECT id FROM users WHERE email = $1', [email]))[0];
if (!u) { console.error('Aucun compte avec cet e-mail : créez-le d’abord sur le site.'); process.exit(1); }
await db.query("INSERT INTO admin_roles(user_id, role) VALUES ($1, 'superadmin') ON CONFLICT DO NOTHING", [u.id]);
console.log(`${email} est maintenant super-administrateur.`);
await db.close();
