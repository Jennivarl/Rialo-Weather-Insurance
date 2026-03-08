const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(process.cwd(), 'db');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

function loadOrders() {
    if (!fs.existsSync(ORDERS_FILE)) {
        fs.writeFileSync(ORDERS_FILE, JSON.stringify([]));
    }
    return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
}

function saveOrders(orders) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
}

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { city, threshold, payout } = req.body;

    if (!city || threshold === undefined || payout === undefined) {
        return res.status(400).json({ error: 'Missing city, threshold, or payout' });
    }

    try {
        const policy = {
            id: 'POL-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
            city,
            threshold: parseFloat(threshold),
            payout: parseFloat(payout),
            created_at: new Date().toISOString()
        };

        const orders = loadOrders();
        orders.push(policy);
        saveOrders(orders);

        res.status(201).json(policy);
    } catch (e) {
        console.error('Error creating policy:', e);
        res.status(500).json({ error: 'Failed to create policy' });
    }
}
