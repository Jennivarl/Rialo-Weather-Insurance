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

// ── Live block counter (ticks up every ~3.5 seconds) ─────────
function startBlockCounter() {
    const el = document.getElementById('block-num');
    if (!el) return;
    el.textContent = currentBlock.toLocaleString();
    setInterval(() => {
        currentBlock += Math.random() < 0.7 ? 1 : 0; // occasional skip = realistic
        el.textContent = currentBlock.toLocaleString();
    }, 3500);
}
startBlockCounter();

// ── Connect Wallet (simulated — no real wallet on DevNet) ─────
function connectWallet() {
    const btn = document.getElementById('walletBtn');
    if (connectedWallet) return; // already connected

    btn.textContent = '⟳ Connecting…';
    btn.disabled = true;

    // Simulate wallet handshake delay
    setTimeout(() => {
        // Generate a realistic-looking Rialo wallet address
        const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        let addr = '';
        for (let i = 0; i < 44; i++) {
            addr += chars[Math.floor(Math.random() * chars.length)];
        }
        connectedWallet = addr;

        // Show shortened address on button
        btn.textContent = `${addr.slice(0, 4)}…${addr.slice(-4)}`;
        btn.classList.add('connected');
        btn.disabled = false;
    }, 900);
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
    const apiKey = document.getElementById('apiKey').value.trim();

    // Basic validation
    if (!city) return alert('Please enter a city name.');
    if (!apiKey) return alert('Please enter your OpenWeatherMap API key.\n\nGet a free one at: openweathermap.org/api');
    if (isNaN(threshold) || threshold < 0.1) return alert('Rain threshold must be at least 0.1 mm.');
    if (isNaN(payout) || payout < 1) return alert('Enter a valid payout amount.');
    if (payout > 200) return alert('Payout must be at most 200 RALO tokens.');

    setLoading(null, true, null);
    const btn = document.querySelector('#step1 .btn-primary');
    btn.disabled = true;
    btn.innerHTML = '<span class="spin">⟳</span> Deploying contract…';

    // Simulate on-chain deployment delay
    await sleep(1800);

    // Save policy
    policy = { city, threshold, payout, apiKey, wallet: fakeWallet(city) };

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

    // ── Real HTTP call to OpenWeatherMap ──────────────────────
    //    This mirrors exactly what the Rialo contract does on-chain.
    //    In the browser we call it directly; in the contract it's:
    //      HttpRequest::new(Method::GET, &url).send().await
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(policy.city)}&appid=${policy.apiKey}&units=metric`;

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

    // If API key not yet active, go straight to demo/simulate mode
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
        msgEl.textContent = 'API Key Activating — Demo Mode Ready';
        detailEl.textContent = 'Live weather check skipped (API key not active yet). Use the button below to run a simulated demo.';

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

    // Parse rainfall (mm in last hour — try primary response, then fallbacks)
    let rainfallMm = null;
    // Primary: current weather `/weather` -> rain['1h']
    rainfallMm = weatherData?.rain?.['1h'];

    // Fallback 1: 3-hour forecast `/forecast` -> list[0].rain['3h'] (if available)
    if (rainfallMm == null) {
        try {
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(policy.city)}&appid=${policy.apiKey}&units=metric`;
            const fResp = await fetch(forecastUrl);
            if (fResp.ok) {
                const fJson = await fResp.json();
                console.log('OpenWeatherMap /forecast response:', fJson);
                const dbg = document.getElementById('debug-json');
                if (dbg) {
                    dbg.textContent += '\n\nFallback /forecast response:\n' + JSON.stringify(fJson, null, 2);
                }
                // Prefer the first interval's rain if present
                const first = fJson?.list?.[0];
                if (first && first.rain) {
                    // forecast uses '3h' key for precipitation amount over 3 hours
                    const r3 = first.rain['3h'];
                    if (r3 != null) {
                        // approximate hourly by dividing by 3
                        rainfallMm = r3 / 3.0;
                    }
                }
            }
        } catch (e) {
            console.warn('Forecast fallback failed', e);
        }
    }

    // Fallback 2: OneCall hourly by coordinates -> hourly[0].rain['1h']
    if (rainfallMm == null && weatherData && weatherData.coord) {
        try {
            const lat = weatherData.coord.lat;
            const lon = weatherData.coord.lon;
            const onecallUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,daily,alerts&appid=${policy.apiKey}&units=metric`;
            const oResp = await fetch(onecallUrl);
            if (oResp.ok) {
                const oJson = await oResp.json();
                console.log('OpenWeatherMap /onecall response:', oJson);
                const dbg = document.getElementById('debug-json');
                if (dbg) {
                    dbg.textContent += '\n\nFallback /onecall response:\n' + JSON.stringify(oJson, null, 2);
                }
                const hr0 = oJson?.hourly?.[0];
                if (hr0 && hr0.rain) {
                    rainfallMm = hr0.rain['1h'] ?? hr0.rain;
                }
            }
        } catch (e) {
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
