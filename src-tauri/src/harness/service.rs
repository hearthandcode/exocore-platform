use std::fs::{self, File, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use serde_json::json;

use super::canonical::{hash_value, sha256_hex};
use super::models::{
    Fixture, FixtureSummary, ReceiptVerification, RunPreview, RunReceipt, Score, ScoreComponent,
    VerificationCheck,
};

const FIXTURE_SOURCE: &str =
    include_str!("../../../fixtures/profile-evaluation/public-smoke/fixture.json");
const MOCK_ADAPTER_ID: &str = "rust-mock-v1";
const MOCK_ADAPTER_VERSION: &str = "0.0.1";
const PROOF_LIMITS: [&str; 4] = [
    "This run uses a deterministic mock, not a language model.",
    "The score applies only to this public smoke fixture.",
    "A valid receipt is evidence of recorded-process self-consistency, not truth or safety.",
    "No network, credential, provider, or private source was used.",
];

pub fn fixture_summaries() -> Result<Vec<FixtureSummary>, String> {
    let fixture = load_fixture()?;
    Ok(vec![FixtureSummary {
        id: fixture.id,
        title: fixture.title,
        profile_id: fixture.profile.id,
        profile_version: fixture.profile.version,
    }])
}

pub fn preview(fixture_id: &str) -> Result<RunPreview, String> {
    let fixture = selected_fixture(fixture_id)?;
    Ok(RunPreview {
        fixture_id: fixture.id.clone(),
        fixture_title: fixture.title.clone(),
        fixture_hash: hash_value(&fixture)?,
        profile_hash: hash_value(&fixture.profile)?,
        adapter_id: MOCK_ADAPTER_ID.into(),
        adapter_version: MOCK_ADAPTER_VERSION.into(),
        endpoint_class: "none".into(),
        network_policy: fixture.policy.network.clone(),
        credential_policy: fixture.policy.credentials.clone(),
        max_attempts: fixture.policy.max_attempts,
        prompt: fixture.prompt.clone(),
        proof_limits: proof_limits(),
    })
}

pub fn run_fixture_in(fixture_id: &str, app_data_dir: &Path) -> Result<RunReceipt, String> {
    let fixture = selected_fixture(fixture_id)?;
    let fixture_hash = hash_value(&fixture)?;
    let profile_hash = hash_value(&fixture.profile)?;
    let normalized_output = fixture.expected.exact_output.clone();
    let output_hash = sha256_hex(normalized_output.as_bytes());
    let score = score_output(&fixture, &normalized_output);
    let input_tokens = estimated_tokens(&format!(
        "{} {}",
        fixture.profile.instructions, fixture.prompt
    ));
    let output_tokens = estimated_tokens(&normalized_output);
    let reproducibility_hash = reproducibility_hash(
        &fixture.id,
        &fixture_hash,
        &profile_hash,
        &normalized_output,
        &output_hash,
        &score,
    )?;
    let now_nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| format!("system clock precedes Unix epoch: {error}"))?
        .as_nanos();
    let run_id = format!("run-{now_nanos:020}-{}", &reproducibility_hash[..12]);
    let runs_dir = app_data_dir.join("profile-evaluation").join("runs");
    let bundle_path = runs_dir.join(format!("{run_id}.json"));

    let mut receipt = RunReceipt {
        schema_version: "1.0".into(),
        run_id,
        fixture_id: fixture.id,
        fixture_hash,
        profile_hash,
        adapter_id: MOCK_ADAPTER_ID.into(),
        adapter_version: MOCK_ADAPTER_VERSION.into(),
        endpoint_class: "none".into(),
        normalized_output,
        output_hash,
        input_tokens,
        output_tokens,
        total_tokens: input_tokens + output_tokens,
        measurement_source: "derived-estimate".into(),
        score,
        reproducibility_hash,
        receipt_hash: String::new(),
        created_at_ms: now_nanos / 1_000_000,
        bundle_path: bundle_path.to_string_lossy().into_owned(),
        proof_limits: proof_limits(),
    };
    receipt.receipt_hash = receipt_hash(&receipt)?;
    write_receipt_atomically(&receipt, &runs_dir)?;
    Ok(receipt)
}

