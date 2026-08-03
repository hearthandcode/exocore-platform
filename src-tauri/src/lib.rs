mod commands;
mod harness;

use commands::profile_evaluation::{
    list_profile_fixtures, load_latest_profile_receipt, preview_profile_run, run_profile_fixture,
    verify_profile_receipt,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            list_profile_fixtures,
            preview_profile_run,
            run_profile_fixture,
            load_latest_profile_receipt,
            verify_profile_receipt,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Exocore Platform");
}
