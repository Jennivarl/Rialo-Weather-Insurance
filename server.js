const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const https = require('https');
const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Keypair, sendAndConfirmTransaction } = require('@solana/web3.js');
const { createTransferCheckedInstruction, getOrCreateAssociatedTokenAccount } = require('@solana/spl-token');

const DATA_DIR = path.join(__dirname, 'db');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const SETTLEMENTS_FILE = path.join(DATA_DIR, 'settlements.json');
const FAUCET_FILE = path.join(DATA_DIR, 'faucet.json');
const KEYS_FILE = path.join(__dirname, 'keys.json');
if (!fs.existsSync(FAUCET_FILE)) fs.writeFileSync(FAUCET_FILE, JSON.stringify([]));

// ── Solana Configuration ─────────────────────────────────────
// For demo, we use Devnet. In production, use Mainnet-beta.
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
let SOLANA_CONNECTION = null; // Lazy init on demand

function getSolanaConnection() {
    if (!SOLANA_CONNECTION) {
        SOLANA_CONNECTION = new Connection(SOLANA_RPC_URL, 'confirmed');
    }
    return SOLANA_CONNECTION;
}

// Demo token mint address on Devnet (change this to your actual $RALO mint)
// You'll need to create this via spl-token CLI or Metaplex
const RALO_MINT = process.env.RALO_MINT || 'RALo2Cg3dZhgZmq6e5nz1vv8ZVfM2XPUvFWEHW7QLXW';

// Treasury/payout wallet - replace with your actual wallet Pubkey
const PAYOUT_WALLET = process.env.PAYOUT_WALLET || 'BPFLoaderUpgradeab1e11111111111111111111111';

if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, JSON.stringify([]));
if (!fs.existsSync(SETTLEMENTS_FILE)) fs.writeFileSync(SETTLEMENTS_FILE, JSON.stringify([]));

// Generate or load server keypair (simulates enclave public key)
let keypair;
if (fs.existsSync(KEYS_FILE)) {
    keypair = JSON.parse(fs.readFileSync(KEYS_FILE));
    keypair.publicKey = nacl.util.decodeBase64(keypair.publicKey);
    keypair.secretKey = nacl.util.decodeBase64(keypair.secretKey);
} else {
    const kp = nacl.box.keyPair();
    keypair = {
        publicKey: kp.publicKey,
        secretKey: kp.secretKey
    };
    fs.writeFileSync(KEYS_FILE, JSON.stringify({ publicKey: nacl.util.encodeBase64(kp.publicKey), secretKey: nacl.util.encodeBase64(kp.secretKey) }));
}

// ── Solana Treasury Keypair ─────────────────────────────────
// This wallet is the insurance payout treasury on Solana devnet.
// Fund it with: solana airdrop 2 <address> --url devnet
// Then get devnet USDC: https://faucet.circle.com/
const TREASURY_FILE = path.join(__dirname, 'solana-treasury.json');
// Circle's official USDC mint on Solana devnet
const USDC_DEVNET_MINT = process.env.USDC_MINT || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const USDC_DECIMALS = 6;

let treasuryKeypair = null;
try {
    if (process.env.TREASURY_KEYPAIR) {
        // Production: load from environment variable (JSON array string)
        const raw = JSON.parse(process.env.TREASURY_KEYPAIR);
        treasuryKeypair = Keypair.fromSecretKey(Uint8Array.from(raw));
    } else if (fs.existsSync(TREASURY_FILE)) {
        // Local dev: load from file
        const raw = JSON.parse(fs.readFileSync(TREASURY_FILE, 'utf-8'));
        treasuryKeypair = Keypair.fromSecretKey(Uint8Array.from(raw));
    } else {
        // Fallback: generate new keypair and save locally
        treasuryKeypair = Keypair.generate();
        try { fs.writeFileSync(TREASURY_FILE, JSON.stringify(Array.from(treasuryKeypair.secretKey))); } catch { }
    }
    console.log(`[Treasury] Solana wallet: ${treasuryKeypair.publicKey.toBase58()}`);
    console.log(`[Treasury] Fund with: solana airdrop 2 ${treasuryKeypair.publicKey.toBase58()} --url devnet`);
    console.log(`[Treasury] Then get devnet USDC at: https://faucet.circle.com/`);
    console.log(`[Treasury] Explorer: https://explorer.solana.com/address/${treasuryKeypair.publicKey.toBase58()}?cluster=devnet`);
} catch (e) {
    console.error('[Treasury] Keypair error:', e.message);
}

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

