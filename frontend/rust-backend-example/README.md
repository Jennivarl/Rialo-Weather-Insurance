# Rust Backend Example Files

This folder contains example Rust code to help you integrate your backend with the PayOnRain frontend.

## Files Included

- `models.rs` - Data models that match the TypeScript frontend types
- More files can be added as needed

## How to Use

1. Copy these files to your Rust backend project
2. Adjust imports and module paths to match your project structure
3. Implement the actual business logic in your handlers

## Cargo Dependencies

Add these to your `Cargo.toml`:

```toml
[dependencies]
axum = "0.7"
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tower-http = { version = "0.5", features = ["cors", "fs"] }
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1", features = ["v4", "serde"] }

# Optional but recommended
anyhow = "1"
thiserror = "1"
```

## Project Structure Suggestion

```
backend/
├── src/
│   ├── main.rs           # App initialization and routing
│   ├── models.rs         # Data models (from this folder)
│   ├── handlers/
│   │   ├── mod.rs
│   │   ├── policies.rs   # Policy CRUD operations
│   │   ├── weather.rs    # Weather checking logic
│   │   └── payouts.rs    # Payout processing
│   ├── services/
│   │   ├── mod.rs
│   │   ├── weather_api.rs  # External weather API integration
│   │   └── payment.rs      # Payment processing logic
│   └── db/
│       ├── mod.rs
│       └── schema.rs     # Database schema
├── Cargo.toml
└── README.md
```

## See Also

Refer to `/INTEGRATION_GUIDE.md` in the frontend folder for complete integration instructions.
