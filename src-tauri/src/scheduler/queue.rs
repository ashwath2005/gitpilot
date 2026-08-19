use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct QueueItem {
    pub id: String,
    pub repository_id: String,
    pub repository_name: String,
    pub path: String,
    pub branch: String,
    pub status: String,
    pub progress: usize,
    pub message: String,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
    pub error: Option<String>,
}
