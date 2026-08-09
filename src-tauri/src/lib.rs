mod commands;
pub mod foundation;
mod harness;

use commands::profile_evaluation::{
    list_profile_fixtures, load_latest_profile_receipt, preview_profile_run, run_profile_fixture,
    verify_profile_receipt,
};
use foundation::ipc::{
    foundation_echo, foundation_set_module_enabled, foundation_set_skeleton_ui, foundation_status,
    FoundationRuntime,
};
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let foundation_runtime = FoundationRuntime::new()
        .expect("foundation default configuration and mount contract must validate");
    tauri::Builder::default()
        .manage(Mutex::new(foundation_runtime))
        .invoke_handler(tauri::generate_handler![
            list_profile_fixtures,
            preview_profile_run,
            run_profile_fixture,
            load_latest_profile_receipt,
            verify_profile_receipt,
            foundation_status,
            foundation_set_skeleton_ui,
            foundation_set_module_enabled,
            foundation_echo,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Exocore Platform");
}
