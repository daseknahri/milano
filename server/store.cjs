const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');

const STORAGE_DIR = path.resolve(process.env.STORAGE_DIR || path.join(process.cwd(), 'storage'));
const DATA_FILE = path.join(STORAGE_DIR, 'content.json');
const BACKUP_FILE = path.join(STORAGE_DIR, 'content.backup.json');
const SEED_FILE = path.join(__dirname, 'data', 'content.seed.json');
const LEGACY_CATEGORY_IDS = new Set(['ambient-led', 'transformation-kits', 'star-ceiling', 'interior-comfort', 'exterior-style']);
const LEGACY_PRODUCT_IDS = new Set([
  'led-ambient-64',
  'led-footwell',
  'bodykit-premium',
  'sport-grille',
  'star-headliner',
  'wireless-carplay',
  'steering-wheel-upgrade',
  'adaptive-led-headlights',
]);
const CARL_CATEGORY_IDS = new Set(['volkswagen', 'bmw', 'mercedes', 'audi', 'range-rover', 'carplay', 'jantes', 'accessoires']);
const CARL_REFERENCE_VERSION = 'carl-reference-v4';
const CARL_REFERENCE_V2_PRODUCT_IDS = new Set([
  'mib2-fibre-volkswagen',
  'coffre-electrique-touareg-2019',
  'marchepied-electrique-touareg',
  'jantes-19-volkswagen',
  'camera-recul-audi-a5',
  'calandre-rs5-audi-a5',
  'calandre-rsq5-audi-q5',
  'feux-arriere-led-golf-75',
  'kit-gtd-golf-8',
  'parechoc-golf-7-gti',
  'kit-touareg-r-line',
  'kit-tiguan-r-line',
  'optiques-golf-6-look-75',
  'kit-gti-75-golf-7',
  'feux-tiguan-iq-2017',
  'feux-golf-8-iq-lights',
  'feux-golf-6-dynamique',
  'kit-golf-8-r-line',
  'jante-range-rover-evoque-20',
  'bas-caisse-golf-7-gtd',
  'jante-audi-22',
]);
const CARL_REFERENCE_V3_PRODUCT_IDS = new Set([
  ...CARL_REFERENCE_V2_PRODUCT_IDS,
  'coffre-electrique-touareg-2012',
  'optiques-tiguan-led-2017',
  'bas-caisse-golf-6-gti',
]);
const PREVIOUS_CARL_PRODUCT_ID_SETS = [CARL_REFERENCE_V2_PRODUCT_IDS, CARL_REFERENCE_V3_PRODUCT_IDS];

let writeQueue = Promise.resolve();

