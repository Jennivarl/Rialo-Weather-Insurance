const fs = require('fs');
const path = require('path');
const nacl = require('tweetnacl');
nacl.util = require('tweetnacl-util');

const DATA_DIR = path.join(__dirname, 'db');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const SETTLEMENTS_FILE = path.join(DATA_DIR, 'settlements.json');
const BALANCES_FILE = path.join(DATA_DIR, 'balances.json');
const KEYS_FILE = path.join(__dirname, 'keys.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, JSON.stringify([]));
if (!fs.existsSync(SETTLEMENTS_FILE)) fs.writeFileSync(SETTLEMENTS_FILE, JSON.stringify([]));
if (!fs.existsSync(BALANCES_FILE)) fs.writeFileSync(BALANCES_FILE, JSON.stringify({}));

// Load server private key
if (!fs.existsSync(KEYS_FILE)) {
    console.error('keys.json missing. Start server first to generate keys.');
    process.exit(1);
}
const keysRaw = JSON.parse(fs.readFileSync(KEYS_FILE));
const serverSecretKey = nacl.util.decodeBase64(keysRaw.secretKey);

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function processLoop() {
    console.log('Worker started — polling for orders...');
    while (true) {
        try {
            const orders = JSON.parse(fs.readFileSync(ORDERS_FILE));
            let changed = false;
            for (const o of orders) {
                if (o.status !== 'queued') continue;

                // Handle demo mode - just match any opposite side with same price
                if (o.ciphertext === 'demo' && o.nonce === 'demo') {
                    // Look for opposite order with same price
                    const opposite = orders.find(x =>
                        x.status === 'queued' &&
                        x.id !== o.id &&
                        x.side !== o.side &&
                        x.price === o.price
                    );

                    if (opposite) {
                        // Create settlement for demo orders
                        const settlements = JSON.parse(fs.readFileSync(SETTLEMENTS_FILE));
                        const buyOrder = o.side === 'buy' ? { side: o.side, price: o.price, amount: o.amount, senderPublicKey: o.senderPublicKey } : { side: opposite.side, price: opposite.price, amount: opposite.amount, senderPublicKey: opposite.senderPublicKey };
                        const sellOrder = o.side === 'sell' ? { side: o.side, price: o.price, amount: o.amount, senderPublicKey: o.senderPublicKey } : { side: opposite.side, price: opposite.price, amount: opposite.amount, senderPublicKey: opposite.senderPublicKey };

                        const settlement = {
                            id: `${o.id}:${opposite.id}`,
                            buy: buyOrder,
                            sell: sellOrder,
                            price: o.price,
                            amount: Math.min(o.amount, opposite.amount),
                            timestamp: Date.now()
                        };
                        settlements.push(settlement);
                        fs.writeFileSync(SETTLEMENTS_FILE, JSON.stringify(settlements, null, 2));

                        // Mark both as filled
                        o.status = 'filled';
                        opposite.status = 'filled';
                        changed = true;
                        console.log('Demo mode: Matched and settled', settlement.id);
                    }
                    continue;
                }

                // Try decrypting real encrypted orders
                try {
                    const nonce = nacl.util.decodeBase64(o.nonce);
                    const cipher = nacl.util.decodeBase64(o.ciphertext);
                    const senderPub = nacl.util.decodeBase64(o.senderPublicKey);
                    const plain = nacl.box.open(cipher, nonce, senderPub, serverSecretKey);
                    if (!plain) {
                        console.warn('Failed to decrypt order', o.id);
                        o.status = 'bad';
                        changed = true;
                        continue;
                    }
                    const json = JSON.parse(nacl.util.encodeUTF8(plain));
                    console.log('Decrypted order', o.id, json);

                    // Very simple matching: try to find opposite side queued order with same price
                    const opposite = orders.find(x => x.status === 'queued' && x.id !== o.id && (() => {
                        if (x.ciphertext === 'demo') return false; // skip demo orders in matching for now
                        const s = nacl.box.open(nacl.util.decodeBase64(x.ciphertext), nacl.util.decodeBase64(x.nonce), nacl.util.decodeBase64(x.senderPublicKey), serverSecretKey);
                        if (!s) return false;
                        try { const j = JSON.parse(nacl.util.encodeUTF8(s)); return (j.side !== json.side && j.price === json.price); } catch (e) { return false; }
                    })());

                    if (opposite) {
                        // decrypt other
                        const oppPlain = nacl.box.open(nacl.util.decodeBase64(opposite.ciphertext), nacl.util.decodeBase64(opposite.nonce), nacl.util.decodeBase64(opposite.senderPublicKey), serverSecretKey);
                        const oppJson = JSON.parse(nacl.util.encodeUTF8(oppPlain));

                        // create settlement (simple transfer of amounts)
                        const settlements = JSON.parse(fs.readFileSync(SETTLEMENTS_FILE));
                        const buyOrder = json.side === 'buy' ? { ...json, senderPublicKey: o.senderPublicKey } : { ...oppJson, senderPublicKey: opposite.senderPublicKey };
                        const sellOrder = json.side === 'sell' ? { ...json, senderPublicKey: o.senderPublicKey } : { ...oppJson, senderPublicKey: opposite.senderPublicKey };
                        const settlement = {
                            id: `${o.id}:${opposite.id}`,
                            buy: buyOrder,
                            sell: sellOrder,
                            price: json.price,
                            amount: Math.min(json.amount, oppJson.amount),
                            timestamp: Date.now()
                        };
                        settlements.push(settlement);
                        fs.writeFileSync(SETTLEMENTS_FILE, JSON.stringify(settlements, null, 2));

                        // mark both orders as filled
                        o.status = 'filled';
                        opposite.status = 'filled';
                        changed = true;

                        // Update balances (shielded state simulated)
                        const balances = JSON.parse(fs.readFileSync(BALANCES_FILE));
                        // for demo, we just record that participants have been credited/debited in a record
                        balances[settlement.buy.owner || settlement.buy.ownerAddress || 'buyer'] = (balances[settlement.buy.owner] || 0) - settlement.amount * settlement.price;
                        balances[settlement.sell.owner || settlement.sell.ownerAddress || 'seller'] = (balances[settlement.sell.owner] || 0) + settlement.amount * settlement.price;
                        fs.writeFileSync(BALANCES_FILE, JSON.stringify(balances, null, 2));

                        console.log('Matched and settled', settlement.id);
                    } else {
                        // no match; keep queued
                        o.status = 'queued';
                    }
                } catch (decryptError) {
                    console.warn('Decryption error for order', o.id, ':', decryptError.message);
                    // Skip this order, don't mark as bad
                }
            }
            if (changed) fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
        } catch (e) {
            console.error('Worker loop error', e);
        }
        await sleep(1500);
    }
}

processLoop();
