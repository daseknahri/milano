const express = require('express');
const cookieParser = require('cookie-parser');
const multer = require('multer');
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

const PORT = Number(process.env.PORT || 3008);
const HOST = process.env.HOST || '0.0.0.0';
const DIST_DIR = path.join(__dirname, 'dist');
const UPLOAD_DIR = path.join(STORAGE_DIR, 'uploads');
const MAX_UPLOAD_BYTES = Math.min(Number(process.env.MAX_UPLOAD_MB || 20), 50) * 1024 * 1024;

const allowedTypes = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
  'image/gif': ['gif'],
  'video/mp4': ['mp4'],
  'video/webm': ['webm'],
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 4 },
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
  if (buffer.length >= 6 && ['GIF87a', 'GIF89a'].includes(buffer.subarray(0, 6).toString())) return 'gif';
  if (buffer.length >= 12 && buffer.subarray(4, 8).toString() === 'ftyp') return 'mp4';
  if (buffer.length >= 4 && buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return 'webm';
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

async function createApp() {
  validateAuthConfig();
  await ensureStorage();
  await readContent();
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', Number(process.env.TRUST_PROXY || 1));
  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Cross-Origin-Resource-Policy': 'same-origin',
    });
    next();
  });
  app.use(express.json({ limit: '512kb', strict: true }));
  app.use(express.urlencoded({ extended: false, limit: '64kb' }));
  app.use(cookieParser());

  app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'milan-automobile-accessoires', uptime: Math.round(process.uptime()) }));
  app.get('/api/content', asyncRoute(async (_req, res) => res.json(publicContent(await readContent()))));

  app.get('/api/admin/session', getSession);
  app.post('/api/admin/login', login);
  app.post('/api/admin/logout', logout);
  app.use('/api/admin', requireAdmin);

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
    let deletedProducts = 0;
    await updateContent((current) => {
      const index = findIndex(current.categories, req.params.id);
      if (index < 0) {
        const error = new Error('Catégorie introuvable.');
        error.status = 404;
        throw error;
      }
      current.categories.splice(index, 1);
      const before = current.products.length;
      current.products = current.products.filter(({ categoryId }) => categoryId !== req.params.id);
      deletedProducts = before - current.products.length;
      return current;
    });
    res.json({ deleted: true, deletedProducts });
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
    const filename = `${Date.now()}-${crypto.randomBytes(10).toString('hex')}.${extension}`;
    await fsp.writeFile(path.join(UPLOAD_DIR, filename), req.file.buffer, { flag: 'wx', mode: 0o644 });
    return res.status(201).json({ url: `/uploads/${filename}` });
  }));

  app.use('/uploads', express.static(UPLOAD_DIR, { fallthrough: false, immutable: true, maxAge: '30d', index: false }));
  app.use(express.static(DIST_DIR, { maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0, index: false }));
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
    .then((app) => app.listen(PORT, HOST, () => console.log(`Milan Auto server listening on http://${HOST}:${PORT}`)))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { createApp };
