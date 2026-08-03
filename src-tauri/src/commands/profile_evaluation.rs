use tauri::{AppHandle, Manager};

use crate::harness::service;
use crate::harness::{FixtureSummary, ReceiptVerification, RunPreview, RunReceipt};

#[tauri::command]
pub fn list_profile_fixtures() -> Result<Vec<FixtureSummary>, String> {
    service::fixture_summaries()
}

#[tauri::command]
pub fn preview_profile_run(fixture_id: String) -> Result<RunPreview, String> {
    service::preview(&fixture_id)
}

#[tauri::command]
pub fn run_profile_fixture(app: AppHandle, fixture_id: String) -> Result<RunReceipt, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("cannot resolve Exocore application data directory: {error}"))?;
    service::run_fixture_in(&fixture_id, &app_data_dir)
}

#[tauri::command]
pub fn load_latest_profile_receipt(app: AppHandle) -> Result<Option<RunReceipt>, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| format!("cannot resolve Exocore application data directory: {error}"))?;
    service::latest_receipt_in(&app_data_dir)
}

#[tauri::command]
pub fn verify_profile_receipt(receipt: RunReceipt) -> ReceiptVerification {
    service::verify_receipt(&receipt)
}
