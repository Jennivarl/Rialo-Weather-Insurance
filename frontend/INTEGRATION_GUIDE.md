# PayOnRain Frontend - Rust Backend Integration Guide

This guide explains how to integrate this React frontend with your Rust backend.

## 📁 Project Structure

```
your-project/
├── frontend/              # This React app (from Figma Make)
│   ├── src/
│   │   ├── app/
│   │   │   ├── pages/
│   │   │   │   ├── PayOnRainApp.tsx              # Mock version (current)
│   │   │   │   └── PayOnRainAppWithBackend.tsx   # Real API version
│   │   │   └── components/
│   │   ├── services/
│   │   │   └── api.ts                            # API client
│   │   └── ...
│   ├── package.json
│   ├── .env                                       # Your config (create this)
│   └── .env.example                               # Example config
│
└── backend/               # Your Rust backend
    ├── src/
    │   ├── main.rs
    │   ├── routes/
    │   └── models/
    ├── Cargo.toml
    └── ...
```

## 🚀 Quick Start

### 1. Set up Environment Variables

Create a `.env` file in the frontend root:

```bash
# Copy the example file
cp .env.example .env

# Edit the .env file
VITE_API_URL=http://localhost:8000/api
```

### 2. Switch to Backend-Connected Version

Update `/src/app/App.tsx` to use the real API version:

```tsx
// Change this:
import { PayOnRainApp } from './pages/PayOnRainApp';

// To this:
import { PayOnRainAppWithBackend as PayOnRainApp } from './pages/PayOnRainAppWithBackend';
```

### 3. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 4. Run the Frontend

```bash
npm run dev
# Frontend runs on http://localhost:5173
```

## 🦀 Rust Backend Setup

### Required API Endpoints

Your Rust backend needs to implement these endpoints:

#### 1. Create Policy
```
POST /api/policies
Content-Type: application/json

Request:
{
  "city": "Nairobi",
  "threshold": 50.0,
  "payout": 500.0
}

Response:
{
  "id": "policy_123abc",
  "city": "Nairobi",
  "threshold": 50.0,
  "payout": 500.0,
  "created_at": "2026-03-05T10:30:00Z"
}
```

#### 2. Check Weather
```
GET /api/weather/{policy_id}

Response:
{
  "location": "Nairobi",
  "rainfall": 65.5,
  "threshold": 50.0,
  "condition": "Heavy Rain",
  "temperature": "18°C",
  "triggered": true
}
```

#### 3. Process Payout
```
POST /api/payouts
Content-Type: application/json

Request:
{
  "policy_id": "policy_123abc",
  "payout_method": "bank"
}

Response:
{
  "transaction_id": "txn_xyz789",
  "amount": 500.0,
  "status": "Processing Complete",
  "payout_method": "bank"
}
```

### Example Rust Backend (using Axum)

```rust
// Cargo.toml
[dependencies]
axum = "0.7"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tower-http = { version = "0.5", features = ["cors"] }

// src/main.rs
use axum::{
    Router,
    routing::{get, post},
    Json,
    extract::{Path, State},
};
use serde::{Deserialize, Serialize};
use tower_http::cors::{CorsLayer, Any};
use std::net::SocketAddr;

#[derive(Debug, Serialize, Deserialize)]
struct CreatePolicyRequest {
    city: String,
    threshold: f64,
    payout: f64,
}

#[derive(Debug, Serialize)]
struct PolicyResponse {
    id: String,
    city: String,
    threshold: f64,
    payout: f64,
    created_at: String,
}

#[derive(Debug, Serialize)]
struct WeatherResponse {
    location: String,
    rainfall: f64,
    threshold: f64,
    condition: String,
    temperature: String,
    triggered: bool,
}

#[derive(Debug, Deserialize)]
struct PayoutRequest {
    policy_id: String,
    payout_method: String,
}

#[derive(Debug, Serialize)]
struct PayoutResponse {
    transaction_id: String,
    amount: f64,
    status: String,
    payout_method: String,
}

async fn create_policy(
    Json(payload): Json<CreatePolicyRequest>,
) -> Json<PolicyResponse> {
    // Your policy creation logic here
    let policy = PolicyResponse {
        id: format!("policy_{}", uuid::Uuid::new_v4()),
        city: payload.city,
        threshold: payload.threshold,
        payout: payload.payout,
        created_at: chrono::Utc::now().to_rfc3339(),
    };
    
    Json(policy)
}

async fn check_weather(
    Path(policy_id): Path<String>,
) -> Json<WeatherResponse> {
    // Your weather checking logic here
    // This would call a real weather API
    let rainfall = 65.5; // From weather API
    let threshold = 50.0; // From database
    
    let weather = WeatherResponse {
        location: "Nairobi".to_string(),
        rainfall,
        threshold,
        condition: "Heavy Rain".to_string(),
        temperature: "18°C".to_string(),
        triggered: rainfall >= threshold,
    };
    
    Json(weather)
}

async fn process_payout(
    Json(payload): Json<PayoutRequest>,
) -> Json<PayoutResponse> {
    // Your payout processing logic here
    let payout = PayoutResponse {
        transaction_id: format!("txn_{}", uuid::Uuid::new_v4()),
        amount: 500.0, // From database
        status: "Processing Complete".to_string(),
        payout_method: payload.payout_method,
    };
    
    Json(payout)
}

#[tokio::main]
async fn main() {
    // Enable CORS for the frontend
    let cors = CorsLayer::new()
        .allow_origin("http://localhost:5173".parse::<axum::http::HeaderValue>().unwrap())
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/api/policies", post(create_policy))
        .route("/api/weather/:policy_id", get(check_weather))
        .route("/api/payouts", post(process_payout))
        .layer(cors);

    let addr = SocketAddr::from(([127, 0, 0, 1], 8000));
    println!("Backend listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
```

