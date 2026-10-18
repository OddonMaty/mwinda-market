import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:3000';
const ROUTES_TO_AUDIT = [
  { name: 'Accueil', path: '/' },
  { name: 'Catalogue Produits', path: '/produits' },
  { name: 'Liste Boutiques', path: '/boutiques' },
  { name: 'Fiche Produit (elec-01)', path: '/produits/elec-01' },
  { name: 'Fiche Boutique (kin-fashion)', path: '/boutiques/kin-fashion' },
  { name: 'Panier', path: '/panier' },
  { name: 'Suivi Commande (MW-1250)', path: '/suivi/MW-1250' },
  { name: 'Devenir Vendeur', path: '/devenir-vendeur' },
  { name: 'Dashboard Vendeur', path: '/vendeur/dashboard' },
];

async function runAudit() {
  console.log('======================================================================');
  console.log('AUDIT COMPLET DES IMAGES VIA PUPPETEER (SANS BLOQUER LES IMAGES)');
  console.log(`Serveur cible : ${BASE_URL}`);
  console.log(`Nombre de routes : ${ROUTES_TO_AUDIT.length}`);
  console.log('======================================================================\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    timeout: 60000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  let totalImagesChecked = 0;
  let totalErrors = 0;
  const allLoadedImages = [];
  const allFailedImages = [];

  for (const route of ROUTES_TO_AUDIT) {
    const url = `${BASE_URL}${route.path}`;
    console.log(`\n----------------------------------------------------------------------`);
    console.log(`Route : ${route.name} (${route.path})`);
    console.log(`----------------------------------------------------------------------`);

    const routeImages = [];
    const routeErrors = [];

    const onResponse = (res) => {
      const resUrl = res.url();
      const status = res.status();
      const req = res.request();
      const type = req.resourceType();

      const isImage =
        type === 'image' ||
        resUrl.includes('/_next/image') ||
        resUrl.includes('/images/') ||
        resUrl.includes('/icons/') ||
        /\.(png|jpe?g|webp|gif|svg|ico)(\?.*)?$/i.test(resUrl);

      if (isImage) {
        totalImagesChecked++;
        if (status >= 400) {
          totalErrors++;
          routeErrors.push({ url: resUrl, status });
          allFailedImages.push({ route: route.path, url: resUrl, status });
        } else {
          routeImages.push({ url: resUrl, status });
          allLoadedImages.push({ route: route.path, url: resUrl, status });
        }
      }
    };

    page.on('response', onResponse);

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      // Scroll down gradually to trigger viewport lazy loading
      await page.evaluate(async () => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 300;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          }, 40);
        });
      });
      // Pause to let all image optimizations complete
      await new Promise((r) => setTimeout(r, 1500));
    } catch (err) {
      console.warn(`[Avertissement] Navigation ${route.path} : ${err.message}`);
    } finally {
      page.off('response', onResponse);
    }

    console.log(`Images détectées et chargées avec succès : ${routeImages.length}`);
    for (const img of routeImages) {
      const displayUrl = img.url.replace(BASE_URL, '');
      console.log(`  [HTTP ${img.status}] ${displayUrl}`);
    }

    if (routeErrors.length > 0) {
      console.error(`  ❌ ERREURS DÉTECTÉES (${routeErrors.length}) :`);
      for (const err of routeErrors) {
        console.error(`    [HTTP ${err.status}] ${err.url}`);
      }
    } else {
      console.log(`  ✓ 0 erreur 400/404 sur cette route`);
    }
  }

  await browser.close();

  console.log('\n======================================================================');
  console.log(`BILAN CONSOLIDÉ DU SCAN DES IMAGES :`);
  console.log(`Total d'images testées sur les 9 routes : ${totalImagesChecked}`);
  console.log(`Total de succès HTTP 200/304            : ${allLoadedImages.length}`);
  console.log(`Total d'échecs (HTTP >= 400)             : ${totalErrors}`);
  console.log('======================================================================');

  if (totalErrors > 0) {
    console.error('\n❌ Liste des images en échec :');
    console.error(JSON.stringify(allFailedImages, null, 2));
    process.exit(1);
  } else {
    console.log('\n🎉 VALIDATION RÉUSSIE : Aucune image ne répond en 400 ou 404 !');
  }
}

runAudit().catch((err) => {
  console.error('Erreur critique pendant l\'audit :', err);
  process.exit(1);
});