// Return server public key (base64)
app.get('/pubkey', (req, res) => {
    res.json({ publicKey: nacl.util.encodeBase64(keypair.publicKey) });
});

// ── Solana Treasury Info ─────────────────────────────────────
app.get('/api/treasury', (req, res) => {
    if (!treasuryKeypair) {
        return res.status(500).json({ error: 'Treasury keypair not initialized' });
    }
    res.json({
        address: treasuryKeypair.publicKey.toBase58(),
        usdcMint: USDC_DEVNET_MINT,
        network: 'devnet',
        explorerUrl: `https://explorer.solana.com/address/${treasuryKeypair.publicKey.toBase58()}?cluster=devnet`,
        fundingNote: `Run: solana airdrop 2 ${treasuryKeypair.publicKey.toBase58()} --url devnet  |  Then get USDC at https://faucet.circle.com/`
    });
});

// ── Weather API endpoint ──────────────────────────────
// Geocode location name to lat/lng using Open-Meteo Geocoding API, then fetch weather
app.get('/weather', async (req, res) => {
    const location = req.query.location;
    if (!location) {
        return res.status(400).json({ error: 'Missing location parameter' });
    }

    try {
        // Step 1: Geocode the location using Open-Meteo Geocoding API
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`;

        const geoData = await fetchJson(geoUrl);

        if (!geoData.results || geoData.results.length === 0) {
            return res.status(404).json({ error: `Location "${location}" not found` });
        }

        const { latitude, longitude, name, country } = geoData.results[0];

        // Step 2: Get weather data from Open-Meteo Weather API
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,rain,precipitation&timezone=auto`;

        const weatherData = await fetchJson(weatherUrl);
        const current = weatherData.current;

        // Decode WMO weather code to condition string
        const condition = decodeWeatherCode(current.weather_code);

        // Return in format expected by frontend
        res.json({
            location: `${name}, ${country}`,
            latitude,
            longitude,
            temp: Math.round(current.temperature_2m),
            humidity: current.relative_humidity_2m,
            condition: condition,
            rainfall_mm: current.precipitation || 0,
            rain: current.rain || 0,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Weather API error:', err.message);
        res.status(500).json({ error: 'Failed to fetch weather data', details: err.message });
    }
});

// Helper: Fetch JSON from HTTPS URL
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const req = https.get(url, { timeout: 10000 }, (resp) => {
            let data = '';

            // Handle non-200 status codes
            if (resp.statusCode !== 200) {
                resp.on('data', chunk => { data += chunk; });
                resp.on('end', () => {
                    reject(new Error(`HTTP ${resp.statusCode}: ${data}`));
                });
                return;
            }

            resp.on('data', chunk => { data += chunk; });
            resp.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`JSON parse error: ${e.message}`));
                }
            });
            resp.on('error', reject);
        }).on('error', reject);

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout - Open-Meteo API not responding'));
        });
    });
}

// Helper: Decode WMO weather codes
function decodeWeatherCode(code) {
    const codes = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        71: 'Slight snow',
        73: 'Moderate snow',
        75: 'Heavy snow',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with hail',
        99: 'Thunderstorm with hail'
    };
    return codes[code] || 'Unknown';
}

