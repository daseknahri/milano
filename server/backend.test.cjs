const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const testStorage = path.join(os.tmpdir(), `milan-backend-${process.pid}-${Date.now()}`);
process.env.STORAGE_DIR = testStorage;
process.env.ADMIN_EMAIL = 'test@example.com';
process.env.ADMIN_USERNAME = 'milan-admin';
process.env.ADMIN_PASSWORD = 'test-password-123';
process.env.SESSION_SECRET = 'a-secure-test-secret-that-is-long-enough';
process.env.COOKIE_SECURE = 'false';

const { createApp } = require('../server.cjs');

let server;
let baseUrl;
let cookie;

test.before(async () => {
  const app = await createApp();
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await fs.rm(testStorage, { recursive: true, force: true });
});

test('health and seeded public content are available', async () => {
  const health = await fetch(`${baseUrl}/health`);
  assert.equal(health.status, 200);
  const response = await fetch(`${baseUrl}/api/content`);
  const content = await response.json();
  assert.equal(response.status, 200);
  assert.equal(content.settings.city, 'Tanger');
  assert.equal(content.settings.shortName, 'Milan Auto');
  assert.match(content.settings.mapUrl, /^https:\/\/www\.google\.com\/maps/);
  assert.ok(content.categories.length >= 5);
  assert.ok(content.products.length >= 8);
  assert.equal(content.products[0].category, content.products[0].categoryId);
  assert.equal(content.products[0].image, content.products[0].images[0]);
  assert.ok(Array.isArray(content.products[0].vehicleModels));
});

test('admin is protected and valid credentials create a session', async () => {
  assert.equal((await fetch(`${baseUrl}/api/admin/content`)).status, 401);
  const response = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'milan-admin', password: 'test-password-123' }),
  });
  assert.equal(response.status, 200);
  cookie = response.headers.get('set-cookie').split(';')[0];
  assert.match(cookie, /^milan_admin=/);
  assert.equal((await fetch(`${baseUrl}/api/admin/session`, { headers: { cookie } })).status, 200);
});

test('admin can update settings and create then delete content', async () => {
  const settingsResponse = await fetch(`${baseUrl}/api/admin/settings`, {
    method: 'PUT',
    headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ announcement: 'Test persistant' }),
  });
  assert.equal(settingsResponse.status, 200);
  assert.equal((await settingsResponse.json()).announcement, 'Test persistant');

  const categoryResponse = await fetch(`${baseUrl}/api/admin/categories`, {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Test catégorie', slug: 'test-category' }),
  });
  assert.equal(categoryResponse.status, 201);
  const category = await categoryResponse.json();

  const productResponse = await fetch(`${baseUrl}/api/admin/products`, {
    method: 'POST',
    headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Test produit',
      category: category.id,
      brand: 'Test Brand',
      vehicleModels: ['Modèle A'],
      years: '2020–2026',
      image: '/assets/logo-mark.png',
      gallery: ['/assets/category-bodykit.webp'],
      compareAtPrice: 999,
      inStock: false
    }),
  });
  assert.equal(productResponse.status, 201);
  const product = await productResponse.json();
  assert.equal(product.categoryId, category.id);
  assert.equal(product.category, category.id);
  assert.equal(product.brand, 'Test Brand');
  assert.equal(product.image, '/assets/logo-mark.png');
  assert.equal(product.gallery[0], '/assets/category-bodykit.webp');
  assert.equal(product.compareAtPrice, 999);
  assert.equal(product.inStock, false);
  assert.equal(product.available, false);

  const deleteResponse = await fetch(`${baseUrl}/api/admin/categories/${category.id}`, {
    method: 'DELETE',
    headers: { cookie },
  });
  assert.equal(deleteResponse.status, 200);
  assert.equal((await deleteResponse.json()).deletedProducts, 1);
});

test('upload validates file content and returns a persisted URL', async () => {
  const png = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');
  const form = new FormData();
  form.append('media', new Blob([png], { type: 'image/png' }), 'sample.png');
  const response = await fetch(`${baseUrl}/api/admin/upload`, {
    method: 'POST',
    headers: { cookie },
    body: form,
  });
  assert.equal(response.status, 201);
  const { url } = await response.json();
  assert.match(url, /^\/uploads\/.+\.png$/);
  assert.equal((await fetch(`${baseUrl}${url}`)).status, 200);
});
