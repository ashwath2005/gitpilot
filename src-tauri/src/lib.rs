pub mod commands;
pub mod git;
pub mod scheduler;
pub mod security;
pub mod state;
pub mod utils;

use commands::filesystem::scan_workspace;
use commands::git::{
    check_git, git_commit, git_diff, git_push, git_stage_all, git_status,
    git_validate_repository, run_git_command,
};
use commands::security::scan_sensitive_files;
use commands::system::{get_system_info, has_api_key, remove_api_key, set_api_key};
use state::app_state::AppState;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Manager, WindowEvent};

pub fn run() {
    tauri::Builder::default()
        .manage(AppState::default())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let quit_i = MenuItem::with_id(app, "quit", "Quit GitPilot", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Open GitPilot", true, None::<&str>)?;
            let sep_1 = MenuItem::with_id(app, "sep1", "---", false, None::<&str>)?;
            let status_i = MenuItem::with_id(app, "status", "Status: Scheduler Active", false, None::<&str>)?;
            
            let menu = Menu::with_items(app, &[&show_i, &status_i, &sep_1, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .tooltip("GitPilot — Your Autonomous Git Workspace")
                .menu(&menu)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .invoke_handler(tauri::generate_handler![
            check_git,
            run_git_command,
            git_status,
            git_validate_repository,
            git_diff,
            git_stage_all,
            git_commit,
            git_push,
            scan_workspace,
            get_system_info,
            set_api_key,
            has_api_key,
            remove_api_key,
            scan_sensitive_files
        ])
        .run(tauri::generate_context!())
        .expect("error while running GitPilot application");
}
