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
  await sp.click('.modal-tab:has-text("Créer ma boutique")');
  await sp.fill('#sellerRegisterForm [name=shopName]', `TechPlus ${stamp}`);
  await sp.fill('#sellerRegisterForm [name=ownerName]', 'Grace Hopper');
  await sp.fill('#sellerRegisterForm [name=phone]', '+243 907 261 113');
  await sp.fill('#sellerRegisterForm [name=email]', `seller${stamp}@example.com`);
  await sp.fill('#sellerRegisterForm [name=password]', pwd);
  await sp.click('#sellerRegisterForm button[type=submit]');
  await sp.waitForURL('**/vendeur/tableau');
  await sp.waitForSelector(`h1:has-text("TechPlus ${stamp}")`);
  await sp.click('button:has-text("Ajouter un produit")');
  await sp.fill('[name=name]', 'Casque e2e');
  await sp.selectOption('[name=department]', 'electronique');
  await sp.fill('[name=category]', 'Audio');
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
  await bp.fill('[name=shippingAddress]', 'Avenue du Lac, Nyawera');
  await bp.click('form button[type=submit]');
  await bp.waitForURL('**/compte');
  await bp.waitForSelector('text=Commande STM-');
  await bp.waitForSelector('text=Avenue du Lac, Nyawera'); // adresse enregistrée + livraison
  assert.equal((await bp.textContent('#cartBadge')).trim(), '0', 'panier vidé après la commande');

  // ---- Vendeur : commande d'un produit de sa boutique
  await bp.goto(`${WEB}/produit/1`);
  const r = await bp.evaluate(async () => {
    const res = await fetch('/api/v1/orders', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ items: [{ id: 1, quantity: 1 }], shippingPhone: '+243907261113', shippingCity: 'Bukavu', shippingAddress: 'x' }) });
    return res.status;
  });
  assert.equal(r, 201);
  await bp.screenshot({ path: process.env.SHOT ?? '/tmp/e2e-commerce.png', fullPage: true });
  await browser.close();
  console.log('E2E commerce OK');
})().catch((e) => { console.error(e); process.exit(1); });
