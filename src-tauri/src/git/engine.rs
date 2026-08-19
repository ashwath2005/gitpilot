use crate::utils::process::{execute_git_command, ProcessResult};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct GitStatusFile {
    pub path: String,
    pub status: String,
    pub staged: bool,
    pub code: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GitStatusSummary {
    pub modified: usize,
    pub added: usize,
    pub deleted: usize,
    pub untracked: usize,
    pub renamed: usize,
    pub total: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GitStatusResult {
    pub success: bool,
    pub has_changes: bool,
    pub files: Vec<GitStatusFile>,
    pub summary: GitStatusSummary,
    pub error: Option<String>,
}

pub struct GitEngine;

impl GitEngine {
    pub fn get_status(cwd: &str) -> GitStatusResult {
        let res = execute_git_command(cwd, &["status", "--porcelain"]);
        if !res.success {
            return GitStatusResult {
                success: false,
                has_changes: false,
                files: vec![],
                summary: GitStatusSummary {
                    modified: 0,
                    added: 0,
                    deleted: 0,
                    untracked: 0,
                    renamed: 0,
                    total: 0,
                },
                error: res.error,
            };
        }

        let mut files = Vec::new();
        let mut modified = 0;
        let mut added = 0;
        let mut deleted = 0;
        let mut untracked = 0;
        let mut renamed = 0;

        for line in res.stdout.lines() {
            if line.len() < 3 {
                continue;
            }
            let code = &line[0..2];
            let file_path = line[3..].trim().to_string();

            let mut status = "modified";
            if code.contains('?') {
                status = "untracked";
                untracked += 1;
            } else if code.contains('A') {
                status = "added";
                added += 1;
            } else if code.contains('D') {
                status = "deleted";
                deleted += 1;
            } else if code.contains('R') {
                status = "renamed";
                renamed += 1;
            } else {
                modified += 1;
            }

            let staged = !code.starts_with(' ') && !code.starts_with('?');

            files.push(GitStatusFile {
                path: file_path,
                status: status.to_string(),
                staged,
                code: code.to_string(),
            });
        }

        let total = files.len();
        let has_changes = total > 0;

        GitStatusResult {
            success: true,
            has_changes,
            files,
            summary: GitStatusSummary {
                modified,
                added,
                deleted,
                untracked,
                renamed,
                total,
            },
            error: None,
        }
    }

    pub fn get_current_branch(cwd: &str) -> String {
        let res = execute_git_command(cwd, &["branch", "--show-current"]);
        if res.success && !res.stdout.trim().is_empty() {
            return res.stdout.trim().to_string();
        }
        let head_res = execute_git_command(cwd, &["rev-parse", "--abbrev-ref", "HEAD"]);
        if head_res.success && !head_res.stdout.trim().is_empty() {
            return head_res.stdout.trim().to_string();
        }
        "main".to_string()
    }

    pub fn stage_all(cwd: &str) -> ProcessResult {
        execute_git_command(cwd, &["add", "-A"])
    }

    pub fn commit(cwd: &str, message: &str) -> ProcessResult {
        execute_git_command(cwd, &["commit", "-m", message])
    }

    pub fn push(cwd: &str, remote: &str, branch: &str) -> ProcessResult {
        execute_git_command(cwd, &["push", remote, branch])
    }
}
