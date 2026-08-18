#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod git;
mod security;
mod commands;

use commands::git_cmd::{check_git, run_git_command, scan_workspace};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            check_git,
            run_git_command,
            scan_workspace
        ])
        .run(tauri::generate_context!())
        .expect("error while running GitPilot application");
}
