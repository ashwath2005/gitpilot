use std::process::Command;

pub struct GitEngine;

impl GitEngine {
    pub fn is_inside_work_tree(cwd: &str) -> bool {
        if let Ok(output) = Command::new("git")
            .args(["rev-parse", "--is-inside-work-tree"])
            .current_dir(cwd)
            .output()
        {
            return output.status.success() && String::from_utf8_lossy(&output.stdout).trim() == "true";
        }
        false
    }
}