// Submit encrypted order: { ciphertext, nonce, senderPublicKey, side?, price?, amount? }
app.post('/orders', (req, res) => {
    const { ciphertext, nonce, senderPublicKey, side, price, amount } = req.body;
    if (!ciphertext || !nonce || !senderPublicKey) return res.status(400).json({ error: 'missing fields' });

    const orders = JSON.parse(fs.readFileSync(ORDERS_FILE));
    const id = uuidv4();
    const record = {
        id,
        ciphertext,
        nonce,
        senderPublicKey,
        status: 'queued',
        createdAt: Date.now(),
        // Store order details for demo mode
        side: side,
        price: price,
        amount: amount
    };
    orders.push(record);
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
    res.json({ id });
});

// List orders (for demo only) - returns ciphertexts
app.get('/orders', (req, res) => {
    const orders = JSON.parse(fs.readFileSync(ORDERS_FILE));
    res.json(orders);
});

// List matched trades (settlements) - minimal info only
app.get('/matches', (req, res) => {
    try {
        if (!fs.existsSync(SETTLEMENTS_FILE)) {
            fs.writeFileSync(SETTLEMENTS_FILE, JSON.stringify([]));
        }
        const settlements = JSON.parse(fs.readFileSync(SETTLEMENTS_FILE, 'utf8'));
        // Return only IDs and timestamps - no terms, no buyer/seller info
        const minimal = settlements.map(s => ({
            id: s.id,
            timestamp: s.timestamp
        }));
        res.json(minimal);
    } catch (e) {
        console.error('Error reading settlements:', e);
        res.json([]);
    }
});

// Reset settlements (for demo fresh start)
app.post('/reset', (req, res) => {
    try {
        fs.writeFileSync(SETTLEMENTS_FILE, JSON.stringify([]));
        res.json({ success: true });
    } catch (e) {
        console.error('Error resetting settlements:', e);
        res.status(500).json({ error: 'Reset failed' });
    }
});

// ── REST API Endpoints for React Frontend ──────────────────

// GET /api/balance/:walletAddress - Return USDC + SOL balances
app.get('/api/balance/:walletAddress', async (req, res) => {
    const { walletAddress } = req.params;
    let pubkey;
    try { pubkey = new PublicKey(walletAddress); } catch {
        return res.status(400).json({ error: 'Invalid wallet address' });
    }
    try {
        const connection = getSolanaConnection();
        const lamports = await connection.getBalance(pubkey);
        const sol = lamports / LAMPORTS_PER_SOL;
        let usdc = 0;
        try {
            const mintPubkey = new PublicKey(USDC_DEVNET_MINT);
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(pubkey, { mint: mintPubkey });
            if (tokenAccounts.value.length > 0) {
                const info = tokenAccounts.value[0].account.data.parsed.info.tokenAmount;
                usdc = parseFloat(info.uiAmountString || '0');
            }
        } catch (_) { /* no USDC account yet */ }
        res.json({ sol: parseFloat(sol.toFixed(4)), usdc: parseFloat(usdc.toFixed(2)) });
    } catch (e) {
        console.error('[Balance] Error:', e.message);
        res.status(500).json({ error: 'Failed to fetch balance', details: e.message });
    }
});