pub fn latest_receipt_in(app_data_dir: &Path) -> Result<Option<RunReceipt>, String> {
    let runs_dir = app_data_dir.join("profile-evaluation").join("runs");
    if !runs_dir.exists() {
        return Ok(None);
    }

    let latest = fs::read_dir(&runs_dir)
        .map_err(|error| format!("cannot read run directory: {error}"))?
        .filter_map(Result::ok)
        .filter(|entry| {
            entry.path().extension().and_then(|value| value.to_str()) == Some("json")
                && entry.file_name().to_string_lossy().starts_with("run-")
        })
        .max_by_key(|entry| entry.file_name());

    let Some(entry) = latest else {
        return Ok(None);
    };
    let bytes =
        fs::read(entry.path()).map_err(|error| format!("cannot read latest receipt: {error}"))?;
    let receipt: RunReceipt = serde_json::from_slice(&bytes)
        .map_err(|error| format!("latest receipt does not match v1: {error}"))?;
    let verification = verify_receipt(&receipt);
    if !verification.valid {
        return Err("latest receipt failed integrity verification".into());
    }
    Ok(Some(receipt))
}

pub fn verify_receipt(receipt: &RunReceipt) -> ReceiptVerification {
    let mut checks = Vec::new();
    let output_hash = sha256_hex(receipt.normalized_output.as_bytes());
    push_check(
        &mut checks,
        "output-hash",
        output_hash == receipt.output_hash,
        "normalized output matches its SHA-256 identity",
    );

    let component_total: u16 = receipt
        .score
        .components
        .iter()
        .map(|item| item.awarded)
        .sum();
    let component_possible: u16 = receipt
        .score
        .components
        .iter()
        .map(|item| item.possible)
        .sum();
    push_check(
        &mut checks,
        "score-total",
        component_total == receipt.score.total && component_possible == receipt.score.possible,
        "score totals match component totals",
    );
    push_check(
        &mut checks,
        "token-total",
        receipt.input_tokens + receipt.output_tokens == receipt.total_tokens,
        "token total matches input plus output",
    );

    let reproducibility = reproducibility_hash(
        &receipt.fixture_id,
        &receipt.fixture_hash,
        &receipt.profile_hash,
        &receipt.normalized_output,
        &receipt.output_hash,
        &receipt.score,
    );
    push_check(
        &mut checks,
        "reproducibility-hash",
        reproducibility
            .as_ref()
            .map(|value| value == &receipt.reproducibility_hash)
            .unwrap_or(false),
        "stable semantic fields match the reproducibility hash",
    );

    let hash = receipt_hash(receipt);
    push_check(
        &mut checks,
        "receipt-hash",
        hash.as_ref()
            .map(|value| value == &receipt.receipt_hash)
            .unwrap_or(false),
        "all receipt fields match the receipt hash",
    );

    ReceiptVerification {
        valid: checks.iter().all(|check| check.passed),
        checks,
    }
}

fn load_fixture() -> Result<Fixture, String> {
    let fixture: Fixture = serde_json::from_str(FIXTURE_SOURCE)
        .map_err(|error| format!("bundled fixture is invalid: {error}"))?;
    validate_fixture(&fixture)?;
    Ok(fixture)
}

fn selected_fixture(fixture_id: &str) -> Result<Fixture, String> {
    let fixture = load_fixture()?;
    if fixture.id != fixture_id {
        return Err(format!("unknown fixture: {fixture_id}"));
    }
    Ok(fixture)
}

fn validate_fixture(fixture: &Fixture) -> Result<(), String> {
    if fixture.schema_version != "1.0" {
        return Err("unsupported fixture schema version".into());
    }
    if fixture.id.is_empty()
        || fixture.title.is_empty()
        || fixture.profile.id.is_empty()
        || fixture.profile.version.is_empty()
        || fixture.profile.instructions.is_empty()
        || fixture.prompt.is_empty()
        || fixture.expected.exact_output.is_empty()
        || fixture.expected.required_terms.is_empty()
    {
        return Err("fixture contains an empty required field".into());
    }
    if fixture.policy.network != "deny"
        || fixture.policy.credentials != "deny"
        || fixture.policy.max_attempts != 1
    {
        return Err(
            "v0.0.1 fixture policy must deny network and credentials with one attempt".into(),
        );
    }
    Ok(())
}

fn score_output(fixture: &Fixture, output: &str) -> Score {
    let exact = output == fixture.expected.exact_output;
    let lowercase = output.to_lowercase();
    let terms = fixture
        .expected
        .required_terms
        .iter()
        .all(|term| lowercase.contains(&term.to_lowercase()));
    let policy = fixture.policy.network == "deny"
        && fixture.policy.credentials == "deny"
        && fixture.policy.max_attempts == 1;
    let components = vec![
        score_component("exact-output", exact, 600, "byte-identical expected output"),
        score_component("required-terms", terms, 300, "all required terms present"),
        score_component("deny-policy", policy, 100, "network and credentials denied"),
    ];
    Score {
        total: components.iter().map(|item| item.awarded).sum(),
        possible: components.iter().map(|item| item.possible).sum(),
        components,
    }
}

fn score_component(id: &str, passed: bool, possible: u16, evidence: &str) -> ScoreComponent {
    ScoreComponent {
        id: id.into(),
        awarded: if passed { possible } else { 0 },
        possible,
        passed,
        evidence: evidence.into(),
    }
}

