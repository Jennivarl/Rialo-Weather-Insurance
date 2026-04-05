# Rialo Weather Insurance — PayOnRain

Parametric weather insurance powered by Solana. Set a weather threshold, pay a $2 premium, and receive a $10 USDC payout automatically when real-world conditions are met.

**Live App:** https://payonrain.up.railway.app  
**Backend API:** https://rialo-weather-insurance-production.up.railway.app/api

---

## Features

### PayOnRain App
- **Privy authentication** — email login with embedded Solana wallet (no seed phrase required)
- **Multi-type weather policies** — choose rainfall (mm), temperature (°C), or wind speed (km/h)
- **Trigger direction** — fire payout when a condition goes *above* or *below* your threshold
- **Coverage periods** — 1-day, 3-day, or 7-day windows
- **Flexible location** — city name search or precise GPS lat/lon coordinates
- **Fixed premium model** — $2 premium → $10 USDC payout (5× multiplier)
- **Live weather data** — real-time checks against a live weather API
- **On-chain Solana payouts** — USDC transfers on Solana devnet with Solana Explorer links
- **Devnet faucet** — automatic devnet USDC drip on first login for instant testing
- **Policy history** — view all past policies and their settlement outcomes
- **User profile** — set a display name and upload a profile picture
- **Wallet balance** — live SOL and USDC balance shown in the header

### Insurance Platform (Marketing UI)
- **Homepage** — feature overview, insurance types (agricultural, event, business), and social proof
- **Get Quote** — multi-step form with business details, coverage dates, and instant quote generation
- **Dashboard** — active/expired policy list, weather analytics charts, and claims history
- **Claims** — claim submission form with document upload and live status tracking

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| UI Components | shadcn/ui (Radix UI primitives) |
| Auth | Privy (`@privy-io/react-auth`) |
| Blockchain | Solana devnet, SPL Token (USDC) |
| Wallet | Privy embedded Solana wallet |
| Backend | Node.js, Express |
| Weather data | Live weather API (OpenWeather-compatible) |
| Database | JSON flat-file (dev/demo) |
| Smart Contract | Rust (Solana/Anchor) |
| Hosting | Railway (frontend + backend, Docker containers) |

---

## Project Structure

```
rialo-weather-insurance/
├── frontend/               # React/TypeScript app (Vite)
│   ├── index.html          # OG/Twitter card meta tags, app entry point
│   └── src/
│       ├── app/
│       │   ├── pages/      # PayOnRainAppWithBackend, Dashboard, Claims, Quote, Home
│       │   └── components/ # AuthModal, Layout, RialoLogo, shadcn/ui
│       └── services/       # Typed API client (api.ts)
├── api/                    # Vercel-compatible serverless handlers
│   ├── policies.js         # POST /api/policies
│   ├── payouts.js          # POST /api/payouts
│   └── weather/[policy_id].js  # GET /api/weather/:id
├── contract/               # Rust smart contract (Solana/Anchor)
│   └── src/lib.rs
├── server.js               # Express backend (Railway)
├── worker.js               # Background payout settlement worker
├── db/                     # JSON data store (orders, settlements, faucet)
├── Dockerfile              # Backend container
├── frontend/Dockerfile     # Frontend Nginx container
├── railway.json            # Railway deploy config
└── DEPLOYMENT.md           # Full deployment guide
```

---

## Local Development

### Prerequisites
- Node.js 18+
- npm

### Frontend

```bash
cd frontend
npm install

# Create .env (or the app defaults to the live Railway backend)
echo "VITE_API_URL=http://localhost:3000/api" > .env
echo "VITE_PRIVY_APP_ID=your-privy-app-id" >> .env

npm run dev
```

Runs at `http://localhost:5173`

### Backend

```bash
npm install
node server.js
```

Runs at `http://localhost:3000`

### Environment Variables

| Variable | Where | Description |
|---|---|---|
| `VITE_API_URL` | `frontend/.env` | Backend base URL (defaults to Railway production URL) |
| `VITE_PRIVY_APP_ID` | `frontend/.env` | Privy project app ID — get one at [privy.io](https://privy.io) |
| `SOLANA_RPC_URL` | backend env | Solana RPC endpoint (default: devnet) |
| `RALO_MINT` | backend env | SPL token mint address for payouts |
| `OPENWEATHER_API_KEY` | backend env | Weather data API key |

---

## Deployment

Both services run as Docker containers on [Railway](https://railway.app).

| Service | URL |
|---|---|
| Frontend | https://payonrain.up.railway.app |
| Backend API | https://rialo-weather-insurance-production.up.railway.app/api |

See [DEPLOYMENT.md](DEPLOYMENT.md) for full step-by-step instructions.

---

## Smart Contract

A Solana program written in Rust lives in `contract/`. It handles on-chain policy logic as a complement to the backend settlement worker (`worker.js`).

```bash
cd contract
cargo build
```

---

## Design

The UI follows the **Rialo** brand system — modern and geometric with black (`#1a1714`) and cream (`#f5f1e8`) as primary colours. Full design specs:

- [FIGMA_SPEC_PRODUCTION.md](FIGMA_SPEC_PRODUCTION.md)
- [FIGMA_DESIGN_SYSTEM.md](FIGMA_DESIGN_SYSTEM.md)
