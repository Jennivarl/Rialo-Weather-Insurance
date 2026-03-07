# Deployment Guide - Vercel + Render

This project uses a **monorepo structure** with separate frontend (React) and backend (Node.js) services.

## Quick Deploy (Vercel + Render)

### 1. Deploy Frontend to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **New Project** → Import repository
3. Select `Rialo-Weather-Insurance` repository
4. **Framework:** React (auto-detected)
5. **Root Directory:** `frontend-react/`
6. **Environment Variables:**
   - Key: `VITE_API_URL`
   - Value: `https://your-backend.onrender.com` (set this after backend deploys)
7. Click **Deploy**

You'll get a domain like: `rialo-weather-insurance.vercel.app`

---

### 2. Deploy Backend to Render

1. Go to [render.com](https://render.com)
2. Click **New +** → **Web Service**
3. Connect GitHub → Select `Rialo-Weather-Insurance`
4. **Service Name:** `rialo-weather-backend`
5. **Environment:** Node
6. **Root Directory:** `prototype`
7. **Build Command:** `npm install`
8. **Start Command:** `npm start`
9. Click **Create Web Service**

You'll get a domain like: `rialo-weather-backend.onrender.com`

---

### 3. Update Vercel with Backend URL

1. Go back to Vercel project settings
2. Find **Environment Variables**
3. Update `VITE_API_URL=https://rialo-weather-backend.onrender.com`
4. Redeploy (Vercel will auto-redeploy on next push, or manually redeploy)

---

## Local Development

Run both services locally:

```bash
npm install:all
npm run dev:local
```

This will start:
- **Frontend:** http://localhost:5174
- **Backend:** http://localhost:3001

---

## Project Structure

```
.
├── frontend-react/        # React app (Vercel)
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── prototype/             # Node.js backend (Render)
│   ├── server.js
│   ├── package.json
│   └── db/                # JSON-based storage
└── package.json           # Root package (info only)
```

---

## API Endpoints

Backend provides these endpoints:

- `POST /api/policies` - Create insurance policy
- `GET /api/weather/:policy_id` - Check weather for policy
- `POST /api/payouts` - Process payout

---

## Notes

- **Frontend** uses Vite for fast development and builds
- **Backend** uses Express.js with Open-Meteo API for live weather data
- **Database** stores policies and settlements in `prototype/db/` (JSON files)
- **Authentication** uses localStorage (mock email/password)

For production, consider upgrading to:
- Real database (PostgreSQL, MongoDB)
- Proper authentication (OAuth, JWT)
- Payment processing (Stripe, PayPal)
