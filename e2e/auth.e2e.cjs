// Parcours complet : inscription → e-mail → vérification → connexion → compte → déconnexion.
// Prérequis : API de test (apps/api/src/e2e-server.ts, port 4000) et web (port 3000).
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const WEB = process.env.WEB ?? 'http://localhost:3000';
const API = process.env.API ?? 'http://localhost:4000';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const email = `e2e${Date.now()}@example.com`;
  const pwd = 'Un-bon-mot-de-passe-42';

  await page.goto(WEB);
  await page.click('.header-btn:has-text("Compte")');
  await page.waitForSelector('#loginModal.active .modal-content');
  await page.click('.modal-tab:has-text("Inscription")');
  await page.fill('#registerForm [name=firstName]', 'Ada');
  await page.fill('#registerForm [name=lastName]', 'Lovelace');
  await page.fill('#registerForm [name=email]', email);
  await page.fill('#registerForm [name=phone]', '+243 907 261 113');
  await page.fill('#registerForm [name=password]', pwd);
  await page.click('#registerForm button[type=submit]');
  await page.waitForSelector('text=Compte créé');

  const { mail } = await (await fetch(`${API}/__mail/last?to=${encodeURIComponent(email)}`)).json();
  assert.ok(mail, 'e-mail de vérification envoyé');
  const link = mail.text.match(/https?:\/\/\S+verifier-email\?token=\S+/)[0];
  await page.goto(link.replace(/^https?:\/\/[^/]+/, WEB));
  await page.waitForSelector('text=Votre adresse e-mail est confirmée');

  await page.click('.seller-auth-card .btn-primary');
  await page.fill('#signinForm [name=email]', email);
  await page.fill('#signinForm [name=password]', 'mauvais-mot-de-passe');
  await page.click('#signinForm button[type=submit]');
  await page.waitForSelector('text=incorrect');
  await page.fill('#signinForm [name=password]', pwd);
  await page.click('#signinForm button[type=submit]');
  await page.waitForSelector('text=Connexion réussie');

  await page.goto(`${WEB}/compte`);
  await page.waitForSelector('h1:has-text("Ada Lovelace")');
  await page.waitForSelector('text=(cet appareil)');
  const cookies = await page.context().cookies();
  const c = cookies.find((x) => x.name === 'stm_session');
  assert.ok(c && c.httpOnly, 'cookie de session httpOnly');

  await page.click('button:has-text("Déconnexion")');
  await page.waitForSelector('text=Vous êtes déconnecté');
  await page.goto(`${WEB}/compte`);
  await page.waitForSelector('text=Se connecter / Créer un compte');
  await page.screenshot({ path: process.env.SHOT ?? '/tmp/e2e-final.png' });
  await browser.close();
  console.log('E2E auth OK');
})().catch((e) => { console.error(e); process.exit(1); });
