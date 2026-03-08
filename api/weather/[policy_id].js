const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_DIR = path.join(process.cwd(), 'db');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

function loadOrders() {
    if (!fs.existsSync(ORDERS_FILE)) {
        fs.writeFileSync(ORDERS_FILE, JSON.stringify([]));
    }
    return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
}

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { timeout: 5000 }, (resp) => {
            let data = '';
            resp.on('data', chunk => { data += chunk; });
            resp.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

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

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { policy_id } = req.query;

    try {
        const orders = loadOrders();
        const policy = orders.find(o => o.id === policy_id);

        if (!policy) {
            return res.status(404).json({ error: 'Policy not found' });
        }

        // Geocode and fetch weather
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(policy.city)}&count=1&language=en&format=json`;
        const geoData = await fetchJson(geoUrl);

        if (!geoData.results || geoData.results.length === 0) {
            return res.status(404).json({ error: `Location "${policy.city}" not found` });
        }

        const { latitude, longitude, name, country } = geoData.results[0];

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,rain,precipitation&timezone=auto`;
        const weatherData = await fetchJson(weatherUrl);
        const current = weatherData.current;

        const condition = decodeWeatherCode(current.weather_code);
        const rainfall = current.precipitation || 0;
        const triggered = rainfall >= policy.threshold;

        res.json({
            location: `${name}, ${country}`,
            rainfall: rainfall,
            threshold: policy.threshold,
            condition: condition,
            temperature: `${Math.round(current.temperature_2m)}°C`,
            triggered: triggered
        });
    } catch (e) {
        console.error('Weather check error:', e);
        res.status(500).json({ error: 'Failed to check weather', details: e.message });
    }
}