// POST /api/faucet - Send $10 USDC from treasury to a new user (one-time per wallet)
app.post('/api/faucet', async (req, res) => {
    const { walletAddress } = req.body;
    if (!walletAddress) return res.status(400).json({ error: 'Missing walletAddress' });
    let recipient;
    try { recipient = new PublicKey(walletAddress); } catch {
        return res.status(400).json({ error: 'Invalid wallet address' });
    }
    const fauceted = JSON.parse(fs.readFileSync(FAUCET_FILE, 'utf-8'));
    if (fauceted.includes(walletAddress)) {
        return res.status(409).json({ error: 'Faucet already used for this wallet' });
    }
    if (!treasuryKeypair) return res.status(503).json({ error: 'Treasury not initialized' });
    try {
        const connection = getSolanaConnection();
        const mintPubkey = new PublicKey(USDC_DEVNET_MINT);
        const faucetAmount = BigInt(10 * Math.pow(10, USDC_DECIMALS));
        const fromATA = await getOrCreateAssociatedTokenAccount(connection, treasuryKeypair, mintPubkey, treasuryKeypair.publicKey);
        const toATA = await getOrCreateAssociatedTokenAccount(connection, treasuryKeypair, mintPubkey, recipient);
        const transferIx = createTransferCheckedInstruction(
            fromATA.address, mintPubkey, toATA.address,
            treasuryKeypair.publicKey, faucetAmount, USDC_DECIMALS
        );
        const tx = new Transaction().add(transferIx);
        const sig = await sendAndConfirmTransaction(connection, tx, [treasuryKeypair]);
        fauceted.push(walletAddress);
        fs.writeFileSync(FAUCET_FILE, JSON.stringify(fauceted, null, 2));
        console.log(`[Faucet] $10 USDC -> ${walletAddress}: ${sig}`);
        res.json({ success: true, transaction_id: sig, amount: 10, solana_explorer_url: `https://explorer.solana.com/tx/${sig}?cluster=devnet` });
    } catch (e) {
        console.error('[Faucet] Error:', e.message);
        res.status(500).json({ error: 'Faucet transfer failed', details: e.message });
    }
});

