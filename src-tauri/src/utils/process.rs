use serde::{Deserialize, Serialize};
use std::process::Command;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProcessResult {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
    pub exit_code: Option<i32>,
    pub error_category: Option<String>,
    pub error: Option<String>,
}

pub fn execute_git_command(cwd: &str, args: &[&str]) -> ProcessResult {
    let mut cmd = Command::new("git");
    cmd.args(args);
    cmd.current_dir(cwd);

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }

    match cmd.output() {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            let success = output.status.success();
            let exit_code = output.status.code();

            let mut error_category = None;
            let mut error = None;

            if !success {
                let err_lower = stderr.to_lowercase();
                if err_lower.contains("index.lock") || err_lower.contains("unable to create") {
                    error_category = Some("LockExists".to_string());
                } else if err_lower.contains("authentication")
                    || err_lower.contains("permission denied")
                    || err_lower.contains("fatal: could not read username")
                {
                    error_category = Some("AuthenticationFailed".to_string());
                } else if err_lower.contains("rejected") || err_lower.contains("non-fast-forward") {
                    error_category = Some("PushRejected".to_string());
                } else if err_lower.contains("conflict") {
                    error_category = Some("MergeConflict".to_string());
                } else if err_lower.contains("could not resolve host") || err_lower.contains("network") {
                    error_category = Some("NetworkError".to_string());
                } else {
                    error_category = Some("GitError".to_string());
                }

                error = Some(if !stderr.trim().is_empty() {
                    stderr.clone()
                } else {
                    format!("Command failed with exit code {:?}", exit_code)
                });
            }

            ProcessResult {
                success,
                stdout,
                stderr,
                exit_code,
                error_category,
                error,
            }
        }
        Err(err) => ProcessResult {
            success: false,
            stdout: String::new(),
            stderr: err.to_string(),
            exit_code: None,
            error_category: Some("ExecutionFailed".to_string()),
            error: Some(err.to_string()),
        },
    }
}
