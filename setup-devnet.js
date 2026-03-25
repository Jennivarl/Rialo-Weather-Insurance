/**
 * setup-devnet.js — Fund the PayOnRain treasury wallet on Solana devnet
 *
 * Run AFTER starting the server at least once (so the keypair is generated):
 *   node setup-devnet.js
 *
 * This script:
 *  1. Reads the treasury keypair from solana-treasury.json
 *  2. Requests a devnet SOL airdrop (for gas fees)
 *  3. Shows you where to get devnet USDC
 */

const { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } = require('@solana/web3.js');
const { getOrCreateAssociatedTokenAccount } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

const TREASURY_FILE = path.join(__dirname, 'solana-treasury.json');
const USDC_DEVNET_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const RPC = 'https://api.devnet.solana.com';

async function main() {
    if (!fs.existsSync(TREASURY_FILE)) {
        console.error('❌  No treasury keypair found.');
        console.error('    Start the server first: node server.js');
        console.error('    It will generate solana-treasury.json automatically.');
        process.exit(1);
    }

    const raw = JSON.parse(fs.readFileSync(TREASURY_FILE, 'utf-8'));
    const keypair = Keypair.fromSecretKey(Uint8Array.from(raw));
    const address = keypair.publicKey.toBase58();

    console.log('');
    console.log('PayOnRain — Solana Devnet Treasury Setup');
    console.log('=========================================');
    console.log(`Treasury address: ${address}`);
    console.log(`Explorer:  https://explorer.solana.com/address/${address}?cluster=devnet`);
    console.log('');

    const connection = new Connection(RPC, 'confirmed');

    // Check current SOL balance
    const balanceLamports = await connection.getBalance(keypair.publicKey);
    const balanceSOL = balanceLamports / LAMPORTS_PER_SOL;
    console.log(`Current SOL balance: ${balanceSOL.toFixed(4)} SOL`);

    // Airdrop SOL if balance is low
    if (balanceSOL < 0.5) {
        console.log('Requesting 2 SOL airdrop from devnet faucet...');
        try {
            const sig = await connection.requestAirdrop(keypair.publicKey, 2 * LAMPORTS_PER_SOL);
            await connection.confirmTransaction(sig, 'confirmed');
            const newBalance = await connection.getBalance(keypair.publicKey);
            console.log(`✅  Airdrop successful! New balance: ${(newBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL`);
            console.log(`    Tx: https://explorer.solana.com/tx/${sig}?cluster=devnet`);
        } catch (e) {
            console.error('⚠️  Airdrop failed (devnet faucet rate-limited):', e.message);
            console.error('   Try: https://faucet.solana.com/ and paste the treasury address above');
        }
    } else {
        console.log('✅  SOL balance is sufficient for gas fees.');
    }

    // Create treasury USDC token account
    console.log('');
    console.log('Creating treasury USDC token account...');
    try {
        const mintPubkey = new PublicKey(USDC_DEVNET_MINT);
        const ata = await getOrCreateAssociatedTokenAccount(
            connection, keypair, mintPubkey, keypair.publicKey
        );
        console.log(`✅  Treasury USDC account: ${ata.address.toBase58()}`);
        console.log(`    Balance: ${Number(ata.amount) / 1_000_000} USDC`);
        if (Number(ata.amount) === 0) {
            console.log('');
            console.log('══════════════════════════════════════════════════════════');
            console.log('  Next step: Fund the treasury with devnet USDC');
            console.log('  1. Go to: https://faucet.circle.com/');
            console.log('  2. Select "Solana" + "Devnet"');
            console.log(`  3. Paste address: ${address}`);
            console.log('  4. Request USDC');
            console.log('══════════════════════════════════════════════════════════');
        }
    } catch (e) {
        console.error('⚠️  Could not create USDC token account:', e.message);
    }

    console.log('');
    console.log('USDC Devnet Mint:', USDC_DEVNET_MINT);
    console.log('Done!');
}

main().catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
});
