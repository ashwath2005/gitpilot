use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct RepoScanItem {
    pub name: String,
    pub path: String,
    pub is_git: bool,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ScanResult {
    pub success: bool,
    pub repositories: Vec<RepoScanItem>,
    pub error: Option<String>,
}

fn should_ignore_dir(name: &str) -> bool {
    matches!(
        name,
        "node_modules"
            | ".git"
            | "target"
            | "dist"
            | "build"
            | ".next"
            | "coverage"
            | "vendor"
            | ".gemini"
            | "$RECYCLE.BIN"
            | "System Volume Information"
    )
}

fn scan_directory_recursive(dir: &Path, max_depth: usize, current_depth: usize, results: &mut Vec<RepoScanItem>) {
    if current_depth > max_depth {
        return;
    }

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            if let Ok(file_type) = entry.file_type() {
                if file_type.is_dir() {
                    let entry_name = entry.file_name().to_string_lossy().to_string();
                    if should_ignore_dir(&entry_name) {
                        continue;
                    }

                    let entry_path = entry.path();
                    let has_git = entry_path.join(".git").exists();

                    if has_git {
                        results.push(RepoScanItem {
                            name: entry_name,
                            path: entry_path.to_string_lossy().to_string(),
                            is_git: true,
                        });
                    } else if current_depth < max_depth {
                        scan_directory_recursive(&entry_path, max_depth, current_depth + 1, results);
                    }
                }
            }
        }
    }
}

#[tauri::command]
pub async fn scan_workspace(directory_path: String) -> Result<ScanResult, String> {
    let path = PathBuf::from(&directory_path);
    if !path.exists() || !path.is_dir() {
        return Ok(ScanResult {
            success: false,
            repositories: vec![],
            error: Some("Directory does not exist".to_string()),
        });
    }

    let mut repos = Vec::new();
    // Scan up to depth 3
    scan_directory_recursive(&path, 3, 1, &mut repos);

    Ok(ScanResult {
        success: true,
        repositories: repos,
        error: None,
    })
}
