# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Stripe setup (backend)

This project includes minimal Stripe integration on the backend.

- `GET /api/plans` returns the available plans and their configured price IDs (read from `.env`).
- `POST /api/create-checkout-session` creates a Stripe Checkout session for a subscription price.

To create Stripe Products and Prices programmatically (idempotent), use the helper script:

1. Add your secret key to `.env`:

```
STRIPE_SECRET_KEY=sk_live_xxx
```

2. Run the initialization script which will create products and monthly prices and print the resulting price IDs:

```bash
npm run stripe:init
```

3. Copy the printed price IDs into your `.env` as `STRIPE_PRICE_SCOUT`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ELITE` so the `/api/plans` endpoint returns them to the frontend.

Example `.env` additions:

```
STRIPE_PRICE_SCOUT=price_xxx
STRIPE_PRICE_PRO=price_xxx
STRIPE_PRICE_ELITE=price_xxx
```

After updating `.env`, restart the server:

```bash
npm run server
```

Then you can call the Checkout session endpoint:

```bash
curl -X POST http://localhost:3001/api/create-checkout-session \
  -H 'Content-Type: application/json' \
  -d '{"priceId":"price_xxx","successUrl":"https://example.com/success","cancelUrl":"https://example.com/cancel","customerEmail":"user@example.com"}'
```

## NBA Data Integration

This project now integrates BallDontLie and ESPN live scores via backend proxy endpoints.

- `GET /api/nba/players` returns real Chicago Bulls players with season stats and HoopIQ priority scoring.
- `GET /api/nba/live-scores` returns live NBA scores from ESPN, with Bulls games prioritized.

## Vercel deployment

This project is configured for Vercel with a static frontend build and a serverless Express backend.

- `vercel.json` routes `/api/*` to `api/server.js`
- Frontend is built by `npm run build` into `dist`
- The backend is served by Vercel Node at runtime

To deploy:

```bash
npm install -g vercel
vercel login
npm run deploy
```

Set the following environment variables in the Vercel dashboard or via `vercel env`:

- `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_SCOUT`
- `STRIPE_PRICE_PRO`
- `STRIPE_PRICE_ELITE`

If you want, I can also add a `vercel` `package.json` script for non-interactive deploys.

