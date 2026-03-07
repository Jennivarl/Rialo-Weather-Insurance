# 🚀 Quick Start Guide - Export & Integration

## Step 1: Export from Figma Make

1. Click **Export** or **Download** button in Figma Make
2. Extract the `.zip` file to your computer
3. This gives you a complete React + TypeScript project

## Step 2: Set Up the Frontend

```bash
# Navigate to the extracted folder
cd payonrain-frontend

# Install dependencies
npm install
# or
pnpm install

# Create environment file
cp .env.example .env

# Edit .env and set your backend URL
# VITE_API_URL=http://localhost:8000/api

# Run the development server
npm run dev
```

Frontend runs at: `http://localhost:5173`

## Step 3: Connect to Your Rust Backend

### Option A: Use Mock Data (Current Setup)
The app works out-of-the-box with mock data. Perfect for testing the UI.

### Option B: Connect to Real Backend

1. **Update App.tsx:**
```tsx
// File: /src/app/App.tsx
// Change from:
import { PayOnRainApp } from './pages/PayOnRainApp';

// To:
import { PayOnRainAppWithBackend as PayOnRainApp } from './pages/PayOnRainAppWithBackend';
```

2. **Your backend needs these 3 endpoints:**

```
POST   /api/policies        - Create new policy
GET    /api/weather/:id     - Check weather data
POST   /api/payouts         - Process payout
```

3. **Enable CORS in your Rust backend:**
```rust
use tower_http::cors::{CorsLayer, Any};

let cors = CorsLayer::new()
    .allow_origin("http://localhost:5173".parse().unwrap())
    .allow_methods(Any)
    .allow_headers(Any);
```

## Step 4: Deploy

### Frontend (Vercel/Netlify):
```bash
npm run build
# Deploy the dist/ folder
```

### Backend:
Deploy your Rust app to your server and update `.env`:
```
VITE_API_URL=https://your-backend.com/api
```

## 📚 Detailed Documentation

- **Full Integration Guide:** See `/INTEGRATION_GUIDE.md`
- **Rust Models:** See `/rust-backend-example/models.rs`
- **API Client:** See `/src/services/api.ts`

## 🔧 File Structure

```
payonrain-frontend/
├── src/
│   ├── app/
│   │   ├── App.tsx                    # Main entry point
│   │   ├── pages/
│   │   │   ├── PayOnRainApp.tsx       # Mock version ✅ (current)
│   │   │   └── PayOnRainAppWithBackend.tsx  # Real API version
│   │   └── components/
│   └── services/
│       └── api.ts                     # API client for Rust backend
├── .env.example                       # Example environment variables
├── package.json
├── INTEGRATION_GUIDE.md              # Detailed integration docs
├── QUICK_START.md                    # This file
└── rust-backend-example/
    └── models.rs                      # Rust structs to copy
```

## 🎯 Key Points

1. **Works Standalone:** The frontend works with mock data by default
2. **Easy Integration:** Just 3 API endpoints needed
3. **Type-Safe:** TypeScript frontend + Rust backend = full type safety
4. **Flexible Deployment:** Deploy separately or together

## ✅ Checklist

- [ ] Download and extract code from Figma Make
- [ ] Run `npm install`
- [ ] Test with mock data (`npm run dev`)
- [ ] Set up 3 API endpoints in Rust backend
- [ ] Enable CORS in Rust
- [ ] Update `.env` with backend URL
- [ ] Switch to `PayOnRainAppWithBackend` in App.tsx
- [ ] Test full flow
- [ ] Deploy!

## 🆘 Need Help?

Check the `/INTEGRATION_GUIDE.md` for:
- Complete Rust backend example
- CORS troubleshooting
- Deployment strategies
- Authentication setup
- Error handling

## 🎨 Current Features

✅ Mock authentication
✅ 3-step progressive flow
✅ Sky blue color scheme
✅ Responsive design
✅ Real-time weather checking
✅ Payout processing
✅ Transaction confirmation
✅ Ready for backend integration

Happy coding! 🚀
