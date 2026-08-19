use crate::security::scanner::{RustSecretScanner, ScanResult};

#[tauri::command]
pub async fn scan_sensitive_files(files: Vec<String>) -> Result<ScanResult, String> {
    let scanner = RustSecretScanner::default();
    Ok(scanner.check_files(&files))
}
