// ============================================================
//  PayOnRain — Frontend Logic
//
//  In a real Rialo app this file would talk to the chain via
//  the Rialo JS SDK.  For this DevNet demo we simulate the
//  on-chain part so the presentation works even offline.
// ============================================================

// ── Global state ─────────────────────────────────────────────
let policy = null;       // set in setupPolicy()
let txCount = 1000;       // fake block counter for demo
let connectedWallet = null;    // set in connectWallet()
let currentBlock = 8_412_047;  // realistic Rialo DevNet block number

// ── Initialization: Run after DOM is fully ready ─────────────
function initializeApp() {
    // Initialize block counter
    const blockEl = document.getElementById('block-num');
    if (blockEl) {
        blockEl.textContent = currentBlock.toLocaleString();
        setInterval(() => {
            currentBlock += Math.random() < 0.7 ? 1 : 0;
            blockEl.textContent = currentBlock.toLocaleString();
        }, 3500);
    }

    // Auto-connect wallet
    const walletBtn = document.getElementById('walletBtn');
    if (walletBtn && !connectedWallet) {
        connectWallet();
    }
}

// Run initialization after DOM is completely ready
document.addEventListener('DOMContentLoaded', initializeApp);

// ── Connect Wallet (simulated — no real wallet on DevNet) ─────
function connectWallet() {
    const btn = document.getElementById('walletBtn');
    const display = document.getElementById('wallet-display');
    if (connectedWallet) return; // already connected

    // Generate wallet address immediately (SOL-style base58)
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let addr = '';
    for (let i = 0; i < 44; i++) {
        addr += chars[Math.floor(Math.random() * chars.length)];
    }
    connectedWallet = addr;

    // Show SOL address format in the span
    if (display) {
        display.textContent = `✓ ${addr.slice(0, 5)}…${addr.slice(-4)}`;
    }
    btn.classList.add('connected');
    btn.disabled = true; // disable after connecting
}

// ── Utility helpers ───────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function fakeTxHash() {
    const hex = () => Math.floor(Math.random() * 16).toString(16);
    return '0x' + Array.from({ length: 64 }, hex).join('');
}

function fakeWallet(seed) {
    // Deterministic-looking wallet from the city name
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let out = '';
    for (let i = 0; i < 44; i++) {
        out += chars[(seed.charCodeAt(i % seed.length) + i * 7) % chars.length];
    }
    return out;
}

function setLoading(btnId, loading, defaultText) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    btn.innerHTML = loading
        ? '<span class="spin">⟳</span> Processing…'
        : defaultText;
}

// ── STEP 1: Setup Policy ──────────────────────────────────────
async function setupPolicy() {
    const city = document.getElementById('city').value.trim();
    const threshold = parseFloat(document.getElementById('threshold').value);
    const payout = parseInt(document.getElementById('payout').value);

    // Basic validation
    if (!city) return alert('Please enter a city name.');
    if (isNaN(threshold) || threshold < 0.1) return alert('Rain threshold must be at least 0.1 mm.');
    if (isNaN(payout) || payout < 1) return alert('Enter a valid payout amount.');
    if (payout > 200) return alert('Payout must be at most 200 RALO tokens.');

    // Disable button and show loading state
    const btn = document.querySelector('#step1 .btn-primary');
    btn.disabled = true;
    btn.innerHTML = '<span class="spin">⟳</span> Deploying contract…';

    // Simulate on-chain deployment delay
    await sleep(1800);

    // Save policy
    policy = { city, threshold, payout, wallet: fakeWallet(city) };

    // Show confirmation
    const out = document.getElementById('step1-output');
    out.style.display = 'block';
    out.innerHTML = `
        <strong>Policy created on Rialo DevNet</strong><br/>
        Location : <strong>${city}</strong><br/>
        Threshold : <strong>${threshold.toFixed ? threshold.toFixed(1) : threshold} mm rainfall</strong><br/>
        Payout : <strong>${payout} DEMO RALO tokens</strong><br/>
        User : <code style="font-size:0.75rem">${policy.wallet.slice(0, 12)}…</code><br/>
        Tx (setup) : <code style="font-size:0.75rem">${fakeTxHash().slice(0, 18)}…</code>
    `;

    btn.innerHTML = 'Policy Created';

    // Unlock step 2
    document.getElementById('step2').classList.remove('locked');
    document.getElementById('step2').classList.add('unlocked');
    document.getElementById('checkBtn').disabled = false;
}

