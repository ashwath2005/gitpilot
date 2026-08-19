use crate::git::engine::{GitEngine, GitStatusResult};
use crate::utils::process::{execute_git_command, ProcessResult};
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct GitValidation {
    pub valid: bool,
    pub branch: String,
    pub remote_url: String,
    pub remote_name: String,
    pub error: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct GitDiffResult {
    pub success: bool,
    pub unstaged_diff: String,
    pub staged_diff: String,
    pub combined_diff: String,
    pub stat: String,
    pub error: Option<String>,
}

#[tauri::command]
pub async fn check_git() -> Result<ProcessResult, String> {
    let res = execute_git_command(".", &["--version"]);
    Ok(res)
}

#[tauri::command]
pub async fn run_git_command(cwd: String, command: String) -> Result<ProcessResult, String> {
    if !command.starts_with("git ") {
        return Err("Only git commands are allowed".to_string());
    }

    let args: Vec<&str> = command.split_whitespace().collect();
    if args.is_empty() {
        return Err("Empty command".to_string());
    }

    let res = execute_git_command(&cwd, &args[1..]);
    Ok(res)
}

#[tauri::command]
pub async fn git_status(cwd: String) -> Result<GitStatusResult, String> {
    Ok(GitEngine::get_status(&cwd))
}

#[tauri::command]
pub async fn git_validate_repository(cwd: String) -> Result<GitValidation, String> {
    let check = execute_git_command(&cwd, &["rev-parse", "--is-inside-work-tree"]);
    if !check.success || !check.stdout.contains("true") {
        return Ok(GitValidation {
            valid: false,
            branch: "HEAD".to_string(),
            remote_url: "local".to_string(),
            remote_name: "origin".to_string(),
            error: Some("Not a valid Git repository".to_string()),
        });
    }

    let branch = GitEngine::get_current_branch(&cwd);

    let origin_res = execute_git_command(&cwd, &["remote", "get-url", "origin"]);
    let (remote_name, remote_url) = if origin_res.success && !origin_res.stdout.trim().is_empty() {
        ("origin".to_string(), origin_res.stdout.trim().to_string())
    } else {
        let list_res = execute_git_command(&cwd, &["remote"]);
        if list_res.success && !list_res.stdout.trim().is_empty() {
            let first = list_res.stdout.lines().next().unwrap_or("origin").trim();
            let url_res = execute_git_command(&cwd, &["remote", "get-url", first]);
            (
                first.to_string(),
                if url_res.success {
                    url_res.stdout.trim().to_string()
                } else {
                    "local".to_string()
                },
            )
        } else {
            ("origin".to_string(), "local".to_string())
        }
    };

    Ok(GitValidation {
        valid: true,
        branch,
        remote_url,
        remote_name,
        error: None,
    })
}

#[tauri::command]
pub async fn git_diff(cwd: String, target_file: Option<String>) -> Result<GitDiffResult, String> {
    let mut unstaged_args = vec!["diff"];
    let mut staged_args = vec!["diff", "--cached"];
    let mut stat_args = vec!["diff", "--stat"];

    let target_ref;
    if let Some(ref file) = target_file {
        target_ref = format!("--",);
        unstaged_args.push(&target_ref);
        unstaged_args.push(file);
        staged_args.push(&target_ref);
        staged_args.push(file);
        stat_args.push(&target_ref);
        stat_args.push(file);
    }

    let unstaged = execute_git_command(&cwd, &unstaged_args);
    let staged = execute_git_command(&cwd, &staged_args);
    let stat = execute_git_command(&cwd, &stat_args);

    let combined = format!("{}\n{}", staged.stdout, unstaged.stdout);

    Ok(GitDiffResult {
        success: true,
        unstaged_diff: unstaged.stdout,
        staged_diff: staged.stdout,
        combined_diff: combined,
        stat: stat.stdout,
        error: None,
    })
}

#[tauri::command]
pub async fn git_stage_all(cwd: String) -> Result<ProcessResult, String> {
    Ok(GitEngine::stage_all(&cwd))
}

#[tauri::command]
pub async fn git_commit(cwd: String, message: String) -> Result<ProcessResult, String> {
    Ok(GitEngine::commit(&cwd, &message))
}

#[tauri::command]
pub async fn git_push(cwd: String, remote: String, branch: String) -> Result<ProcessResult, String> {
    Ok(GitEngine::push(&cwd, &remote, &branch))
}