fn reproducibility_hash(
    fixture_id: &str,
    fixture_hash: &str,
    profile_hash: &str,
    normalized_output: &str,
    output_hash: &str,
    score: &Score,
) -> Result<String, String> {
    hash_value(&json!({
        "adapterId": MOCK_ADAPTER_ID,
        "adapterVersion": MOCK_ADAPTER_VERSION,
        "fixtureHash": fixture_hash,
        "fixtureId": fixture_id,
        "normalizedOutput": normalized_output,
        "outputHash": output_hash,
        "profileHash": profile_hash,
        "score": score,
    }))
}

fn receipt_hash(receipt: &RunReceipt) -> Result<String, String> {
    let mut value = serde_json::to_value(receipt).map_err(|error| error.to_string())?;
    value["receiptHash"] = serde_json::Value::String(String::new());
    hash_value(&value)
}

fn write_receipt_atomically(receipt: &RunReceipt, runs_dir: &Path) -> Result<(), String> {
    fs::create_dir_all(runs_dir)
        .map_err(|error| format!("cannot create run directory: {error}"))?;
    let final_path = PathBuf::from(&receipt.bundle_path);
    if final_path.exists() {
        return Err("refusing to overwrite an existing run receipt".into());
    }
    let temporary_path = runs_dir.join(format!(".{}.tmp", receipt.run_id));
    let result = (|| -> Result<(), String> {
        let mut file = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&temporary_path)
            .map_err(|error| format!("cannot create temporary receipt: {error}"))?;
        serde_json::to_writer_pretty(&mut file, receipt)
            .map_err(|error| format!("cannot serialize receipt: {error}"))?;
        file.write_all(b"\n")
            .map_err(|error| format!("cannot finish receipt: {error}"))?;
        file.sync_all()
            .map_err(|error| format!("cannot sync receipt: {error}"))?;
        fs::rename(&temporary_path, &final_path)
            .map_err(|error| format!("cannot persist append-only application receipt: {error}"))?;
        if let Ok(directory) = File::open(runs_dir) {
            let _ = directory.sync_all();
        }
        Ok(())
    })();
    if result.is_err() {
        let _ = fs::remove_file(&temporary_path);
    }
    result
}

fn estimated_tokens(text: &str) -> u32 {
    text.split_whitespace()
        .count()
        .try_into()
        .unwrap_or(u32::MAX)
}

fn proof_limits() -> Vec<String> {
    PROOF_LIMITS.iter().map(|value| (*value).into()).collect()
}

fn push_check(checks: &mut Vec<VerificationCheck>, id: &str, passed: bool, detail: &str) {
    checks.push(VerificationCheck {
        id: id.into(),
        passed,
        detail: detail.into(),
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    fn temporary_directory(label: &str) -> PathBuf {
        let nonce = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        std::env::temp_dir().join(format!(
            "exocore-platform-{label}-{}-{nonce}",
            std::process::id()
        ))
    }

    #[test]
    fn fixture_preview_is_deny_by_default() {
        let preview = preview("profile-contract-smoke").unwrap();
        assert_eq!(preview.network_policy, "deny");
        assert_eq!(preview.credential_policy, "deny");
        assert_eq!(preview.endpoint_class, "none");
        assert_eq!(preview.max_attempts, 1);
    }

    #[test]
    fn deterministic_run_scores_and_verifies() {
        let directory = temporary_directory("run");
        let receipt = run_fixture_in("profile-contract-smoke", &directory).unwrap();
        assert_eq!(receipt.score.total, 1000);
        assert_eq!(receipt.score.possible, 1000);
        assert!(verify_receipt(&receipt).valid);
        assert!(Path::new(&receipt.bundle_path).is_file());
        let latest = latest_receipt_in(&directory).unwrap().unwrap();
        assert_eq!(latest.run_id, receipt.run_id);
        fs::remove_dir_all(directory).unwrap();
    }

    #[test]
    fn receipt_mutation_is_detected() {
        let directory = temporary_directory("mutation");
        let mut receipt = run_fixture_in("profile-contract-smoke", &directory).unwrap();
        receipt.normalized_output.push_str(" mutated");
        let verification = verify_receipt(&receipt);
        assert!(!verification.valid);
        assert!(verification
            .checks
            .iter()
            .any(|check| check.id == "output-hash" && !check.passed));
        fs::remove_dir_all(directory).unwrap();
    }

    #[test]
    fn unknown_fixture_fails_closed() {
        let directory = temporary_directory("unknown");
        assert!(run_fixture_in("unknown-fixture", &directory).is_err());
        assert!(!directory.exists());
    }
}
