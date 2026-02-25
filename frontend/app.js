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
document.addEventListener('DOMContentLoaded', function () {
    // Show block counter
    const blockEl = document.getElementById('block-num');
    if (blockEl) {
        blockEl.textContent = currentBlock.toLocaleString();
        setInterval(() => {
            currentBlock += Math.random() < 0.7 ? 1 : 0;
            blockEl.textContent = currentBlock.toLocaleString();
        }, 3500);
    }

    // Auto-connect wallet immediately
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let addr = '';
    for (let i = 0; i < 44; i++) {
        addr += chars[Math.floor(Math.random() * chars.length)];
    }
    connectedWallet = addr;

    const display = document.getElementById('wallet-display');
    if (display) {
        display.textContent = '✓ ' + addr.slice(0, 5) + '…' + addr.slice(-4);
    }
});

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

    const url = `https://api.payonrain.io/weather?location=${encodeURIComponent(policy.city)}`;
    let weatherData = null;
    let apiWorked = false;

    try {
        const resp = await fetch(url);
        if (resp.ok) {
            weatherData = await resp.json();
            apiWorked = true;
        }
    } catch (e) {
        apiWorked = false;
    }

    if (!apiWorked) {
        await sleep(1000);
        btn.innerHTML = 'Weather Checked (Demo Mode)';
        document.getElementById('step3').classList.remove('locked');
        document.getElementById('step3').classList.add('unlocked');

        const statusEl = document.getElementById('payout-status');
        statusEl.textContent = 'Backend service initializing. Click below for demo.';

        const demoBtn = document.createElement('button');
        demoBtn.className = 'btn-primary';
        demoBtn.style.marginTop = '20px';
        demoBtn.textContent = 'Simulate Payout';
        demoBtn.onclick = () => simulateTrigger(0);
        statusEl.appendChild(demoBtn);
        return;
    }

    const rainfallMm = weatherData?.rainfall_mm ?? 0;
    const tempC = weatherData?.temp ?? '—';
    const conditionStr = weatherData?.condition ?? 'clear';

    const box = document.getElementById('weather-box');
    box.style.display = 'block';
    document.getElementById('w-city').textContent = policy.city;
    document.getElementById('w-rain').textContent = rainfallMm.toFixed(1) + ' mm';
    document.getElementById('w-threshold').textContent = policy.threshold + ' mm';
    document.getElementById('w-condition').textContent = conditionStr;
    document.getElementById('w-temp').textContent = tempC + ' °C';

    const rainEl = document.getElementById('w-rain');
    rainEl.style.color = rainfallMm >= policy.threshold ? '#6ee7b7' : '#f87171';

    await sleep(1200);
    btn.innerHTML = 'Weather Checked';

    document.getElementById('step3').classList.remove('locked');
    document.getElementById('step3').classList.add('unlocked');

    const statusEl = document.getElementById('payout-status');
    const msgEl = document.getElementById('payout-message');
    const detailEl = document.getElementById('payout-detail');
    const txBox = document.getElementById('tx-box');

    if (rainfallMm >= policy.threshold) {
        statusEl.className = 'payout-status triggered';
        msgEl.textContent = `Payout Sent — ${policy.payout} DEMO RALO`;
        detailEl.textContent = `Rainfall (${rainfallMm.toFixed(1)} mm) exceeded threshold. Funds transferred.`;

        txBox.style.display = 'block';
        document.getElementById('tx-hash').textContent = fakeTxHash();
        document.getElementById('tx-farmer').textContent = connectedWallet || policy.wallet;
        document.getElementById('tx-amount').textContent = `${policy.payout} DEMO RALO`;
        document.getElementById('tx-block').textContent = `#${currentBlock.toLocaleString()}`;
        document.getElementById('tx-fee').textContent = '0.000021 DEMO RALO';
    } else {
        statusEl.className = 'payout-status not-met';
        msgEl.textContent = 'Condition Not Met — No Payout';
        detailEl.textContent = `Rainfall (${rainfallMm.toFixed(1)} mm) below threshold (${policy.threshold} mm).`;
    }
}

// ── Demo helper: simulate payout ────────────────────────────
async function simulateTrigger(actualRain) {
    const statusEl = document.getElementById('payout-status');
    const btn = statusEl.querySelector('button');
    if (btn) btn.remove();

    statusEl.textContent = 'Simulating threshold breach...';

    await sleep(1200);

    const fakeRain = policy.threshold + 5 + Math.floor(Math.random() * 20);

    statusEl.innerHTML = '';
    statusEl.className = 'payout-status triggered';

    const msgEl = document.getElementById('payout-message');
    const detailEl = document.getElementById('payout-detail');
    msgEl.textContent = `Payout Sent — ${policy.payout} DEMO RALO`;
    detailEl.textContent = '[Demo] Simulated rainfall: ' + fakeRain + ' mm > threshold ' + policy.threshold + ' mm.';

    const txBox = document.getElementById('tx-box');
    txBox.style.display = 'block';
    document.getElementById('tx-hash').textContent = fakeTxHash();
    document.getElementById('tx-farmer').textContent = connectedWallet || policy.wallet;
    document.getElementById('tx-amount').textContent = `${policy.payout} DEMO RALO`;
    document.getElementById('tx-block').textContent = `#${currentBlock.toLocaleString()}`;
    document.getElementById('tx-fee').textContent = '0.000021 DEMO RALO';
}
