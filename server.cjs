const express = require('express');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const multer = require('multer');
const sharp = require('sharp');
const crypto = require('node:crypto');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const {
  STORAGE_DIR,
  ensureStorage,
  readContent,
  updateContent,
  sanitizeSettings,
  sanitizeCategory,
  sanitizeProduct,
} = require('./server/store.cjs');
const { login, logout, getSession, requireAdmin, validateAuthConfig } = require('./server/auth.cjs');

function numericEnv(name, fallback, minimum, maximum) {
  const value = process.env[name] === undefined ? fallback : Number(process.env[name]);
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be a number between ${minimum} and ${maximum}.`);
  }
  return value;
}

const PORT = numericEnv('PORT', 3008, 1, 65535);
const HOST = process.env.HOST || '0.0.0.0';
const TRUST_PROXY = numericEnv('TRUST_PROXY', 1, 0, 10);
const DIST_DIR = path.join(__dirname, 'dist');
const UPLOAD_DIR = path.join(STORAGE_DIR, 'uploads');
const MAX_UPLOAD_BYTES = numericEnv('MAX_UPLOAD_MB', 20, 1, 50) * 1024 * 1024;

const allowedTypes = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
};

const upload = multer({
  storage: multer.memoryStorage(),
  // Keep multipart requests bounded even when a client sends no file.
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 4, parts: 8 },
  fileFilter(_req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase().slice(1);
    const extensions = allowedTypes[file.mimetype];
    callback(extensions?.includes(extension) ? null : new Error('Type de fichier non autorisé.'), Boolean(extensions?.includes(extension)));
  },
});

function detectedExtension(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'png';
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') return 'webp';
  return null;
}

function sortByOrder(items) {
  return [...items].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, 'fr'));
}

function publicContent(content) {
  return {
    ...content,
    categories: sortByOrder(content.categories.filter(({ active }) => active)),
    products: sortByOrder(content.products.filter(({ active }) => active)),
  };
}

function findIndex(items, id) {
  return items.findIndex((item) => item.id === String(id));
}

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function requireTrustedOrigin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const fetchSite = req.get('sec-fetch-site');
  if (fetchSite && !['same-origin', 'none'].includes(fetchSite)) {
    return res.status(403).json({ error: 'Origine de requête refusée.' });
  }
  const origin = req.get('origin');
  if (!origin) return next();
  try {
    const expectedOrigin = `${req.protocol}://${req.get('host')}`;
    if (new URL(origin).origin !== expectedOrigin) {
      return res.status(403).json({ error: 'Origine de requête refusée.' });
    }
  } catch {
    return res.status(403).json({ error: 'Origine de requête invalide.' });
  }
  return next();
}

