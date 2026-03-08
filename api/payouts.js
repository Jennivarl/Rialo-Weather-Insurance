const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(process.cwd(), 'db');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const SETTLEMENTS_FILE = path.join(DATA_DIR, 'settlements.json');

function loadOrders() {
    if (!fs.existsSync(ORDERS_FILE)) {
        fs.writeFileSync(ORDERS_FILE, JSON.stringify([]));
    }
    return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
}

function loadSettlements() {
    if (!fs.existsSync(SETTLEMENTS_FILE)) {
        fs.writeFileSync(SETTLEMENTS_FILE, JSON.stringify([]));
    }
    return JSON.parse(fs.readFileSync(SETTLEMENTS_FILE, 'utf-8'));
}

function saveSettlements(settlements) {
    fs.writeFileSync(SETTLEMENTS_FILE, JSON.stringify(settlements, null, 2));
}

module.exports = function handler(req, res) {
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

    const { policy_id, payout_method } = req.body;

    if (!policy_id || !payout_method) {
        return res.status(400).json({ error: 'Missing policy_id or payout_method' });
    }

    try {
        const orders = loadOrders();
        const policy = orders.find(o => o.id === policy_id);

        if (!policy) {
            return res.status(404).json({ error: 'Policy not found' });
        }

        const methodLabels = {
            'bank': 'Bank Account',
            'paypal': 'PayPal',
            'bitcoin': 'Bitcoin',
            'usdc': 'USDC'
        };

        const transaction = {
            id: 'TXN-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
            policy_id: policy_id,
            transaction_id: 'TXN-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
            amount: policy.payout,
            status: 'completed',
            payout_method: methodLabels[payout_method] || payout_method,
            timestamp: new Date().toISOString()
        };

        const settlements = loadSettlements();
        settlements.push(transaction);
        saveSettlements(settlements);

        res.status(201).json(transaction);
    } catch (e) {
        console.error('Error processing payout:', e);
        res.status(500).json({ error: 'Failed to process payout' });
    }
}