// ── STEP 2: Check weather & evaluate ─────────────────────────
async function checkWeather() {
    if (!policy) return;

    const btn = document.getElementById('checkBtn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spin">⟳</span> Contract calling weather API…';

    // ── Real HTTP call to PayOnRain backend service ───────────────\n    //    Backend handles all weather API calls securely.
    //    This mirrors exactly what the Rialo contract does on-chain:
    //      HttpRequest::new(Method::GET, &url).send().await
    const url = `https://api.payonrain.io/weather?location=${encodeURIComponent(policy.city)}`;

    let weatherData;
    let apiWorked = true;
    try {
        const resp = await fetch(url);
        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(err.message || `HTTP ${resp.status}`);
        }
        weatherData = await resp.json();
        // Debug: log full API response for inspection
        console.log('OpenWeatherMap /weather response:', weatherData);
        const dbg = document.getElementById('debug-json');
        if (dbg) {
            dbg.style.display = 'block';
            try { dbg.textContent = 'Primary /weather response:\n' + JSON.stringify(weatherData, null, 2); } catch (e) { dbg.textContent = String(weatherData); }
        }
    } catch (e) {
        // API key not active yet (new keys take up to 2 hours) — fall through
        // to demo/simulate mode automatically so the presentation still works.
        apiWorked = false;
        weatherData = null;
    }

    // Fallback: If API call failed, enable demo mode
    if (!apiWorked) {
        // Hide debug panel when API failed
        const dbg = document.getElementById('debug-json'); if (dbg) dbg.style.display = 'none';
        await sleep(1000);
        btn.innerHTML = 'Weather Checked (Demo Mode)';

        // Unlock step 3
        document.getElementById('step3').classList.remove('locked');
        document.getElementById('step3').classList.add('unlocked');

        const statusEl = document.getElementById('payout-status');
        const iconEl = document.getElementById('payout-icon');
        const msgEl = document.getElementById('payout-message');
        const detailEl = document.getElementById('payout-detail');

        statusEl.className = 'payout-status';  // neutral — no condition was checked
        iconEl.textContent = '';
        msgEl.textContent = 'Backend Service Initializing — Demo Mode Ready';
        detailEl.textContent = 'Weather service is warming up. Use the button below to run a simulated demo.';

        const forceBtn = document.createElement('button');
        forceBtn.className = 'btn-primary';
        forceBtn.style.marginTop = '20px';
        forceBtn.style.background = '#6ee7b7';
        forceBtn.style.color = '#0d0f14';
        forceBtn.textContent = 'Simulate Rain Trigger — Show Full Demo';
        forceBtn.onclick = () => simulateTrigger(0);
        statusEl.appendChild(forceBtn);
        return;
    }

    // Parse rainfall from backend response
    let rainfallMm = weatherData?.rainfall_mm ?? weatherData?.rain?.['1h'] ?? null;
    console.warn('OneCall fallback failed', e);
}
    }

// If still null, treat as 0.0
if (rainfallMm == null) rainfallMm = 0.0;
const conditionStr = weatherData?.weather?.[0]?.description ?? 'clear';
const tempC = weatherData?.main?.temp ?? '—';

// Update weather box
const box = document.getElementById('weather-box');
box.style.display = 'block';

document.getElementById('w-city').textContent = `${policy.city}`;
document.getElementById('w-rain').textContent = `${rainfallMm.toFixed(1)} mm`;
document.getElementById('w-threshold').textContent = `${policy.threshold} mm`;
document.getElementById('w-condition').textContent = conditionStr;
document.getElementById('w-temp').textContent = `${tempC} °C`;

// Colour the rainfall value
const rainEl = document.getElementById('w-rain');
rainEl.style.color = rainfallMm >= policy.threshold ? '#6ee7b7' : '#f87171';

// Simulate contract evaluation delay (makes demo feel real)
await sleep(1200);

btn.innerHTML = 'Weather Checked';

// Unlock step 3
document.getElementById('step3').classList.remove('locked');
document.getElementById('step3').classList.add('unlocked');

