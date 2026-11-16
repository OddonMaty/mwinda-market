# Déploiement de l'API (Vercel)

- Projet Vercel `saotechmarket-api`, dossier racine `apps/api` (fonction `api/index.js`, config `vercel.json`).
- Variables : `DATABASE_URL` (Neon, URL poolée), `API_SECRET`, `WEB_ORIGIN` (origines du site, séparées par des virgules), `NODE_ENV=production`, optionnel `SMTP_URL`, `MAIL_FROM`.
- Les migrations ne s'exécutent pas au démarrage en production : les appliquer à part (dossier `migrations/`).
- Le site relaie `/api/*` vers cette API via la variable `API_URL` du projet web.
- Production : branche `main` (site et API déployés automatiquement).
