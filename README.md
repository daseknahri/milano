# Milan Automobile Accessoires

Premium automotive accessories storefront and protected content admin for Milan Auto Accessoires in Tangier, Morocco.

## Product direction

- Visual thesis: a cinematic Tangier night showroom where piano black, warm titanium, and precise LED light make every transformation feel bespoke.
- Content plan: full-bleed transformation hero, vehicle finder, signature services, curated product catalog, workshop proof, then WhatsApp conversion.
- Interaction thesis: staged hero entrance, slow image depth on scroll, magnetic product media hovers, and a compact mobile navigation/cart flow.

The public site is in French-first copy and supports content managed from `/admin`. Products, categories, business details, social links, and media can be updated without editing code.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The development server proxies API and upload requests to Express on port `3008`.

For a production-style local check:

```bash
npm run build
npm start
```

Then open `http://localhost:3008`.

Development-only admin credentials are:

- username: `admin@milan-auto.local`
- password: `change-me-now`

Production refuses to start until secure `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `SESSION_SECRET` values are configured.

## Content and media

The admin workspace at `/admin` manages:

- storefront identity, hero, story, address, phone, WhatsApp, hours, and social links
- product categories
- products, compatibility, prices or quote labels, stock state, features, and galleries
- direct image uploads or external media URLs

Content is stored in `storage/content.json` and uploads in `storage/uploads`. Both paths are ignored by Git. The first start seeds them from `server/data/content.seed.json`.

## Deployment

The included Docker image runs the storefront, API, admin, and media service together on port `3008`. See [DEPLOYMENT.md](./DEPLOYMENT.md) for the Coolify variables and persistent-volume setup.

## Verification

```bash
npm run lint
npm run check
npm run test:server
npm run build
```