## 🌐 Deployment Options

### Option 1: Separate Deployments (Recommended)

**Frontend (Vercel/Netlify):**
```bash
# Build the frontend
npm run build

# Deploy dist/ folder
# Update VITE_API_URL to production backend URL
```

**Backend (your Rust server):**
- Deploy to your preferred platform (AWS, DigitalOcean, etc.)
- Update CORS to allow your frontend domain

### Option 2: Backend Serves Frontend

Modify your Rust backend to serve the built frontend:

```rust
use tower_http::services::ServeDir;

let app = Router::new()
    // API routes
    .route("/api/policies", post(create_policy))
    .route("/api/weather/:policy_id", get(check_weather))
    .route("/api/payouts", post(process_payout))
    // Serve frontend static files
    .nest_service("/", ServeDir::new("frontend/dist"))
    .layer(cors);
```

Build process:
```bash
# 1. Build frontend
cd frontend
npm run build

# 2. Build backend
cd ../backend
cargo build --release

# 3. Run
./target/release/your-app
```

## 🔧 Customization

### Updating API Endpoints

Edit `/src/services/api.ts` to match your backend structure:

```typescript
// Change endpoint paths
async createPolicy(data: CreatePolicyRequest): Promise<PolicyResponse> {
  return this.request<PolicyResponse>('/v1/insurance/policies', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

### Adding Authentication

If your backend requires authentication:

```typescript
// In api.ts
private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch(`${this.baseURL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options?.headers,
    },
  });
  // ...
}
```

## 📝 Data Models

Make sure your Rust structs match the TypeScript interfaces in `/src/services/api.ts`:

```rust
// Rust
#[derive(Serialize, Deserialize)]
struct CreatePolicyRequest {
    city: String,
    threshold: f64,
    payout: f64,
}
```

```typescript
// TypeScript
interface CreatePolicyRequest {
  city: string;
  threshold: number;
  payout: number;
}
```

## 🐛 Troubleshooting

### CORS Errors
Add CORS headers in your Rust backend:
```rust
let cors = CorsLayer::new()
    .allow_origin("http://localhost:5173".parse().unwrap())
    .allow_methods(vec![Method::GET, Method::POST])
    .allow_headers(Any);
```

### Connection Refused
- Check backend is running on port 8000
- Verify VITE_API_URL in .env matches backend URL
- Check firewall settings

### Type Mismatches
- Ensure Rust struct fields match TypeScript interface properties
- Check JSON serialization format

## 📚 Next Steps

1. ✅ Set up your Rust backend with the required endpoints
2. ✅ Configure CORS
3. ✅ Update .env with your backend URL
4. ✅ Switch to PayOnRainAppWithBackend in App.tsx
5. ✅ Test the full flow
6. ✅ Deploy!

## 🤝 Support

If you need help:
- Check the console for error messages
- Verify network requests in browser DevTools
- Ensure backend logs show incoming requests
- Confirm data types match between frontend and backend
