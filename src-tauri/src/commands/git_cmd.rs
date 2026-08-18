use serde::{Deserialize, Serialize};
use std::process::Command;
use std::fs;
use std::path::Path;

#[derive(Serialize, Deserialize)]
pub struct GitResult {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
    pub error: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct RepoScanItem {
    pub name: String,
    pub path: String,
    pub is_git: bool,
}

#[derive(Serialize, Deserialize)]
pub struct ScanResult {
    pub success: bool,
    pub repositories: Vec<RepoScanItem>,
    pub error: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct CheckGitResult {
    pub success: bool,
    pub version: String,
}

#[tauri::command]
pub async fn check_git() -> Result<CheckGitResult, String> {
    let output = Command::new("git")
        .arg("--version")
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
        Ok(CheckGitResult {
            success: true,
            version,
        })
    } else {
        Err("Git executable not found in PATH".to_string())
    }
}

#[tauri::command]
pub async fn run_git_command(cwd: String, command: String) -> Result<GitResult, String> {
    // Only execute git commands
    if !command.starts_with("git ") {
        return Err("Only git commands can be executed".to_string());
    }

    let args: Vec<&str> = command.split_whitespace().collect();
    if args.is_empty() {
        return Err("Empty command".to_string());
    }

    let output = Command::new("git")
        .args(&args[1..])
        .current_dir(&cwd)
        .output()
        .map_err(|e| e.to_string())?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    Ok(GitResult {
        success: output.status.success(),
        stdout,
        stderr,
        error: if output.status.success() { None } else { Some("Git command failed".to_string()) },
    })
}

#[tauri::command]
pub async fn scan_workspace(directory_path: String) -> Result<ScanResult, String> {
    let path = Path::new(&directory_path);
    if !path.exists() || !path.is_dir() {
        return Ok(ScanResult {
            success: false,
            repositories: vec![],
            error: Some("Directory does not exist".to_string()),
        });
    }

    let mut repos = Vec::new();
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries.flatten() {
            if let Ok(file_type) = entry.file_type() {
                if file_type.is_dir() {
                    let entry_path = entry.path();
                    let is_git = entry_path.join(".git").exists();
                    let name = entry.file_name().to_string_lossy().to_string();
                    repos.push(RepoScanItem {
                        name,
                        path: entry_path.to_string_lossy().to_string(),
                        is_git,
                    });
                }
            }
        }
    }

    Ok(ScanResult {
        success: true,
        repositories: repos,
        error: None,
    })
}
