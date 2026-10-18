import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

function findHrefsInDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      findHrefsInDir(fullPath, fileList);
    } else if (/\.(tsx|ts|js|jsx)$/.test(file)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const allFiles = findHrefsInDir('src');
const extractedLinks = new Set();

// Regular expressions to extract hrefs
const hrefRegexStatic = /href=["'](\/[^"'#\s]*)/g;
const hrefRegexDynamic = /href=\{`(\/[^`]*)`\}/g;

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  let match;
  while ((match = hrefRegexStatic.exec(content)) !== null) {
    extractedLinks.add(match[1]);
  }
  while ((match = hrefRegexDynamic.exec(content)) !== null) {
    let raw = match[1];
    // Resolve known dynamic expressions to concrete examples
    if (raw.includes('${item.id}') || raw.includes('${product.id}')) {
      extractedLinks.add('/produits/elec-01');
      extractedLinks.add('/produits/elec-02');
    } else if (raw.includes('${shop.id}') || raw.includes('${VENDOR_PROFILE.shopId}') || raw.includes('getShopIdByName')) {
      extractedLinks.add('/boutiques/shop-01');
      extractedLinks.add('/boutiques/shop-02');
    } else if (raw.includes('encodeURIComponent(product.category)')) {
      extractedLinks.add('/produits?category=electronique');
      extractedLinks.add('/produits?category=mode');
    } else if (raw.includes('reference') || raw.includes('orderConfirmed')) {
      extractedLinks.add('/suivi/MW-1250');
      extractedLinks.add('/suivi/MW-309112');
      extractedLinks.add('/suivi/MW-849201');
    }
  }
}

// Add redirect routes that might be visited by old bookmarks or tests
const redirectsToTest = [
  '/zones-livraison',
  '/categories',
  '/categories/mode',
  '/categories/electronique',
  '/categories/maison',
  '/categories/beaute',
  '/categories/alimentation',
];

for (const r of redirectsToTest) {
  extractedLinks.add(r);
}

// Convert set to sorted list
const linksToTest = Array.from(extractedLinks).sort();

console.log(`=======================================================`);
console.log(`TEST DE TOUS LES LIENS INTERNES (${linksToTest.length} LIENS)`);
console.log(`Serveur cible : ${BASE_URL}`);
console.log(`=======================================================\n`);

let failCount = 0;
let passCount = 0;

for (const link of linksToTest) {
  const url = `${BASE_URL}${link}`;
  try {
    const res = await fetch(url, { redirect: 'manual' });
    const status = res.status;
    if (status === 200) {
      console.log(`[PASS 200 OK]        ${link}`);
      passCount++;
    } else if (status === 307 || status === 308 || status === 301 || status === 302) {
      const loc = res.headers.get('location') || '';
      // Follow the redirect to ensure it resolves to 200
      const targetUrl = loc.startsWith('http') ? loc : `${BASE_URL}${loc}`;
      const destRes = await fetch(targetUrl);
      if (destRes.status === 200) {
        console.log(`[PASS ${status} -> 200] ${link} -> ${loc}`);
        passCount++;
      } else {
        console.log(`[FAIL ${status} -> ${destRes.status}] ${link} -> ${loc}`);
        failCount++;
      }
    } else {
      console.log(`[FAIL ${status}]       ${link}`);
      failCount++;
    }
  } catch (err) {
    console.log(`[ERROR]             ${link} (${err.message})`);
    failCount++;
  }
}

console.log(`\n=======================================================`);
console.log(`RÉSULTAT : ${passCount} réussis, ${failCount} échoués sur ${linksToTest.length} testés.`);
console.log(`=======================================================`);

if (failCount > 0) {
  process.exit(1);
}