async function createApp() {
  validateAuthConfig();
  await ensureStorage();
  await readContent();
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', TRUST_PROXY);
  app.use(compression({ threshold: 1024 }));
  app.use((req, res, next) => {
    const policy = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "media-src 'self' blob: https:",
      "connect-src 'self'",
      "frame-src https://www.google.com",
      process.env.NODE_ENV === 'production' ? 'upgrade-insecure-requests' : '',
    ].filter(Boolean).join('; ');
    const headers = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Cross-Origin-Resource-Policy': 'same-origin',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Content-Security-Policy': policy,
      'X-Request-Id': req.get('x-request-id')?.slice(0, 100) || crypto.randomUUID(),
    };
    if (process.env.NODE_ENV === 'production') {
      headers['Strict-Transport-Security'] = 'max-age=31536000';
    }
    res.set(headers);
    next();
  });
  app.use(express.json({ limit: '512kb', strict: true }));
  app.use(express.urlencoded({ extended: false, limit: '64kb' }));
  app.use(cookieParser());

  app.get('/health', asyncRoute(async (_req, res) => {
    await readContent();
    res.set('Cache-Control', 'no-store');
    return res.json({ status: 'ok', service: 'milan-automobile-accessoires', uptime: Math.round(process.uptime()) });
  }));
  app.get('/api/content', asyncRoute(async (_req, res) => {
    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    return res.json(publicContent(await readContent()));
  }));

  app.use('/api/admin', (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    res.vary('Cookie');
    next();
  });
  app.get('/api/admin/session', getSession);
  app.post('/api/admin/login', requireTrustedOrigin, login);
  app.post('/api/admin/logout', requireTrustedOrigin, logout);
  app.use('/api/admin', requireAdmin);
  app.use('/api/admin', requireTrustedOrigin);

  app.get('/api/admin/content', asyncRoute(async (_req, res) => res.json(await readContent())));
  app.put('/api/admin/settings', asyncRoute(async (req, res) => {
    const content = await updateContent((current) => {
      current.settings = sanitizeSettings(req.body, current.settings);
      return current;
    });
    res.json(content.settings);
  }));

  app.post('/api/admin/categories', asyncRoute(async (req, res) => {
    let created;
    await updateContent((current) => {
      created = sanitizeCategory(req.body);
      if (current.categories.some(({ id, slug }) => id === created.id || slug === created.slug)) {
        created.id = `cat_${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`;
        created.slug = `${created.slug}-${created.id.slice(-5)}`;
      }
      current.categories.push(created);
      return current;
    });
    res.status(201).json(created);
  }));

  app.put('/api/admin/categories/:id', asyncRoute(async (req, res) => {
    let updated;
    await updateContent((current) => {
      const index = findIndex(current.categories, req.params.id);
      if (index < 0) {
        const error = new Error('Catégorie introuvable.');
        error.status = 404;
        throw error;
      }
      updated = sanitizeCategory(req.body, current.categories[index]);
      if (current.categories.some((item, itemIndex) => itemIndex !== index && item.slug === updated.slug)) {
        const error = new Error('Une autre catégorie utilise déjà ce slug.');
        error.status = 409;
        throw error;
      }
      current.categories[index] = updated;
      return current;
    });
    res.json(updated);
  }));

  app.delete('/api/admin/categories/:id', asyncRoute(async (req, res) => {
    await updateContent((current) => {
      const index = findIndex(current.categories, req.params.id);
      if (index < 0) {
        const error = new Error('Catégorie introuvable.');
        error.status = 404;
        throw error;
      }
      if (current.products.some(({ categoryId }) => categoryId === req.params.id)) {
        const error = new Error('Réassignez les produits de cette catégorie avant de la supprimer.');
        error.status = 409;
        throw error;
      }
      current.categories.splice(index, 1);
      return current;
    });
    res.json({ deleted: true });
  }));

  app.post('/api/admin/products', asyncRoute(async (req, res) => {
    let created;
    await updateContent((current) => {
      created = sanitizeProduct(req.body);
      if (!current.categories.some(({ id }) => id === created.categoryId)) {
        const error = new Error('La catégorie sélectionnée est introuvable.');
        error.status = 400;
        throw error;
      }
      if (current.products.some(({ id, slug }) => id === created.id || slug === created.slug)) {
        created.id = `prd_${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`;
        created.slug = `${created.slug}-${created.id.slice(-5)}`;
      }
      current.products.push(created);
      return current;
    });
    res.status(201).json(created);
  }));

  app.put('/api/admin/products/:id', asyncRoute(async (req, res) => {
    let updated;
    await updateContent((current) => {
      const index = findIndex(current.products, req.params.id);
      if (index < 0) {
        const error = new Error('Produit introuvable.');
        error.status = 404;
        throw error;
      }
      updated = sanitizeProduct(req.body, current.products[index]);
      if (!current.categories.some(({ id }) => id === updated.categoryId)) {
        const error = new Error('La catégorie sélectionnée est introuvable.');
        error.status = 400;
        throw error;
      }
      if (current.products.some((item, itemIndex) => itemIndex !== index && item.slug === updated.slug)) {
        const error = new Error('Un autre produit utilise déjà ce slug.');
        error.status = 409;
        throw error;
      }
      current.products[index] = updated;
      return current;
    });
    res.json(updated);
  }));

  app.delete('/api/admin/products/:id', asyncRoute(async (req, res) => {
    await updateContent((current) => {
      const index = findIndex(current.products, req.params.id);
      if (index < 0) {
        const error = new Error('Produit introuvable.');
        error.status = 404;
        throw error;
      }
      current.products.splice(index, 1);
      return current;
    });
    res.json({ deleted: true });
  }));

  app.post('/api/admin/upload', upload.single('media'), asyncRoute(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Ajoutez un fichier dans le champ « media ».' });
    const extension = detectedExtension(req.file.buffer);
    const declaredExtensions = allowedTypes[req.file.mimetype] || [];
    if (!extension || !declaredExtensions.includes(extension) && !(extension === 'jpg' && declaredExtensions.includes('jpeg'))) {
      return res.status(415).json({ error: 'Le contenu du fichier ne correspond pas à son type.' });
    }
    let optimized;
    try {
      optimized = await sharp(req.file.buffer, {
        failOn: 'warning',
        limitInputPixels: 40_000_000,
        sequentialRead: true,
      })
        .rotate()
        .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 88, effort: 4 })
        .toBuffer();
    } catch {
      return res.status(415).json({ error: 'Image invalide ou dimensions trop importantes.' });
    }
    const filename = `${Date.now()}-${crypto.randomBytes(10).toString('hex')}.webp`;
    await fsp.writeFile(path.join(UPLOAD_DIR, filename), optimized, { flag: 'wx', mode: 0o644 });
    return res.status(201).json({ url: `/uploads/${filename}` });
  }));

  app.use('/uploads', express.static(UPLOAD_DIR, { fallthrough: false, immutable: true, maxAge: '30d', index: false }));
  app.use('/assets', express.static(path.join(DIST_DIR, 'assets'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1y' : 0,
    immutable: process.env.NODE_ENV === 'production',
    index: false,
  }));
  app.use(express.static(DIST_DIR, {
    maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
    index: false,
    setHeaders(res, filePath) {
      if (filePath.endsWith('index.html')) res.set('Cache-Control', 'no-cache');
    },
  }));
  app.get(/^(?!\/api(?:\/|$)|\/uploads(?:\/|$)|\/health$).*/, (req, res, next) => {
    const indexFile = path.join(DIST_DIR, 'index.html');
    if (!fs.existsSync(indexFile)) return next();
    return res.sendFile(indexFile);
  });

  app.use((req, res) => res.status(404).json({ error: 'Ressource introuvable.' }));
  app.use((error, _req, res, _next) => {
    const isUploadLimit = error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE';
    const status = isUploadLimit ? 413 : Number(error.status || (error instanceof multer.MulterError ? 400 : 500));
    if (status >= 500) console.error(error);
    res.status(status).json({
      error: isUploadLimit
        ? `Fichier trop volumineux (${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} Mo maximum).`
        : status >= 500 ? 'Une erreur interne est survenue.' : error.message,
    });
  });
  return app;
}

if (require.main === module) {
  createApp()
    .then((app) => {
      const server = app.listen(PORT, HOST, () => console.log(`Milan Auto server listening on http://${HOST}:${PORT}`));
      // Avoid connections being held indefinitely by slow or abandoned clients.
      server.requestTimeout = 120_000;
      server.headersTimeout = 15_000;
      server.keepAliveTimeout = 5_000;
      const shutdown = (signal) => {
        console.log(`${signal} received, closing Milan Auto server.`);
        server.close((error) => process.exit(error ? 1 : 0));
        setTimeout(() => process.exit(1), 10_000).unref();
      };
      process.once('SIGTERM', () => shutdown('SIGTERM'));
      process.once('SIGINT', () => shutdown('SIGINT'));
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { createApp };