// ── Evaluate condition & show result ─────────────────────
const statusEl = document.getElementById('payout-status');
const iconEl = document.getElementById('payout-icon');
const msgEl = document.getElementById('payout-message');
const detailEl = document.getElementById('payout-detail');
const txBox = document.getElementById('tx-box');

if (rainfallMm >= policy.threshold) {
    // ── TRIGGERED: show payout ─────────────────────────────
    await sleep(600);

    statusEl.className = 'payout-status triggered';
    iconEl.textContent = '';
    msgEl.textContent = `Payout Sent — ${policy.payout} DEMO RALO`;
    detailEl.textContent = `Rainfall (${rainfallMm.toFixed(1)} mm) exceeded threshold (${policy.threshold} mm). Contract auto-transferred funds.`;

    // Fake but realistic transaction details
    const hash1 = fakeTxHash();
    const company1 = connectedWallet || policy.wallet;
    txBox.style.display = 'block';
    document.getElementById('tx-hash').textContent = hash1;
    document.getElementById('tx-farmer').textContent = company1;
    document.getElementById('tx-amount').textContent = `${policy.payout} DEMO RALO`;
    document.getElementById('tx-block').textContent = `#${currentBlock.toLocaleString()}`;
    document.getElementById('tx-fee').textContent = `0.000021 DEMO RALO`;
    document.getElementById('tx-explorer').href = `https://explorer.rialo.io/tx/${hash1}`;

} else {
    // ── NOT TRIGGERED ──────────────────────────────────────
    statusEl.className = 'payout-status not-met';
    iconEl.textContent = '';
    msgEl.textContent = 'Condition Not Met — No Payout';
    detailEl.textContent = `Rainfall (${rainfallMm.toFixed(1)} mm) is below the ${policy.threshold} mm threshold. Funds stay in the contract vault.`;

    // ── Demo tip: let presenter force-trigger for a live wow moment ──
    const sep = document.createElement('p');
    sep.style.cssText = 'font-size:0.75rem;color:#7c8aa0;margin-top:20px;margin-bottom:6px;';
    sep.textContent = 'Presentation override — does not reflect the contract result above:';
    statusEl.appendChild(sep);

    const forceBtn = document.createElement('button');
    forceBtn.className = 'btn-primary';
    forceBtn.style.background = '#2a3045';
    forceBtn.style.color = '#7c8aa0';
    forceBtn.style.border = '1px solid #3a4055';
    forceBtn.textContent = 'Force Demo Payout (presentation only)';
    forceBtn.onclick = () => simulateTrigger(rainfallMm);
    statusEl.appendChild(forceBtn);
}
}

// ── Demo helper: force-trigger for dry-weather presentations ──
async function simulateTrigger(actualRain) {
    const statusEl = document.getElementById('payout-status');
    const iconEl = document.getElementById('payout-icon');
    const msgEl = document.getElementById('payout-message');
    const detailEl = document.getElementById('payout-detail');
    const txBox = document.getElementById('tx-box');

    // Remove the simulate button
    const btn = statusEl.querySelector('button');
    if (btn) btn.remove();

    iconEl.textContent = '<span class="spin">⟳</span>';
    msgEl.textContent = 'Simulating threshold breach…';
    detailEl.textContent = '';

    await sleep(1200);

    const fakeRain = policy.threshold + 5 + Math.floor(Math.random() * 20);

    statusEl.className = 'payout-status triggered';
    iconEl.textContent = '';
    msgEl.textContent = `Payout Sent — ${policy.payout} DEMO RALO`;
    detailEl.innerHTML = `<em>[Demo mode]</em> Simulated rainfall: ${fakeRain} mm &gt; threshold ${policy.threshold} mm.<br/>Contract auto-transferred funds.`;

    const hash2 = fakeTxHash();
    const company2 = connectedWallet || policy.wallet;
    txBox.style.display = 'block';
    document.getElementById('tx-hash').textContent = hash2;
    document.getElementById('tx-farmer').textContent = company2;
    document.getElementById('tx-amount').textContent = `${policy.payout} DEMO RALO`;
    document.getElementById('tx-block').textContent = `#${currentBlock.toLocaleString()}`;
    document.getElementById('tx-fee').textContent = `0.000021 DEMO RALO`;
    document.getElementById('tx-explorer').href = `https://explorer.rialo.io/tx/${hash2}`;
}