// POST /api/policies - Create a new policy
app.post('/api/policies', async (req, res) => {
    const { city, threshold, payout, walletAddress, weather_type, trigger_direction, coverage_days, lat, lon } = req.body;

    if (!city || threshold === undefined || payout === undefined) {
        return res.status(400).json({ error: 'Missing city, threshold, or payout' });
    }

    // wallet address is optional but strongly recommended for real payouts
    if (walletAddress) {
        try {
            new PublicKey(walletAddress); // validate it's a valid Solana pubkey
        } catch {
            return res.status(400).json({ error: 'Invalid Solana wallet address' });
        }
    }

    try {
        let latitude, longitude, location;

        if (lat !== undefined && lon !== undefined) {
            latitude = parseFloat(lat);
            longitude = parseFloat(lon);
            location = city.trim();
        } else {
            const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.trim())}&count=1&language=en&format=json`;
            const geoData = await fetchJson(geoUrl);
            if (!geoData.results || geoData.results.length === 0) {
                return res.status(400).json({ error: `City "${city}" not found. Please check the spelling and try again.` });
            }
            const r = geoData.results[0];
            latitude = r.latitude;
            longitude = r.longitude;
            location = (r.admin1 && r.admin1 !== r.name) ? `${r.name}, ${r.admin1}, ${r.country}` : `${r.name}, ${r.country}`;
        }

        const policy = {
            id: 'POL-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
            city: city.trim(),
            location,
            latitude,
            longitude,
            threshold: parseFloat(threshold),
            payout: parseFloat(payout),
            weather_type: weather_type || 'rainfall',
            trigger_direction: trigger_direction || 'above',
            coverage_days: parseInt(coverage_days) || 1,
            walletAddress: walletAddress || null,
            created_at: new Date().toISOString()
        };

        const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
        orders.push(policy);
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
        res.status(201).json(policy);
    } catch (e) {
        console.error('Error creating policy:', e);
        res.status(500).json({ error: 'Failed to create policy' });
    }
});

// GET /api/weather/{policy_id} - Check weather for a policy & determine if triggered
app.get('/api/weather/:policy_id', async (req, res) => {
    const { policy_id } = req.params;

    try {
        // Load policy from orders.json
        const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
        const policy = orders.find(o => o.id === policy_id);

        if (!policy) {
            return res.status(404).json({ error: 'Policy not found' });
        }

        // Use cached coordinates if available (stored at policy creation time)
        let latitude, longitude, locationName;
        if (policy.latitude && policy.longitude && policy.location) {
            latitude = policy.latitude;
            longitude = policy.longitude;
            locationName = policy.location;
        } else {
            // Fallback: geocode for old policies that pre-date the coord cache
            const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(policy.city.trim())}&count=1&language=en&format=json`;
            const geoData = await fetchJson(geoUrl);

            if (!geoData.results || geoData.results.length === 0) {
                return res.status(404).json({ error: `City "${policy.city}" not found. Try a different spelling.` });
            }

            ({ latitude, longitude } = geoData.results[0]);
            const r = geoData.results[0];
            locationName = (r.admin1 && r.admin1 !== r.name)
                ? `${r.name}, ${r.admin1}, ${r.country}`
                : `${r.name}, ${r.country}`;
        }

        // Build Open-Meteo URL based on weather_type and coverage_days
        const wType = policy.weather_type || 'rainfall';
        const tDir = policy.trigger_direction || 'above';
        const days = Math.max(1, Math.min(7, parseInt(policy.coverage_days) || 1));

        let dailyField;
        if (wType === 'temperature') {
            dailyField = tDir === 'below' ? 'temperature_2m_min' : 'temperature_2m_max';
        } else if (wType === 'wind') {
            dailyField = 'windspeed_10m_max';
        } else {
            dailyField = 'precipitation_sum'; // rainfall
        }

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&daily=${dailyField}&timezone=auto&forecast_days=${days}`;
        const weatherData = await fetchJson(weatherUrl);
        const current = weatherData.current;

        // Aggregate daily values: sum for rainfall, max for temperature/wind
        const dailyValues = (weatherData.daily && weatherData.daily[dailyField]) ? weatherData.daily[dailyField].filter(v => v != null) : [0];
        let metricValue;
        if (wType === 'rainfall') {
            metricValue = dailyValues.reduce((a, b) => a + b, 0); // sum mm over period
        } else {
            metricValue = Math.max(...dailyValues); // worst-case peak
        }
        metricValue = Math.round(metricValue * 10) / 10;

        const condition = decodeWeatherCode(current.weather_code);
        const triggered = tDir === 'below'
            ? metricValue <= policy.threshold
            : metricValue >= policy.threshold;

        // Build unit label for display
        const unitLabel = wType === 'rainfall' ? 'mm' : wType === 'temperature' ? '°C' : 'km/h';

        res.json({
            location: locationName,
            rainfall: metricValue,   // kept as "rainfall" key for frontend compat
            threshold: policy.threshold,
            condition: condition,
            temperature: `${Math.round(current.temperature_2m)}°C`,
            triggered,
            weather_type: wType,
            trigger_direction: tDir,
            coverage_days: days,
            unit: unitLabel
        });
    } catch (e) {
        console.error('[Weather API] Error:', e.message);
        res.status(500).json({ error: 'Failed to check weather', details: e.message });
    }
});

// POST /api/payouts - Process a payout (real USDC on Solana devnet, simulated fallback)
app.post('/api/payouts', async (req, res) => {
    const { policy_id } = req.body;

    if (!policy_id) {
        return res.status(400).json({ error: 'Missing policy_id' });
    }

    try {
        const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
        const policy = orders.find(o => o.id === policy_id);

        if (!policy) {
            return res.status(404).json({ error: 'Policy not found' });
        }

        // ── Try real on-chain USDC transfer ────────────────────────────
        if (policy.walletAddress && treasuryKeypair) {
            try {
                const connection = getSolanaConnection();
                const recipient = new PublicKey(policy.walletAddress);
                const mintPubkey = new PublicKey(USDC_DEVNET_MINT);
                // USDC has 6 decimal places
                const transferAmountRaw = BigInt(Math.round(policy.payout * Math.pow(10, USDC_DECIMALS)));

                // Get (or create) token accounts for treasury and recipient
                const fromATA = await getOrCreateAssociatedTokenAccount(
                    connection, treasuryKeypair, mintPubkey, treasuryKeypair.publicKey
                );
                const toATA = await getOrCreateAssociatedTokenAccount(
                    connection, treasuryKeypair, mintPubkey, recipient
                );

                const transferIx = createTransferCheckedInstruction(
                    fromATA.address,
                    mintPubkey,
                    toATA.address,
                    treasuryKeypair.publicKey,
                    transferAmountRaw,
                    USDC_DECIMALS
                );

                const tx = new Transaction().add(transferIx);
                const sig = await sendAndConfirmTransaction(connection, tx, [treasuryKeypair]);

                console.log(`[Payout] On-chain USDC transfer: ${sig}`);

                const settlements = JSON.parse(fs.readFileSync(SETTLEMENTS_FILE, 'utf-8'));
                settlements.push({
                    id: 'TXN-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
                    policy_id,
                    signature: sig,
                    amount: policy.payout,
                    recipient: policy.walletAddress,
                    status: 'confirmed',
                    timestamp: new Date().toISOString()
                });
                fs.writeFileSync(SETTLEMENTS_FILE, JSON.stringify(settlements, null, 2));

                return res.status(201).json({
                    transaction_id: sig,
                    amount: policy.payout,
                    status: 'confirmed',
                    payout_method: 'USDC (Solana Devnet)',
                    solana_explorer_url: `https://explorer.solana.com/tx/${sig}?cluster=devnet`
                });
            } catch (onChainErr) {
                console.error('[Payout] On-chain transfer failed, falling back to simulated:', onChainErr.message);
                // Fall through to simulated payout below
            }
        }

        // ── Simulated fallback ─────────────────────────────────────────
        // Reaches here when: treasury not funded, no wallet address, or chain error
        const txId = 'SIM-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();
        const statusNote = !policy.walletAddress
            ? 'simulated (no wallet linked \u2014 reconnect with wallet)'
            : !treasuryKeypair
                ? 'simulated (treasury not initialized)'
                : 'simulated (fund treasury with SOL + USDC to enable real payouts)';

        const settlements = JSON.parse(fs.readFileSync(SETTLEMENTS_FILE, 'utf-8'));
        settlements.push({
            id: txId,
            policy_id,
            transaction_id: txId,
            amount: policy.payout,
            recipient: policy.walletAddress || 'N/A',
            status: statusNote,
            timestamp: new Date().toISOString()
        });
        fs.writeFileSync(SETTLEMENTS_FILE, JSON.stringify(settlements, null, 2));

        res.status(201).json({
            transaction_id: txId,
            amount: policy.payout,
            status: statusNote,
            payout_method: 'USDC (Solana Devnet)',
            solana_explorer_url: null
        });
    } catch (e) {
        console.error('Payout processing error:', e);
        res.status(500).json({ error: 'Payout failed', details: e.message });
    }
});

