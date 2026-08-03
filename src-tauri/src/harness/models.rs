use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Fixture {
    pub schema_version: String,
    pub id: String,
    pub title: String,
    pub profile: ProfileProjection,
    pub prompt: String,
    pub expected: ExpectedResult,
    pub policy: RunPolicy,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ProfileProjection {
    pub id: String,
    pub version: String,
    pub instructions: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ExpectedResult {
    pub exact_output: String,
    pub required_terms: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RunPolicy {
    pub network: String,
    pub credentials: String,
    pub max_attempts: u8,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FixtureSummary {
    pub id: String,
    pub title: String,
    pub profile_id: String,
    pub profile_version: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RunPreview {
    pub fixture_id: String,
    pub fixture_title: String,
    pub fixture_hash: String,
    pub profile_hash: String,
    pub adapter_id: String,
    pub adapter_version: String,
    pub endpoint_class: String,
    pub network_policy: String,
    pub credential_policy: String,
    pub max_attempts: u8,
    pub prompt: String,
    pub proof_limits: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ScoreComponent {
    pub id: String,
    pub awarded: u16,
    pub possible: u16,
    pub passed: bool,
    pub evidence: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Score {
    pub total: u16,
    pub possible: u16,
    pub components: Vec<ScoreComponent>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RunReceipt {
    pub schema_version: String,
    pub run_id: String,
    pub fixture_id: String,
    pub fixture_hash: String,
    pub profile_hash: String,
    pub adapter_id: String,
    pub adapter_version: String,
    pub endpoint_class: String,
    pub normalized_output: String,
    pub output_hash: String,
    pub input_tokens: u32,
    pub output_tokens: u32,
    pub total_tokens: u32,
    pub measurement_source: String,
    pub score: Score,
    pub reproducibility_hash: String,
    pub receipt_hash: String,
    pub created_at_ms: u128,
    pub bundle_path: String,
    pub proof_limits: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReceiptVerification {
    pub valid: bool,
    pub checks: Vec<VerificationCheck>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VerificationCheck {
    pub id: String,
    pub passed: bool,
    pub detail: String,
}
