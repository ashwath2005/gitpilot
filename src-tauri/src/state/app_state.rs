use std::sync::Mutex;
use serde::{Deserialize, Serialize};

#[derive(Default, Debug, Serialize, Deserialize)]
pub struct AppConfig {
    pub secure_api_key: Option<String>,
    pub is_scheduler_paused: bool,
}

pub struct AppState {
    pub config: Mutex<AppConfig>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            config: Mutex::new(AppConfig::default()),
        }
    }
}