function cleanText(value, max = 240) {
  return [...String(value ?? '')]
    .map((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127 ? ' ' : character;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function cleanMultiline(value, max = 2000) {
  return String(value ?? '').replaceAll('\u0000', '').replace(/\r\n/g, '\n').trim().slice(0, max);
}

function cleanUrl(value, max = 1000) {
  const candidate = cleanText(value, max);
  if (!candidate) return '';
  if (/^\/(?:assets|uploads)\/[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(candidate) && !candidate.includes('..')) return candidate;
  try {
    const parsed = new URL(candidate);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString().slice(0, max) : '';
  } catch {
    return '';
  }
}

function cleanHref(value, max = 200) {
  const candidate = cleanText(value, max);
  if (!candidate) return '';
  // Allow anchors and local routes, but never protocol-relative or traversal paths.
  if (/^(?:#|\/)(?!\/)[^\s]*$/.test(candidate) && !candidate.includes('..')) return candidate;
  try {
    const parsed = new URL(candidate);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString().slice(0, max) : '';
  } catch {
    return '';
  }
}

function cleanId(value, prefix) {
  const candidate = cleanText(value, 80).toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return candidate || `${prefix}_${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`;
}

function finiteNumber(value, fallback = 0, min = -1_000_000_000, max = 1_000_000_000) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
}

function sanitizeSettings(input = {}, previous = {}) {
  const merged = { ...previous, ...input };
  return {
    brandName: cleanText(merged.brandName, 100) || 'Milan Automobile Accessoires',
    shortName: cleanText(merged.shortName, 60) || 'Milan Auto',
    eyebrow: cleanText(merged.eyebrow, 120),
    heroTitle: cleanText(merged.heroTitle, 180),
    heroSubtitle: cleanMultiline(merged.heroSubtitle, 700),
    heroImage: cleanUrl(merged.heroImage),
    heroCtaLabel: cleanText(merged.heroCtaLabel, 60),
    heroCtaHref: cleanHref(merged.heroCtaHref, 200),
    announcement: cleanText(merged.announcement, 220),
    aboutTitle: cleanText(merged.aboutTitle, 180),
    aboutText: cleanMultiline(merged.aboutText, 2000),
    aboutImage: cleanUrl(merged.aboutImage),
    address: cleanText(merged.address, 300),
    city: cleanText(merged.city, 100),
    phone: cleanText(merged.phone, 40),
    whatsapp: cleanText(merged.whatsapp, 40),
    email: cleanText(merged.email, 180),
    instagram: cleanUrl(merged.instagram, 300),
    youtube: cleanUrl(merged.youtube, 300),
    mapUrl: cleanUrl(merged.mapUrl),
    hours: cleanText(merged.hours, 240),
    currency: cleanText(merged.currency, 8) || 'MAD',
    logo: cleanUrl(merged.logo),
    footerText: cleanText(merged.footerText, 300),
    seoTitle: cleanText(merged.seoTitle, 160),
    seoDescription: cleanText(merged.seoDescription, 320),
  };
}

function sanitizeCategory(input = {}, previous = {}) {
  const merged = { ...previous, ...input };
  return {
    id: cleanId(previous.id || input.id, 'cat'),
    name: cleanText(merged.name, 100) || 'Nouvelle catégorie',
    slug: cleanId(merged.slug || merged.name, 'categorie'),
    description: cleanMultiline(merged.description, 600),
    image: cleanUrl(merged.image),
    accent: cleanText(merged.accent, 30),
    order: Math.round(finiteNumber(merged.order, 0, 0, 10000)),
    active: merged.active !== false,
  };
}

function sanitizeProduct(input = {}, previous = {}) {
  const merged = { ...previous, ...input };
  const suppliedImages = Array.isArray(merged.images) ? merged.images.map((item) => cleanUrl(item)).filter(Boolean).slice(0, 12) : [];
  const suppliedGallery = Array.isArray(merged.gallery) ? merged.gallery.map((item) => cleanUrl(item)).filter(Boolean).slice(0, 12) : [];
  const image = Object.hasOwn(input, 'image')
    ? cleanUrl(input.image)
    : cleanUrl(merged.image) || suppliedImages[0] || suppliedGallery[0] || '';
  const gallery = (Object.hasOwn(input, 'gallery')
    ? suppliedGallery
    : suppliedGallery.length ? suppliedGallery : suppliedImages.filter((url) => url !== image)).slice(0, 12);
  const images = [...new Set([image, ...suppliedImages, ...gallery].filter(Boolean))].slice(0, 12);
  const features = Array.isArray(merged.features) ? merged.features.map((item) => cleanText(item, 160)).filter(Boolean).slice(0, 20) : [];
  const vehicleModels = Array.isArray(merged.vehicleModels)
    ? merged.vehicleModels.map((item) => cleanText(item, 100)).filter(Boolean).slice(0, 30)
    : [];
  const categoryId = cleanId(merged.categoryId || merged.category, 'cat');
  const stockValue = Object.hasOwn(input, 'inStock')
    ? input.inStock
    : Object.hasOwn(input, 'available') ? input.available : (previous.inStock ?? previous.available ?? true);
  return {
    id: cleanId(previous.id || input.id, 'prd'),
    name: cleanText(merged.name, 160) || 'Nouveau produit',
    slug: cleanId(merged.slug || merged.name, 'produit'),
    categoryId,
    category: categoryId,
    brand: cleanText(merged.brand, 100) || 'Milan Selection',
    vehicleModels,
    years: cleanText(merged.years, 100),
    description: cleanMultiline(merged.description, 2400),
    shortDescription: cleanText(merged.shortDescription, 300),
    price: finiteNumber(merged.price, 0, 0, 10_000_000),
    compareAtPrice: finiteNumber(merged.compareAtPrice, 0, 0, 10_000_000),
    priceLabel: cleanText(merged.priceLabel, 80),
    image,
    gallery,
    images,
    features,
    badge: cleanText(merged.badge, 40),
    featured: merged.featured === true,
    inStock: stockValue !== false,
    available: stockValue !== false,
    active: merged.active !== false,
    order: Math.round(finiteNumber(merged.order, 0, 0, 10000)),
  };
}

function sanitizeContent(input = {}) {
  const categories = Array.isArray(input.categories) ? input.categories.map((item) => sanitizeCategory(item)) : [];
  const categoryIds = new Set(categories.map(({ id }) => id));
  const products = Array.isArray(input.products)
    ? input.products.map((item) => sanitizeProduct(item)).filter(({ categoryId }) => categoryIds.has(categoryId))
    : [];
  return {
    version: 1,
    catalogueVersion: cleanText(input.catalogueVersion, 40),
    updatedAt: cleanText(input.updatedAt, 40) || new Date().toISOString(),
    settings: sanitizeSettings(input.settings),
    categories,
    products,
  };
}

async function ensureStorage() {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
  await fs.mkdir(path.join(STORAGE_DIR, 'uploads'), { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    const seed = sanitizeContent(JSON.parse(await fs.readFile(SEED_FILE, 'utf8')));
    await atomicWrite(seed);
  }
  await migrateLegacyCatalogue();
}

async function migrateLegacyCatalogue() {
  let current;
  try {
    current = JSON.parse(await fs.readFile(DATA_FILE, 'utf8'));
  } catch {
    return;
  }
  const categoryIds = Array.isArray(current.categories) ? current.categories.map((category) => String(category?.id || '')) : [];
  const isLegacyOnly = categoryIds.length > 0
    && categoryIds.every((id) => LEGACY_CATEGORY_IDS.has(id))
    && !categoryIds.some((id) => CARL_CATEGORY_IDS.has(id));
  const currentProductIds = new Set(Array.isArray(current.products) ? current.products.map((product) => String(product?.id || '')) : []);
  const isPristineLegacySeed = isLegacyOnly
    && currentProductIds.size === LEGACY_PRODUCT_IDS.size
    && [...currentProductIds].every((id) => LEGACY_PRODUCT_IDS.has(id));
  const isPreviousCarlReference = categoryIds.some((id) => CARL_CATEGORY_IDS.has(id))
    && current.catalogueVersion !== CARL_REFERENCE_VERSION
    && PREVIOUS_CARL_PRODUCT_ID_SETS.some((expectedIds) => (
      currentProductIds.size === expectedIds.size
      && [...currentProductIds].every((id) => expectedIds.has(id))
    ));
  if (!isPristineLegacySeed && !isPreviousCarlReference) return;
  try {
    const reference = await import(pathToFileURL(path.join(__dirname, '..', 'src', 'data', 'referenceShop.js')).href);
    const migrated = sanitizeContent({
      ...current,
      catalogueVersion: CARL_REFERENCE_VERSION,
      categories: reference.referenceCategories,
      products: reference.referenceProducts,
      updatedAt: new Date().toISOString(),
    });
    await atomicWrite(migrated);
    console.info(`Migrated catalogue to the Carl-style reference catalogue (${migrated.products.length} products).`);
  } catch (error) {
    console.error(`Legacy catalogue migration skipped: ${error.message}`);
  }
}

async function atomicWrite(content) {
  const tempFile = `${DATA_FILE}.${process.pid}.${crypto.randomBytes(5).toString('hex')}.tmp`;
  await fs.writeFile(tempFile, `${JSON.stringify(content, null, 2)}\n`, { encoding: 'utf8', flag: 'wx' });
  try {
    await fs.copyFile(DATA_FILE, BACKUP_FILE);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      await fs.rm(tempFile, { force: true });
      throw error;
    }
  }
  await fs.rename(tempFile, DATA_FILE);
}

async function readContent() {
  await ensureStorage();
  try {
    return sanitizeContent(JSON.parse(await fs.readFile(DATA_FILE, 'utf8')));
  } catch (error) {
    try {
      const recovered = sanitizeContent(JSON.parse(await fs.readFile(BACKUP_FILE, 'utf8')));
      const corruptFile = `${DATA_FILE}.${Date.now()}.corrupt`;
      await fs.rename(DATA_FILE, corruptFile).catch(() => {});
      await atomicWrite(recovered);
      console.error(`Recovered persisted content from backup after: ${error.message}`);
      return recovered;
    } catch (backupError) {
      throw new Error(`Unable to read persisted content: ${error.message}; backup recovery failed: ${backupError.message}`);
    }
  }
}

function updateContent(mutator) {
  const operation = writeQueue.then(async () => {
    const current = await readContent();
    const changed = await mutator(structuredClone(current));
    const sanitized = sanitizeContent({ ...changed, updatedAt: new Date().toISOString() });
    await atomicWrite(sanitized);
    return sanitized;
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

module.exports = {
  STORAGE_DIR,
  ensureStorage,
  readContent,
  updateContent,
  sanitizeSettings,
  sanitizeCategory,
  sanitizeProduct,
};
