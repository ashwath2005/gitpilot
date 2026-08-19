use serde::{Deserialize, Serialize};
use regex::Regex;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SecretFinding {
    pub finding_type: String,
    pub file: String,
    pub line: Option<usize>,
    pub severity: String,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScanResult {
    pub safe: bool,
    pub findings: Vec<SecretFinding>,
}

pub struct RustSecretScanner {
    blocked_patterns: Vec<Regex>,
}

impl Default for RustSecretScanner {
    fn default() -> Self {
        let blocked = vec![
            Regex::new(r"(?i)^\.env(\..+)?$").unwrap(),
            Regex::new(r"(?i)\.pem$").unwrap(),
            Regex::new(r"(?i)\.key$").unwrap(),
            Regex::new(r"(?i)\.pfx$").unwrap(),
            Regex::new(r"(?i)\.p12$").unwrap(),
            Regex::new(r"(?i)credentials\.json$").unwrap(),
            Regex::new(r"(?i)secrets\.json$").unwrap(),
            Regex::new(r"(?i)id_rsa$").unwrap(),
            Regex::new(r"(?i)id_ed25519$").unwrap(),
        ];
        Self { blocked_patterns: blocked }
    }
}

impl RustSecretScanner {
    pub fn check_files(&self, file_paths: &[String]) -> ScanResult {
        let mut findings = Vec::new();

        for file_path in file_paths {
            let file_name = Path::new(file_path)
                .file_name()
                .and_then(|s| s.to_str())
                .unwrap_or("");

            for pattern in &self.blocked_patterns {
                if pattern.is_match(file_name) {
                    findings.push(SecretFinding {
                        finding_type: "BlockedSensitiveFile".to_string(),
                        file: file_path.clone(),
                        line: None,
                        severity: "critical".to_string(),
                        message: format!("File '{}' matches protected sensitive filename pattern", file_name),
                    });
                    break;
                }
            }
        }

        ScanResult {
            safe: findings.is_empty(),
            findings,
        }
    }
}
