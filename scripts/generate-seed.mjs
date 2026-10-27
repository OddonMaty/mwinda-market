import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function loadTsModule(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  const result = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    }
  });
  const moduleObj = { exports: {} };
  const customRequire = (specifier) => {
    if (specifier.startsWith('.')) {
      const dir = path.dirname(filePath);
      let target = path.join(dir, specifier);
      if (!fs.existsSync(target) && fs.existsSync(target + '.ts')) target += '.ts';
      return loadTsModule(target);
    }
    return {};
  };
  const fn = new Function('require', 'exports', 'module', result.outputText);
  fn(customRequire, moduleObj.exports, moduleObj);
  return moduleObj.exports;
}

function loadData() {
  const { AFRICAN_COUNTRIES } = loadTsModule(path.join(rootDir, 'src', 'data', 'countries.ts'));
  const { SHOPS_DATA } = loadTsModule(path.join(rootDir, 'src', 'data', 'shops.ts'));
  const { ELECTRONICS_PRODUCTS } = loadTsModule(path.join(rootDir, 'src', 'data', 'electronics.ts'));
  return { AFRICAN_COUNTRIES, SHOPS_DATA, ELECTRONICS_PRODUCTS };
}

function sqlEscape(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return isNaN(val) ? 'NULL' : String(val);
  if (Array.isArray(val)) {
    if (val.length === 0) return "'{}'::text[]";
    const escapedItems = val.map(s => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`).join(',');
    return `'{${escapedItems}}'::text[]`;
  }
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

function main() {
  const { AFRICAN_COUNTRIES, SHOPS_DATA, ELECTRONICS_PRODUCTS } = loadData();
  const sqlLines = [];

  sqlLines.push('-- Seed automatique généré par scripts/generate-seed.mjs');
  sqlLines.push('-- Ordre d\'insertion : countries -> regions -> shops -> products -> product_images -> product_reviews');
  sqlLines.push('');

  // 1. COUNTRIES
  sqlLines.push('-- ========================================================');
  sqlLines.push('-- 1. PAYS (countries)');
  sqlLines.push('-- ========================================================');
  for (const c of AFRICAN_COUNTRIES) {
    const code = sqlEscape(c.code);
    const nameFr = sqlEscape(c.name?.fr || c.code);
    const nameEn = sqlEscape(c.name?.en || c.name?.fr || c.code);
    const flag = sqlEscape(c.flag || null);
    const currCode = sqlEscape(c.currency?.code || 'USD');
    const currSymbol = sqlEscape(c.currency?.symbol || '$');
    const phoneCode = sqlEscape(c.phoneCode || null);
    const defaultLang = sqlEscape(c.defaultLanguage || 'fr');

    sqlLines.push(
      `INSERT INTO public.countries (code, name_fr, name_en, flag, currency_code, currency_symbol, phone_code, default_language) ` +
      `VALUES (${code}, ${nameFr}, ${nameEn}, ${flag}, ${currCode}, ${currSymbol}, ${phoneCode}, ${defaultLang}) ` +
      `ON CONFLICT (code) DO UPDATE SET ` +
      `name_fr = EXCLUDED.name_fr, name_en = EXCLUDED.name_en, flag = EXCLUDED.flag, ` +
      `currency_code = EXCLUDED.currency_code, currency_symbol = EXCLUDED.currency_symbol;`
    );
  }
  sqlLines.push('');

  // 2. REGIONS
  sqlLines.push('-- ========================================================');
  sqlLines.push('-- 2. RÉGIONS / PROVINCES (regions)');
  sqlLines.push('-- ========================================================');
  for (const c of AFRICAN_COUNTRIES) {
    if (c.regions && Array.isArray(c.regions)) {
      for (const r of c.regions) {
        const id = sqlEscape(`${c.code.toLowerCase()}-${r.id}`);
        const countryCode = sqlEscape(c.code);
        const name = sqlEscape(r.name);
        const capital = sqlEscape(r.capital || null);
        const hub = sqlEscape(r.hub || null);
        const delay = sqlEscape(r.delay || null);
        const isExpress = sqlEscape(!!r.isExpress);
        const zone = sqlEscape(r.zone || null);

        sqlLines.push(
          `INSERT INTO public.regions (id, country_code, name, capital, hub, delay, is_express, zone) ` +
          `VALUES (${id}, ${countryCode}, ${name}, ${capital}, ${hub}, ${delay}, ${isExpress}, ${zone}) ` +
          `ON CONFLICT (id) DO UPDATE SET ` +
          `name = EXCLUDED.name, hub = EXCLUDED.hub, delay = EXCLUDED.delay;`
        );
      }
    }
  }
  sqlLines.push('');

  // 3. SHOPS
  sqlLines.push('-- ========================================================');
  sqlLines.push('-- 3. BOUTIQUES (shops) - 15 boutiques');
  sqlLines.push('-- ========================================================');
  for (const s of SHOPS_DATA) {
    const id = sqlEscape(s.id);
    const name = sqlEscape(s.name);
    const tagline = sqlEscape(s.tagline || null);
    const category = sqlEscape(s.category || null);
    const countryCode = sqlEscape(s.countryCode || 'CD');
    const city = sqlEscape(s.city);
    const province = sqlEscape(s.province);
    const rating = sqlEscape(s.rating ?? 5.0);
    const reviewCount = sqlEscape(s.reviewCount ?? 0);
    const verified = sqlEscape(!!s.verified);
    const topSeller = sqlEscape(!!s.topSeller);
    const featured = sqlEscape(!!s.featured);
    const bannerImage = sqlEscape(s.bannerImage || null);
    const logoImage = sqlEscape(s.logoImage || null);
    const bio = sqlEscape(s.bio || null);
    const fullAddress = sqlEscape(s.fullAddress || null);
    const shippingSpeed = sqlEscape(s.shippingSpeed || null);
    const coveredTerritories = sqlEscape(s.coveredTerritories || null);
    const openingHours = sqlEscape(s.openingHours || null);
    const phone = sqlEscape(s.phone || null);
    const whatsapp = sqlEscape(s.whatsapp || null);
    const responseRate = sqlEscape(s.responseRate || null);
    const yearEstablished = sqlEscape(s.yearEstablished || null);
    const perfOverall = sqlEscape(s.performanceScore?.overall || null);
    const perfItemQuality = sqlEscape(s.performanceScore?.itemQuality ?? null);
    const perfCommunication = sqlEscape(s.performanceScore?.communication ?? null);
    const perfShipping = sqlEscape(s.performanceScore?.shippingSpeed ?? null);
    const specialties = sqlEscape(s.specialties || []);

    sqlLines.push(
      `INSERT INTO public.shops (` +
      `id, name, tagline, category, country_code, city, province, rating, review_count, ` +
      `verified, top_seller, featured, banner_image, logo_image, bio, full_address, ` +
      `shipping_speed, covered_territories, opening_hours, phone, whatsapp, response_rate, ` +
      `year_established, performance_overall, performance_item_quality, performance_communication, ` +
      `performance_shipping, specialties, is_active, is_demo` +
      `) VALUES (` +
      `${id}, ${name}, ${tagline}, ${category}, ${countryCode}, ${city}, ${province}, ${rating}, ${reviewCount}, ` +
      `${verified}, ${topSeller}, ${featured}, ${bannerImage}, ${logoImage}, ${bio}, ${fullAddress}, ` +
      `${shippingSpeed}, ${coveredTerritories}, ${openingHours}, ${phone}, ${whatsapp}, ${responseRate}, ` +
      `${yearEstablished}, ${perfOverall}, ${perfItemQuality}, ${perfCommunication}, ` +
      `${perfShipping}, ${specialties}, true, true` +
      `) ON CONFLICT (id) DO UPDATE SET ` +
      `name = EXCLUDED.name, tagline = EXCLUDED.tagline, category = EXCLUDED.category, ` +
      `city = EXCLUDED.city, province = EXCLUDED.province, rating = EXCLUDED.rating, ` +
      `review_count = EXCLUDED.review_count, verified = EXCLUDED.verified, ` +
      `banner_image = EXCLUDED.banner_image, logo_image = EXCLUDED.logo_image, ` +
      `is_active = true, is_demo = true;`
    );
  }
  sqlLines.push('');

  // 4. PRODUCTS
  sqlLines.push('-- ========================================================');
  sqlLines.push('-- 4. PRODUITS (products) - 42 produits');
  sqlLines.push('-- ========================================================');
  for (const p of ELECTRONICS_PRODUCTS) {
    const id = sqlEscape(p.id);
    const shopId = sqlEscape(p.shopId);
    const title = sqlEscape(p.title);
    const image = sqlEscape(p.image);
    const images = sqlEscape(p.images || [p.image]);
    const usdPrice = sqlEscape(p.usdPrice);
    const originalUsdPrice = sqlEscape(p.originalUsdPrice ?? null);
    const rating = sqlEscape(p.rating ?? 0);
    const reviewCount = sqlEscape(p.reviewCount ?? 0);
    const category = sqlEscape(p.category);
    const province = sqlEscape(p.province);
    const inStock = sqlEscape(p.inStock !== false);
    const stockCount = sqlEscape(p.stockCount ?? 10);
    const description = sqlEscape(p.description || null);
    const features = sqlEscape(p.features || []);
    const specifications = sqlEscape(p.specifications || {});
    const badgeDiscount = sqlEscape(p.badges?.discount || null);
    const badgeLogistics = sqlEscape(p.badges?.logistics || null);
    const badgeLogisticsText = sqlEscape(p.badges?.logisticsText || null);

    sqlLines.push(
      `INSERT INTO public.products (` +
      `id, shop_id, title, image, usd_price, original_usd_price, rating, review_count, ` +
      `category, province, in_stock, stock_count, description, features, specifications, ` +
      `badge_discount, badge_logistics, badge_logistics_text, is_active, is_demo` +
      `) VALUES (` +
      `${id}, ${shopId}, ${title}, ${image}, ${usdPrice}, ${originalUsdPrice}, ${rating}, ${reviewCount}, ` +
      `${category}, ${province}, ${inStock}, ${stockCount}, ${description}, ${features}, ${specifications}, ` +
      `${badgeDiscount}, ${badgeLogistics}, ${badgeLogisticsText}, true, true` +
      `) ON CONFLICT (id) DO UPDATE SET ` +
      `shop_id = EXCLUDED.shop_id, title = EXCLUDED.title, image = EXCLUDED.image, ` +
      `usd_price = EXCLUDED.usd_price, original_usd_price = EXCLUDED.original_usd_price, ` +
      `rating = EXCLUDED.rating, review_count = EXCLUDED.review_count, in_stock = EXCLUDED.in_stock, ` +
      `stock_count = EXCLUDED.stock_count, description = EXCLUDED.description, features = EXCLUDED.features, ` +
      `specifications = EXCLUDED.specifications, badge_discount = EXCLUDED.badge_discount, ` +
      `badge_logistics = EXCLUDED.badge_logistics, badge_logistics_text = EXCLUDED.badge_logistics_text, ` +
      `is_active = true, is_demo = true;`
    );
  }
  sqlLines.push('');

  // 5. PRODUCT IMAGES
  sqlLines.push('-- ========================================================');
  sqlLines.push('-- 5. IMAGES DE PRODUITS (product_images)');
  sqlLines.push('-- ========================================================');
  for (const p of ELECTRONICS_PRODUCTS) {
    if (p.images && p.images.length > 0) {
      p.images.forEach((url, idx) => {
        const prodId = sqlEscape(p.id);
        const imgUrl = sqlEscape(url);
        const sortOrder = sqlEscape(idx);
        sqlLines.push(
          `INSERT INTO public.product_images (product_id, url, sort_order) ` +
          `SELECT ${prodId}, ${imgUrl}, ${sortOrder} ` +
          `WHERE NOT EXISTS (SELECT 1 FROM public.product_images WHERE product_id = ${prodId} AND url = ${imgUrl});`
        );
      });
    }
  }
  sqlLines.push('');

  // 6. PRODUCT REVIEWS
  sqlLines.push('-- ========================================================');
  sqlLines.push('-- 6. AVIS PRODUITS (product_reviews)');
  sqlLines.push('-- ========================================================');
  for (const p of ELECTRONICS_PRODUCTS) {
    if (p.reviews && p.reviews.length > 0) {
      for (const rev of p.reviews) {
        const revId = sqlEscape(rev.id);
        const prodId = sqlEscape(p.id);
        const author = sqlEscape(rev.author);
        const city = sqlEscape(rev.city || null);
        const rating = sqlEscape(rev.rating);
        const reviewDate = sqlEscape(rev.date || null);
        const comment = sqlEscape(rev.comment || null);
        const verifiedPurchase = sqlEscape(!!rev.verifiedPurchase);

        sqlLines.push(
          `INSERT INTO public.product_reviews (id, product_id, author, city, rating, review_date, comment, verified_purchase, is_demo) ` +
          `VALUES (${revId}, ${prodId}, ${author}, ${city}, ${rating}, ${reviewDate}, ${comment}, ${verifiedPurchase}, true) ` +
          `ON CONFLICT (id) DO UPDATE SET ` +
          `author = EXCLUDED.author, rating = EXCLUDED.rating, comment = EXCLUDED.comment, is_demo = true;`
        );
      }
    }
  }

  const outDir = path.join(rootDir, 'supabase');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outFile = path.join(outDir, 'seed.sql');
  fs.writeFileSync(outFile, sqlLines.join('\n'), 'utf8');

  console.log(`[OK] supabase/seed.sql généré avec succès !`);
  console.log(`- Pays : ${AFRICAN_COUNTRIES.length}`);
  console.log(`- Boutiques : ${SHOPS_DATA.length}`);
  console.log(`- Produits : ${ELECTRONICS_PRODUCTS.length}`);
}

main();
