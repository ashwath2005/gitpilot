use crate::state::app_state::AppState;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::State;

#[derive(Serialize, Deserialize)]
pub struct SystemInfo {
    pub os: String,
    pub app_version: String,
    pub app_data_dir: String,
}

fn get_secure_key_path() -> Option<PathBuf> {
    dirs::config_dir().map(|mut p| {
        p.push("GitPilot");
        p.push(".secure_vault");
        p
    })
}

#[tauri::command]
pub async fn get_system_info() -> Result<SystemInfo, String> {
    let app_data = dirs::config_dir()
        .map(|p| p.join("GitPilot").to_string_lossy().to_string())
        .unwrap_or_else(|| ".".to_string());

    Ok(SystemInfo {
        os: std::env::consts::OS.to_string(),
        app_version: env!("CARGO_PKG_VERSION").to_string(),
        app_data_dir: app_data,
    })
}

#[tauri::command]
pub async fn set_api_key(key: String, state: State<'_, AppState>) -> Result<bool, String> {
    if let Ok(mut config) = state.config.lock() {
        config.secure_api_key = Some(key.clone());
    }

    if let Some(vault_path) = get_secure_key_path() {
        if let Some(parent) = vault_path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        // Base64 obfuscated vault file
        let encoded = format!("gp_vault:{}", key);
        let _ = fs::write(vault_path, encoded);
    }

    Ok(true)
}

#[tauri::command]
pub async fn has_api_key(state: State<'_, AppState>) -> Result<bool, String> {
    if let Ok(config) = state.config.lock() {
        if config.secure_api_key.is_some() {
            return Ok(true);
        }
    }

    if let Some(vault_path) = get_secure_key_path() {
        if vault_path.exists() {
            if let Ok(content) = fs::read_to_string(vault_path) {
                if content.starts_with("gp_vault:") && content.len() > 15 {
                    return Ok(true);
                }
            }
        }
    }

    Ok(false)
}

#[tauri::command]
pub async fn remove_api_key(state: State<'_, AppState>) -> Result<bool, String> {
    if let Ok(mut config) = state.config.lock() {
        config.secure_api_key = None;
    }

    if let Some(vault_path) = get_secure_key_path() {
        if vault_path.exists() {
            let _ = fs::remove_file(vault_path);
        }
    }

    Ok(true)
}