// ── Payout Endpoint (Legacy) ────────────────────────────────
app.post('/payout', async (req, res) => {
    const { userEmail, userId, paymentMethod, amount, city, threshold, rainfall } = req.body;

    if (!userEmail || !amount || amount <= 0) {
        return res.status(400).json({ error: 'Missing or invalid email/amount' });
    }

    try {
        const methodMap = {
            'bank': `Bank Account (****${Math.random().toString().slice(2, 6)})`,
            'paypal': 'PayPal',
            'bitcoin': `Bitcoin Wallet (${Math.random().toString(36).slice(2, 12)}...)`,
            'usdc': 'USDC Stablecoin (Polygon)'
        };

        const selectedMethod = methodMap[paymentMethod] || methodMap['bank'];
        const transactionId = 'TXN-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();

        res.json({
            success: true,
            transactionId: transactionId,
            payoutMethod: selectedMethod,
            amount: amount,
            userEmail: userEmail,
            message: `$${amount} USD payout processed to ${selectedMethod}`,
            details: {
                city: city,
                threshold: threshold,
                rainfall: rainfall,
                condition: rainfall >= threshold ? 'TRIGGERED' : 'NOT_MET',
                timestamp: new Date().toISOString()
            }
        });
    } catch (e) {
        console.error('Payout error:', e);
        res.status(500).json({ error: 'Payout failed', details: e.message });
    }
});

// Serve static files AFTER API routes
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
