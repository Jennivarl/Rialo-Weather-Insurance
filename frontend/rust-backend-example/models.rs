// Example Rust models that match the TypeScript frontend types
// Copy this to your Rust backend project

use serde::{Deserialize, Serialize};

// ============================================================================
// Policy Models
// ============================================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreatePolicyRequest {
    pub city: String,
    pub threshold: f64,
    pub payout: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PolicyResponse {
    pub id: String,
    pub city: String,
    pub threshold: f64,
    pub payout: f64,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Policy {
    pub id: String,
    pub user_id: String,
    pub city: String,
    pub threshold: f64,
    pub payout: f64,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub status: PolicyStatus,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum PolicyStatus {
    Active,
    Triggered,
    Expired,
    Cancelled,
}

// ============================================================================
// Weather Models
// ============================================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WeatherCheckRequest {
    pub policy_id: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WeatherResponse {
    pub location: String,
    pub rainfall: f64,
    pub threshold: f64,
    pub condition: String,
    pub temperature: String,
    pub triggered: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WeatherData {
    pub location: String,
    pub rainfall: f64,
    pub condition: String,
    pub temperature: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

// ============================================================================
// Payout Models
// ============================================================================

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PayoutRequest {
    pub policy_id: String,
    pub payout_method: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PayoutResponse {
    pub transaction_id: String,
    pub amount: f64,
    pub status: String,
    pub payout_method: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Payout {
    pub id: String,
    pub policy_id: String,
    pub transaction_id: String,
    pub amount: f64,
    pub payout_method: PayoutMethod,
    pub status: PayoutStatus,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub completed_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum PayoutMethod {
    Bank,
    Paypal,
    Bitcoin,
    Usdc,
}

impl PayoutMethod {
    pub fn from_string(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "bank" => Some(PayoutMethod::Bank),
            "paypal" => Some(PayoutMethod::Paypal),
            "bitcoin" => Some(PayoutMethod::Bitcoin),
            "usdc" => Some(PayoutMethod::Usdc),
            _ => None,
        }
    }

    pub fn to_display_string(&self) -> &str {
        match self {
            PayoutMethod::Bank => "Bank Account",
            PayoutMethod::Paypal => "PayPal",
            PayoutMethod::Bitcoin => "Bitcoin",
            PayoutMethod::Usdc => "USDC",
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum PayoutStatus {
    Pending,
    Processing,
    Completed,
    Failed,
    Cancelled,
}

// ============================================================================
// Error Models
// ============================================================================

#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorResponse {
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub code: Option<String>,
}

impl ErrorResponse {
    pub fn new(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
            code: None,
        }
    }

    pub fn with_code(message: impl Into<String>, code: impl Into<String>) -> Self {
        Self {
            message: message.into(),
            code: Some(code.into()),
        }
    }
}

// ============================================================================
// Conversion Implementations
// ============================================================================

impl From<Policy> for PolicyResponse {
    fn from(policy: Policy) -> Self {
        Self {
            id: policy.id,
            city: policy.city,
            threshold: policy.threshold,
            payout: policy.payout,
            created_at: policy.created_at.to_rfc3339(),
        }
    }
}

impl From<Payout> for PayoutResponse {
    fn from(payout: Payout) -> Self {
        Self {
            transaction_id: payout.transaction_id,
            amount: payout.amount,
            status: format!("{:?}", payout.status),
            payout_method: payout.payout_method.to_display_string().to_string(),
        }
    }
}
