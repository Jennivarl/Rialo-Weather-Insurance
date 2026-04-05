
# PayOnRain — Frontend

React + TypeScript frontend for the [Rialo](https://payonrain.up.railway.app) weather insurance platform.

Original Figma project: https://www.figma.com/design/ujrKBHlqWc6zOMUYB2xyLA/Weather-Insurance-App

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui (Radix UI)
- Privy (`@privy-io/react-auth`) for auth and embedded Solana wallets
- Recharts for dashboard analytics

## Setup

```bash
npm install

# Optional: override the backend URL (defaults to Railway production)
echo "VITE_API_URL=http://localhost:3000/api" > .env
echo "VITE_PRIVY_APP_ID=your-privy-app-id" >> .env

npm run dev
```

Runs at `http://localhost:5173`

## Routes

| Path | Page | Description |
|---|---|---|
| `/` | `HomePage` | Marketing landing with features and insurance types |
| `/quote` | `GetQuotePage` | Multi-step quote builder |
| `/dashboard` | `DashboardPage` | Policy list + weather analytics charts |
| `/claims` | `ClaimsPage` | Submit and track claims |

The primary experience is `PayOnRainAppWithBackend`, rendered via `App.tsx` as the full app shell.

## Key Files

- `src/app/pages/PayOnRainAppWithBackend.tsx` — production app (Privy, Solana, live weather)
- `src/app/pages/PayOnRainApp.tsx` — self-contained demo (no backend, simulated data)
- `src/services/api.ts` — typed API client
- `src/app/App.tsx` — Privy provider config and root render
  