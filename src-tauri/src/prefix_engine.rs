// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
// Tauri IPC bridge to the Rust prefix engine crate
// Provides high-performance classification via Tauri commands

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

// ──────────────────────────────────────────────────────────
// Import the prefix engine crate
// ──────────────────────────────────────────────────────────

// Re-export the engine for use in main.rs
pub use uvspeed_prefix_engine::{PrefixClassifier, PrefixSymbol, Category, ClassifyResult};

// ──────────────────────────────────────────────────────────
// Tauri IPC Response types
// ──────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize)]
pub struct ClassifyLineResponse {
    pub symbol: String,
    pub category: String,
    pub bits: u8,
    pub coords: (i8, i8, i8),
}

#[derive(Serialize, Deserialize)]
pub struct ClassifyFileResponse {
    pub path: String,
    pub total_lines: usize,
    pub classified_lines: usize,
    pub coverage: f64,
    pub prefix_counts: std::collections::HashMap<String, usize>,
    pub lines: Vec<ClassifyResult>,
}

#[derive(Serialize, Deserialize)]
pub struct GutterResponse {
    pub gutter: Vec<String>,
    pub total_lines: usize,
}

#[derive(Serialize, Deserialize)]
pub struct BenchmarkResponse {
    pub lines: usize,
    pub elapsed_us: u128,
    pub lines_per_second: f64,
}

// ──────────────────────────────────────────────────────────
// Tauri commands
// ──────────────────────────────────────────────────────────

/// Classify a single line using the Rust prefix engine
#[tauri::command]
pub fn classify_line(line: String, _language: Option<String>) -> ClassifyLineResponse {
    let classifier = PrefixClassifier::new();
    let (sym, cat) = classifier.classify(&line);

    ClassifyLineResponse {
        symbol: sym.as_str().to_string(),
        category: cat.as_str().to_string(),
        bits: sym.to_bits(),
        coords: sym.to_3d(),
    }
}

/// Classify an entire file by path
#[tauri::command]
pub fn classify_file(path: String) -> Result<ClassifyFileResponse, String> {
    let file_path = PathBuf::from(&path);
    let content = std::fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read file: {}", e))?;

    let classifier = PrefixClassifier::new();
    let results = classifier.classify_batch(&content);

    let total = results.len();
    let classified = results.iter()
        .filter(|r| r.category != "neutral" && r.category != "unknown")
        .count();

    let mut counts: std::collections::HashMap<String, usize> = std::collections::HashMap::new();
    for r in &results {
        *counts.entry(r.category.clone()).or_insert(0) += 1;
    }

    Ok(ClassifyFileResponse {
        path,
        total_lines: total,
        classified_lines: classified,
        coverage: if total > 0 { (classified as f64 / total as f64) * 100.0 } else { 0.0 },
        prefix_counts: counts,
        lines: results,
    })
}

/// Batch classify multiple lines
#[tauri::command]
pub fn classify_lines(lines: Vec<String>) -> Vec<ClassifyLineResponse> {
    let classifier = PrefixClassifier::new();
    lines.iter().map(|line| {
        let (sym, cat) = classifier.classify(line);
        ClassifyLineResponse {
            symbol: sym.as_str().to_string(),
            category: cat.as_str().to_string(),
            bits: sym.to_bits(),
            coords: sym.to_3d(),
        }
    }).collect()
}

/// Generate gutter strings for source content
#[tauri::command]
pub fn generate_gutter(source: String) -> GutterResponse {
    let classifier = PrefixClassifier::new();
    let gutter = classifier.gutter(&source);
    let total = gutter.len();
    GutterResponse { gutter, total_lines: total }
}

/// Benchmark the classifier (classify N lines, return timing)
#[tauri::command]
pub fn benchmark_classifier(source: String, iterations: Option<u32>) -> BenchmarkResponse {
    let classifier = PrefixClassifier::new();
    let iters = iterations.unwrap_or(100);
    let line_count = source.lines().count();

    let start = std::time::Instant::now();
    for _ in 0..iters {
        let _ = classifier.classify_batch(&source);
    }
    let elapsed = start.elapsed();

    let total_lines = line_count * iters as usize;
    let elapsed_us = elapsed.as_micros();
    let lps = if elapsed_us > 0 {
        (total_lines as f64 / elapsed_us as f64) * 1_000_000.0
    } else {
        0.0
    };

    BenchmarkResponse {
        lines: total_lines,
        elapsed_us,
        lines_per_second: lps,
    }
}
