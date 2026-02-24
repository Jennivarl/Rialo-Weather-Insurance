# Rialo Weather Insurance

A blockchain-based weather insurance platform built on Rialo DevNet. Users can set up policies that automatically pay out when rainfall exceeds a specified threshold, enabling automated protection for delivery companies and agricultural operations.

## Features

- **Automated Weather Payouts**: Smart contract fetches live weather data from OpenWeatherMap and pays out automatically when rainfall thresholds are exceeded
- **User Policy Management**: Simple interface for setting up policies with custom rainfall thresholds and payout amounts
- **Single Payout Guard**: Safety mechanism ensures each policy pays out only once
- **Live Weather Integration**: Real-time weather data integration via OpenWeatherMap API
- **Non-Custodial**: Direct token transfers to users' wallets

## Project Structure

```
rialo-weather-insurance/
├── frontend/           # Web interface (HTML/CSS/JavaScript)
│   ├── index.html      # Main UI
│   ├── app.js          # Form handling and wallet integration
│   ├── style.css       # Styling with dark brown theme
│   └── bg-blobs.svg    # Background assets
├── contract/           # Smart contract (Rust/RISC-V)
│   ├── Cargo.toml      # Rust dependencies
│   └── src/
│       └── lib.rs      # Main contract logic
└── README.md           # This file
```

## Smart Contract Overview

### Contract Address
Deployed on Rialo DevNet

### Key Instructions

1. **`setup_policy(location, threshold_mm, payout_amount, api_key)`**
   - Allows a user to register a weather insurance policy
   - `location`: City name (e.g., "Nairobi")
   - `threshold_mm`: Rainfall threshold in millimeters (min: 0.1 mm)
   - `payout_amount`: Tokens to pay out (max: 200 RALO)
   - `api_key`: OpenWeatherMap API key

2. **`check_weather_and_pay()`**
   - Fetches live weather data from OpenWeatherMap
   - Automatically pays out if rainfall >= threshold
   - Can only be called once per policy (single payout guard)

### Safety Features
- Minimum rainfall threshold: 0.1 mm (prevents trivial claims)
- Maximum payout: 200 RALO (caps exposure)
- Single payout guard: Each policy pays out once

## Building the Smart Contract

### Prerequisites
- Rust 1.70+ with RISC-V target
- Rialo SDK

### Build Steps

```bash
cd contract

# Install RISC-V target
rustup target add riscv64gc-unknown-none-elf

# Build for Rialo DevNet (RISC-V target)
cargo build --target riscv64gc-unknown-none-elf --release

# Output: target/riscv64gc-unknown-none-elf/release/weather_insurance
```

### Deploy

```bash
# Use Rialo CLI to deploy the compiled contract
rialo deploy target/riscv64gc-unknown-none-elf/release/weather_insurance
```

## Frontend Setup

### Prerequisites
- Node.js 16+ (for running a local server)
- A web browser with wallet support (e.g., Rialo Wallet extension or ethers.js compatible wallet)

### Installation & Running

```bash
cd frontend

# Option 1: Python HTTP Server (for quick local testing)
python -m http.server 3000

# Option 2: Node.js with simple-http-server
npx http-server -p 3000

# Access at: http://localhost:3000
```

### Frontend Features
- **Dark Brown Theme**: Clean, professional UI with organic gradient blob backgrounds
- **Wallet Integration**: Connect wallet and sign transactions
- **Policy Setup Form**: Input location, rainfall threshold, and payout amount
- **Payment Processing**: Submit policies to the smart contract

## How It Works

### User Flow

1. **User Connects Wallet**
   - Click "Connect Wallet" on the frontend
   - Approve wallet connection in Rialo Wallet extension

2. **User Sets Up Policy**
   - Enter delivery location (e.g., "Nairobi")
   - Set rainfall threshold (e.g., 50 mm)
   - Set payout amount (e.g., 50 RALO)
   - Provide OpenWeatherMap API key
   - Submit policy to smart contract

3. **Policy Monitoring**
   - Contract is live and watching weather data
   - Anyone can call `check_weather_and_pay()` to trigger a payout check

4. **Automatic Payout**
   - If rainfall >= threshold → contract pays user automatically
   - Transaction is non-reversible (single payout guard)

### Smart Contract Flow

```
setup_policy()
    ↓
User creates policy (location, threshold, payout amount)
    ↓
Policy stored on-chain
    ↓
check_weather_and_pay()
    ↓
Contract calls OpenWeatherMap API
    ↓
Rainfall >= Threshold?
    ├─ YES → Transfer payout to user wallet
    └─ NO  → No action
```

## Configuration

### OpenWeatherMap API Key

1. Sign up at [OpenWeatherMap](https://openweathermap.org/api)
2. Get your free API key
3. Provide it when setting up a policy through the frontend

### Supported Locations

Any city recognized by OpenWeatherMap:
- "Nairobi"
- "Kampala"
- "Lagos"
- "New York"
- "London"
- etc.

## Testing

### Local Testing with Anvil

```bash
# In a separate terminal, start a local blockchain
anvil

# Deploy contract to local Anvil instance
# Update contract with local network address
# Run frontend pointing to local contract
```

### Network Addresses

- **Rialo DevNet RPC**: `https://rpc.rialo.io`
- **Contract Deployment**: Use Rialo CLI or web interface

## Design System

The frontend uses a modern dark theme:
- **Primary Color**: #1A1714 (Dark Brown)
- **Background**: #f5f1e8 (Cream)
- **Accents**: Organic gradient blob patterns
- **Font**: Georgia serif for headings, sans-serif for body

## Security Considerations

1. **API Key Security**: Never expose your OpenWeatherMap API key in frontend code (it should be environment variable or backend service)
2. **Single Payout Guard**: Prevents double-spending of the same policy
3. **Threshold Caps**: Minimum threshold and maximum payout prevent edge cases
4. **Non-Custodial**: Users maintain full control of their funds (no intermediary)

## Future Enhancements

- Multiple weather conditions (wind speed, temperature, snow)
- Policy expiration dates
- Partial payouts based on exact rainfall amounts
- Integration with weather oracles for increased accuracy
- Historical claim data and statistics dashboard

## License

MIT

## Contact

For questions or collaboration, reach out via GitHub Issues.

---

**Built with Rialo SDK** for the Rialo Developer Program
