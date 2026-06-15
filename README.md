# Kult Games V3

Frontend for the Kult browser gaming experience.

## Getting started

Requirements:
- Node.js 18+
- npm

Install and run:

```sh
npm install
npm run dev
```
dd
Build for production:

```sh
npm run build
npm run preview
```

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - production build
- `npm run preview` - preview production build
- `npm run lint` - run ESLint
- `npm run test` - run tests once
- `npm run test:watch` - run tests in watch mode

## Stack

- React + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- TanStack Query

## Telegram Mini App and TON

The app automatically signs in Telegram Mini App users with Telegram `initData`. It also supports
Privy Telegram login, Privy TON embedded wallets, and TonConnect.

Required deployment setup:

- Set `VITE_PRIVY_APP_ID` to the same Privy app configured on the backend.
- Enable Telegram login and TON embedded wallets in that Privy app.
- Configure the Mini App URL and domain for the same bot in BotFather.
- Update `public/tonconnect-manifest.json` to the production frontend URL, or set
  `VITE_TONCONNECT_MANIFEST_URL` to a hosted manifest.
