// Parcours : acheteur (panier → commande → Mon compte) et vendeur (boutique → produit → commande reçue).
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const WEB = process.env.WEB ?? 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch();
  const seller = await browser.newContext();
  const buyer = await browser.newContext();
  const stamp = Date.now();
  const pwd = 'Un-bon-mot-de-passe-42';

  // ---- Vendeur : création de boutique + produit
  const sp = await seller.newPage();
  await sp.goto(`${WEB}/vendeur`);
  // Assistant en 3 étapes : boutique (pays/ville) → plan → compte
  await sp.fill('#sellerRegisterForm [name=shopName]', `TechPlus ${stamp}`);
  await sp.fill('#sellerRegisterForm [name=ownerName]', 'Grace Hopper');
  await sp.fill('#sellerRegisterForm [name=phone]', '+243 907 261 113');
  await sp.selectOption('#sellerRegisterForm [name=country]', 'CD');
  await sp.selectOption('#sellerRegisterForm [name=city]', { index: 1 });
  await sp.click('#sellerRegisterForm button[type=submit]');
  await sp.click('[data-plan=free]');
  await sp.click('#sellerRegisterForm button[type=submit]');
  await sp.fill('#sellerRegisterForm [name=email]', `seller${stamp}@example.com`);
  await sp.fill('#sellerRegisterForm [name=password]', pwd);
  await sp.click('#sellerRegisterForm button[type=submit]');
  await sp.waitForURL('**/vendeur/tableau');
  await sp.waitForSelector(`text=TechPlus ${stamp}`);
  await sp.click('button:has-text("Ajouter un produit")');
  await sp.fill('[name=name]', 'Casque e2e');
  await sp.selectOption('[name=department]', 'electronique');
  await sp.selectOption('[name=category]', 'Audio');
  await sp.fill('[name=price]', '112000'); // 40 $
  // Photo "de téléphone" : grande image (3000x2000) générée dans la page, envoyée via le sélecteur de fichiers.
  await sp.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 3000; c.height = 2000;
    const g = c.getContext('2d'); const grad = g.createLinearGradient(0, 0, 3000, 2000); grad.addColorStop(0, '#0a7'); grad.addColorStop(1, '#fa0');
    g.fillStyle = grad; g.fillRect(0, 0, 3000, 2000);
    for (let i = 0; i < 4000; i++) { g.fillStyle = `hsl(${i % 360},70%,50%)`; g.fillRect((i * 37) % 3000, (i * 91) % 2000, 20, 20); } // du bruit pour une vraie taille de fichier
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.95));
    const dt = new DataTransfer(); dt.items.add(new File([blob], 'telephone.jpg', { type: 'image/jpeg' }));
    const input = document.querySelector('input[type=file]'); input.files = dt.files; input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await sp.waitForSelector('img[alt="Photo 1"]');
  const photoSrc = await sp.getAttribute('img[alt="Photo 1"]', 'src');
  assert.match(photoSrc, /^\/api\/v1\/images\//);
  await sp.fill('textarea[name=description]', 'Un casque de test.');
  await sp.click('button:has-text("Publier le produit")');
  await sp.waitForSelector('td:has-text("Casque e2e")');
  await sp.waitForSelector('text=112 000 FC');
  const size = await sp.evaluate(async (u) => { const r = await fetch(u); const b = await r.blob(); const bm = await createImageBitmap(b); return { bytes: b.size, w: bm.width, type: b.type }; }, photoSrc);
  assert.equal(size.type, 'image/jpeg');
  assert.ok(size.w <= 1200 && size.bytes < 1_300_000, `photo réduite avant envoi (${size.w}px, ${size.bytes} octets)`);
  console.log('photo envoyée :', size);

  // ---- Le produit du vendeur apparaît dans le catalogue public (mise à jour en quelques secondes)
  const pub = await browser.newPage();
  let found = false;
  for (let i = 0; i < 12 && !found; i++) {
    await pub.goto(`${WEB}/collection?q=Casque+e2e`);
    found = (await pub.locator('.product-card:has-text("Casque e2e")').count()) > 0;
    if (!found) await pub.waitForTimeout(2500);
  }
  assert.ok(found, 'le produit vendeur est visible dans le catalogue');
  assert.ok(await pub.evaluate(() => { const i = document.querySelector('.product-card img'); return i && i.src.includes('/api/v1/images/'); }), 'la photo envoyée est affichée dans le catalogue');
  await pub.click('.product-card:has-text("Casque e2e")');
  await pub.waitForSelector('h1:has-text("Casque e2e")');
  await pub.close();

  // ---- Acheteur : panier → commande
  const bp = await buyer.newPage();
  await bp.goto(`${WEB}/produit/1`);
  await bp.click('.add-to-cart');
  await bp.waitForSelector('text=ajouté au panier');
  await bp.click('.header-btn:has(.fa-shopping-cart)');
  await bp.waitForSelector('#cartDrawer.active .cart-item');
  assert.equal((await bp.textContent('#cartBadge')).trim(), '1');
  await bp.click('text=Passer la commande'); // non connecté → fenêtre de connexion
  await bp.waitForSelector('#loginModal.active .modal-content');
  await bp.click('.modal-tab:has-text("Inscription")');
  const email = `buyer${stamp}@example.com`;
  await bp.fill('#registerForm [name=firstName]', 'Ada');
  await bp.fill('#registerForm [name=lastName]', 'Lovelace');
  await bp.fill('#registerForm [name=email]', email);
  await bp.fill('#registerForm [name=phone]', '+243907261113');
  await bp.fill('#registerForm [name=password]', pwd);
  await bp.click('#registerForm button[type=submit]');
  await bp.waitForSelector('text=Compte créé');
  await bp.fill('#signinForm [name=email]', email);
  await bp.fill('#signinForm [name=password]', pwd);
  await bp.click('#signinForm button[type=submit]');
  await bp.waitForURL('**/commande');
  await bp.waitForSelector('text=Récapitulatif de votre commande');
  await bp.fill('[name=shippingCity]', 'Bukavu');
  await bp.fill('[name=shippingAddress]', 'Avenue du Lac, Nyawera');
  await bp.click('form button[type=submit]');
  await bp.waitForURL('**/compte');
  await bp.click('button:has-text("Mes commandes")');
  await bp.waitForSelector('text=Commande STM-');
  await bp.waitForSelector('text=Avenue du Lac, Nyawera'); // adresse enregistrée + livraison
  await bp.goto(`${WEB}/`);
  assert.equal((await bp.textContent('#cartBadge')).trim(), '0', 'panier vidé après la commande');

  // ---- Acheteur commande le produit du vendeur (plan gratuit : commission 5 %)
  const num = await bp.evaluate(async () => {
    const list = (await (await fetch('/api/v1/products')).json()).products;
    const id = list.find((p) => p.name === 'Casque e2e').id;
    const res = await fetch('/api/v1/orders', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ items: [{ id, quantity: 1 }], shippingPhone: '+243907261113', shippingCity: 'Bukavu', shippingAddress: 'Avenue du Lac' }) });
    return (await res.json()).order.number;
  });
  await bp.goto(`${WEB}/compte`);
  await bp.click('button:has-text("Mes commandes")');
  await bp.waitForSelector(`text=Commande ${num}`);
  assert.ok(await bp.isVisible('button:has-text("Annuler")'));

  // ---- Vendeur : confirme puis expédie, voit sa commission
  await sp.goto(`${WEB}/vendeur/tableau`);
  await sp.waitForSelector('text=Plan Gratuit · commission 5 %');
  await sp.click('button:has-text("Commandes")');
  await sp.waitForSelector(`text=Commande ${num}`);
  await sp.waitForSelector('text=commission 5 600 FC'); // 5 % de 112 000 FC
  await sp.click('button:has-text("Confirmer la commande")');
  await sp.waitForSelector('button:has-text("Marquer comme expédiée")');
  await sp.click('button:has-text("Marquer comme expédiée")');
  await sp.waitForSelector('text=Marquer comme expédiée', { state: 'detached' });

  // ---- Acheteur : confirme la réception
  await bp.goto(`${WEB}/compte`);
  await bp.click('button:has-text("Mes commandes")');
  await bp.click('button:has-text("J\'ai reçu ma commande")');
  await bp.waitForSelector('text=Réception confirmée');
  await sp.reload();
  await sp.waitForSelector('text=Gains nets (livrées)');
  await sp.waitForSelector('text=106 400 FC'); // 112 000 - 5 600

  // ---- Tarifs : quatre plans, le dernier à 45 $ par trimestre
  const tp = await seller.newPage();
  await tp.goto(`${WEB}/tarifs`);
  await tp.waitForSelector('text=Commission 2 %');
  await tp.waitForSelector('text=126 000 FC');
  await tp.click('[data-plan=premium] button:has-text("Choisir ce plan")');
  await tp.waitForSelector('text=Demande en attente');

  // ---- Administration : un compte non-admin est refusé, puis un admin gère tout
  const ap0 = await buyer.newPage();
  await ap0.goto(`${WEB}/admin`);
  await ap0.waitForSelector('text=Accès réservé');
  const adminCtx = await browser.newContext();
  const ap = await adminCtx.newPage();
  const aemail = `admin${stamp}@example.com`;
  await ap.goto(`${WEB}/`);
  const reg = await ap.evaluate(async (e) => (await fetch('/api/v1/auth/register', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: e, password: 'Un-bon-mot-de-passe-42', firstName: 'Root', lastName: 'Admin', phone: '+243907261113', countryCode: 'CD', locale: 'fr' }) })).status, aemail);
  assert.equal(reg, 200);
  await fetch('http://localhost:4000/__make-admin?email=' + encodeURIComponent(aemail));
  await ap.evaluate(async (e) => fetch('/api/v1/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: e, password: 'Un-bon-mot-de-passe-42', client: 'web' }) }), aemail);
  await ap.goto(`${WEB}/admin`);
  await ap.waitForSelector('text=Commissions gagnées');
  await ap.click('button:has-text("Demandes de plan")');
  await ap.waitForSelector(`tr:has-text("TechPlus ${stamp}")`);
  await ap.click(`tr:has-text("TechPlus ${stamp}") button:has-text("Approuver")`);
  await ap.waitForSelector('text=Plan activé pour 3 mois');
  await ap.click('button:has-text("Pays & villes")');
  await ap.waitForSelector('tr:has-text("Kenya")');
  await ap.click('button:has-text("Textes légaux")');
  await ap.click('tr:has-text("Conditions générales de vente") button:has-text("Modifier")');
  await ap.fill('[name=title]', 'Conditions de test');
  await ap.fill('[name=body]', '## Article 1\n\nTexte rédigé depuis l\'administration.');
  await ap.click('button:has-text("Publier")');
  await ap.waitForSelector('text=Texte publié');
  const lp = await buyer.newPage();
  for (let i = 0; i < 12; i++) { await lp.goto(`${WEB}/conditions`); if (await lp.locator('h1:has-text("Conditions de test")').count()) break; await lp.waitForTimeout(2500); }
  await lp.waitForSelector('text=Texte rédigé depuis l\'administration.');

  // ---- Plan activé : le vendeur voit Premium (commission 2 %)
  await sp.goto(`${WEB}/vendeur/tableau`);
  await sp.waitForSelector('text=Plan Premium · commission 2 %');

  await bp.screenshot({ path: process.env.SHOT ?? '/tmp/e2e-commerce.png', fullPage: true });
  await ap.screenshot({ path: '/tmp/e2e-admin.png', fullPage: true });
  await browser.close();
  console.log('E2E commerce OK');
})().catch((e) => { console.error(e); process.exit(1); });
