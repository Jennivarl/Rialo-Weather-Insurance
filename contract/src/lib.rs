// ============================================================
//  PayOnRain — Smart Contract
//  Network : Rialo DevNet
//  Language: Rust (RISC-V target via Rialo SDK)
//
//  What this contract does:
//    1. A delivery company registers a policy (location + rain threshold + payout amount)
//    2. Anyone can call check_weather_and_pay()
//    3. Contract fetches LIVE weather data from OpenWeatherMap
//    4. If rainfall >= threshold → pays the delivery company automatically
//
//  Safety caps applied at setup: minimum threshold = 0.1 mm, maximum payout = 200 RALO
// ============================================================

use rialo_sdk::prelude::*;
use rialo_sdk::http::{HttpRequest, Method};
use rialo_sdk::token::transfer;
use serde::{Deserialize, Serialize};

// ── Storage layout ───────────────────────────────────────────
#[rialo::state]
pub struct InsuranceState {
    pub delivery_company: Pubkey,    // wallet that receives the payout
    pub location:       String,      // city name, e.g. "Nairobi"
    pub threshold_mm:   f64,         // rainfall threshold in mm (supports fractional values)
    pub payout_amount:  u64,         // tokens to send when triggered
    pub is_paid_out:    bool,        // guard — can only pay once
    pub api_key:        String,      // OpenWeatherMap API key (set at deploy)
}

// ── Helper structs for parsing the weather API response ──────
#[derive(Deserialize)]
struct WeatherResponse {
    rain: Option<RainData>,
}

#[derive(Deserialize)]
struct RainData {
    #[serde(rename = "1h")]
    one_hour: Option<f64>,
}

// ── Entry point 1: Delivery company sets up their policy ─────
#[rialo::instruction]
pub async fn setup_policy(
    ctx:            Context<InsuranceState>,
    location:       String,
    threshold_mm:   f64,
    payout_amount:  u64,
    api_key:        String,
) -> RialoResult<()> {

    let state = &mut ctx.state;

    require!(!state.is_paid_out, "Policy already triggered.");

    // Enforce sensible caps to avoid bankrupting the contract
    require!(threshold_mm >= 0.1, "Threshold must be at least 0.1 mm.");
    require!(payout_amount <= 200, "Payout must be at most 200 RALO tokens.");

    state.delivery_company = *ctx.signer;
    state.location      = location;
    state.threshold_mm  = threshold_mm;
    state.payout_amount = payout_amount;
    state.api_key       = api_key;
    state.is_paid_out   = false;

    emit!(PolicyCreated {
        delivery_company: state.delivery_company,
        location:     state.location.clone(),
        threshold_mm: state.threshold_mm,
        payout:       state.payout_amount,
    });

    Ok(())
}

// ── Entry point 2: Check weather and pay if threshold is met ─
//
//  This is the key Rialo feature:
//  → The contract makes a LIVE HTTP call to an external API.
//  → No oracle. No keeper bot. Just one await.
//
#[rialo::instruction]
pub async fn check_weather_and_pay(
    ctx: Context<InsuranceState>,
) -> RialoResult<()> {

    let state = &mut ctx.state;

    // Guard: don't pay twice
    require!(!state.is_paid_out, "Policy already paid out.");

    // ── Step 1: Build the OpenWeatherMap API URL ──────────────
    let url = format!(
        "https://api.openweathermap.org/data/2.5/weather?q={}&appid={}&units=metric",
        state.location,
        state.api_key,
    );

    // ── Step 2: Make the HTTP call — native Rialo feature ─────
    //    On any other chain this would need Chainlink, an oracle
    //    contract, a keeper, and a relay. Here it's one line.
    let response = HttpRequest::new(Method::GET, &url)
        .send()
        .await?;

    // ── Step 3: Parse the response ────────────────────────────
    let weather: WeatherResponse = response.json()?;

    let rainfall_mm = weather
        .rain
        .and_then(|r| r.one_hour)
        .unwrap_or(0.0);

    emit!(WeatherChecked {
        location:    state.location.clone(),
        rainfall_mm: rainfall_mm,
        threshold:   state.threshold_mm,
    });

    // ── Step 4: Evaluate the condition ────────────────────────
    if rainfall_mm >= state.threshold_mm {

        // ── Step 5: Pay out — automatically ───────────────────
        transfer(&ctx.vault, &state.delivery_company, state.payout_amount)?;

        state.is_paid_out = true;

        emit!(PolicyTriggered {
            delivery_company: state.delivery_company,
            rainfall_mm: rainfall_mm,
            payout:      state.payout_amount,
        });

    } else {
        // Condition not met — no action, no cost, no fuss
        emit!(ConditionNotMet {
            rainfall_mm: rainfall_mm,
            threshold:   state.threshold_mm,
        });
    }

    Ok(())
}

// ── Events (visible in block explorer & frontend) ────────────
#[rialo::event] pub struct PolicyCreated   { pub delivery_company: Pubkey, pub location: String, pub threshold_mm: f64, pub payout: u64 }
#[rialo::event] pub struct WeatherChecked  { pub location: String, pub rainfall_mm: f64, pub threshold: f64 }
#[rialo::event] pub struct PolicyTriggered { pub delivery_company: Pubkey, pub rainfall_mm: f64, pub payout: u64 }
#[rialo::event] pub struct ConditionNotMet { pub rainfall_mm: f64, pub threshold: f64 }
