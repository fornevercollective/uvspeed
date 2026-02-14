// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
//
// Quantum Prefix Classifier — Rust implementation
// Maps code lines to the 11-symbol directional prefix system:
//
//   +1 = declaration (fn, class, struct, const, let, var, type, enum)
//    1 = logic       (if, else, for, while, match, switch, case)
//   -1 = i/o         (print, console, log, write, read, fetch)
//   +0 = assignment  (=, :=, +=, -=, *=)
//    0 = neutral     (empty lines, whitespace-only)
//   -0 = comment     (//, #, /*, --, docstrings)
//   +n = modifier    (return, yield, break, continue, throw)
//    n = import      (import, from, use, require, #include)
//   -n = unknown     (anything that doesn't match above)
//
// Compiles to:
//   - Native binary (Tauri sidecar, CLI)
//   - WASM module (web fallback for PWA)
//   - C ABI (FFI for Python/Node/Swift)

use serde::{Deserialize, Serialize};

#[cfg(feature = "ast")]
pub mod ast;

pub mod simd;

/// The 9 quantum prefix symbols
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum PrefixSymbol {
    #[serde(rename = "+1")]
    PlusOne,
    #[serde(rename = "1")]
    One,
    #[serde(rename = "-1")]
    MinusOne,
    #[serde(rename = "+0")]
    PlusZero,
    #[serde(rename = "0")]
    Zero,
    #[serde(rename = "-0")]
    MinusZero,
    #[serde(rename = "+n")]
    PlusN,
    #[serde(rename = "n")]
    N,
    #[serde(rename = "-n")]
    MinusN,
}

impl PrefixSymbol {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::PlusOne => "+1",
            Self::One => "1",
            Self::MinusOne => "-1",
            Self::PlusZero => "+0",
            Self::Zero => "0",
            Self::MinusZero => "-0",
            Self::PlusN => "+n",
            Self::N => "n",
            Self::MinusN => "-n",
        }
    }

    /// 4-bit encoding (0-8) for binary/INT8 optimized storage
    pub fn to_bits(&self) -> u8 {
        match self {
            Self::PlusOne => 0,
            Self::One => 1,
            Self::MinusOne => 2,
            Self::PlusZero => 3,
            Self::Zero => 4,
            Self::MinusZero => 5,
            Self::PlusN => 6,
            Self::N => 7,
            Self::MinusN => 8,
        }
    }

    /// Decode from 4-bit encoding
    pub fn from_bits(bits: u8) -> Self {
        match bits {
            0 => Self::PlusOne,
            1 => Self::One,
            2 => Self::MinusOne,
            3 => Self::PlusZero,
            4 => Self::Zero,
            5 => Self::MinusZero,
            6 => Self::PlusN,
            7 => Self::N,
            _ => Self::MinusN,
        }
    }

    /// 3D coordinate mapping for spatial addressing
    /// Returns (x, y, z) where each axis is -1, 0, or +1
    pub fn to_3d(&self) -> (i8, i8, i8) {
        match self {
            Self::PlusOne => (1, 1, 0),    // +direction, high energy
            Self::One => (0, 1, 0),        // neutral direction, high energy
            Self::MinusOne => (-1, 1, 0),  // -direction, high energy
            Self::PlusZero => (1, 0, 0),   // +direction, zero energy
            Self::Zero => (0, 0, 0),       // origin
            Self::MinusZero => (-1, 0, 0), // -direction, zero energy
            Self::PlusN => (1, -1, 0),     // +direction, negative energy
            Self::N => (0, -1, 0),         // neutral direction, negative energy
            Self::MinusN => (-1, -1, 0),   // -direction, negative energy
        }
    }
}

/// Classification category
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Category {
    Declaration,
    Logic,
    IO,
    Assignment,
    Neutral,
    Comment,
    Modifier,
    Import,
    Unknown,
}

impl Category {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Declaration => "declaration",
            Self::Logic => "logic",
            Self::IO => "io",
            Self::Assignment => "assignment",
            Self::Neutral => "neutral",
            Self::Comment => "comment",
            Self::Modifier => "modifier",
            Self::Import => "import",
            Self::Unknown => "unknown",
        }
    }

    pub fn symbol(&self) -> PrefixSymbol {
        match self {
            Self::Declaration => PrefixSymbol::PlusOne,
            Self::Logic => PrefixSymbol::One,
            Self::IO => PrefixSymbol::MinusOne,
            Self::Assignment => PrefixSymbol::PlusZero,
            Self::Neutral => PrefixSymbol::Zero,
            Self::Comment => PrefixSymbol::MinusZero,
            Self::Modifier => PrefixSymbol::PlusN,
            Self::Import => PrefixSymbol::N,
            Self::Unknown => PrefixSymbol::MinusN,
        }
    }
}

/// Result of classifying a single line
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClassifyResult {
    pub symbol: String,
    pub category: String,
    pub bits: u8,
    pub coords: (i8, i8, i8),
    pub line_num: usize,
}

/// The main prefix classifier
pub struct PrefixClassifier {
    // Feature weights for the 15-feature vector (future: ML-trained)
    _weights: [f32; 15],
}

impl Default for PrefixClassifier {
    fn default() -> Self {
        Self::new()
    }
}

impl PrefixClassifier {
    pub fn new() -> Self {
        Self {
            _weights: [1.0; 15], // uniform weights — placeholder for ML training
        }
    }

    /// Classify a single line of code
    pub fn classify(&self, line: &str) -> (PrefixSymbol, Category) {
        let trimmed = line.trim();

        // Empty / whitespace-only → neutral
        if trimmed.is_empty() {
            return (PrefixSymbol::Zero, Category::Neutral);
        }

        let bytes = trimmed.as_bytes();

        // #include must be checked BEFORE generic # comment detection
        if trimmed.starts_with("#include") || trimmed.starts_with("#import") {
            return (PrefixSymbol::N, Category::Import);
        }

        // Comments — check first character patterns
        if bytes[0] == b'#'
            || (bytes.len() >= 2 && bytes[0] == b'/' && (bytes[1] == b'/' || bytes[1] == b'*'))
            || (bytes.len() >= 2 && bytes[0] == b'-' && bytes[1] == b'-')
            || (bytes.len() >= 3 && bytes[0] == b'\'' && bytes[1] == b'\'' && bytes[2] == b'\'')
            || (bytes.len() >= 3 && bytes[0] == b'"' && bytes[1] == b'"' && bytes[2] == b'"')
            || (bytes.len() >= 2 && bytes[0] == b';' && bytes[1] == b';')
            || (bytes.len() >= 3 && bytes[0] == b'<' && bytes[1] == b'!' && bytes[2] == b'-')
            || trimmed.starts_with("REM ")
        {
            return (PrefixSymbol::MinusZero, Category::Comment);
        }

        // Imports — check keyword prefixes
        if starts_with_keyword(trimmed, "import")
            || starts_with_keyword(trimmed, "from")
            || starts_with_keyword(trimmed, "use")
            || starts_with_keyword(trimmed, "require")
            || trimmed.starts_with("#include")
            || trimmed.starts_with("@import")
            || starts_with_keyword(trimmed, "using")
            || starts_with_keyword(trimmed, "extern")
            || starts_with_keyword(trimmed, "mod")
            || starts_with_keyword(trimmed, "package")
        {
            return (PrefixSymbol::N, Category::Import);
        }

        // Declarations — type/value definitions
        if starts_with_keyword(trimmed, "fn")
            || starts_with_keyword(trimmed, "function")
            || starts_with_keyword(trimmed, "def")
            || starts_with_keyword(trimmed, "class")
            || starts_with_keyword(trimmed, "struct")
            || starts_with_keyword(trimmed, "enum")
            || starts_with_keyword(trimmed, "trait")
            || starts_with_keyword(trimmed, "interface")
            || starts_with_keyword(trimmed, "type")
            || starts_with_keyword(trimmed, "const")
            || starts_with_keyword(trimmed, "let")
            || starts_with_keyword(trimmed, "var")
            || starts_with_keyword(trimmed, "val")
            || starts_with_keyword(trimmed, "static")
            || starts_with_keyword(trimmed, "pub fn")
            || starts_with_keyword(trimmed, "pub struct")
            || starts_with_keyword(trimmed, "pub enum")
            || starts_with_keyword(trimmed, "pub trait")
            || starts_with_keyword(trimmed, "export")
            || starts_with_keyword(trimmed, "async fn")
            || starts_with_keyword(trimmed, "impl")
            || starts_with_keyword(trimmed, "protocol")
            || starts_with_keyword(trimmed, "typedef")
            || starts_with_keyword(trimmed, "macro_rules!")
        {
            return (PrefixSymbol::PlusOne, Category::Declaration);
        }

        // Logic — control flow
        if starts_with_keyword(trimmed, "if")
            || starts_with_keyword(trimmed, "else")
            || starts_with_keyword(trimmed, "elif")
            || starts_with_keyword(trimmed, "for")
            || starts_with_keyword(trimmed, "while")
            || starts_with_keyword(trimmed, "loop")
            || starts_with_keyword(trimmed, "match")
            || starts_with_keyword(trimmed, "switch")
            || starts_with_keyword(trimmed, "case")
            || starts_with_keyword(trimmed, "when")
            || starts_with_keyword(trimmed, "guard")
            || starts_with_keyword(trimmed, "try")
            || starts_with_keyword(trimmed, "catch")
            || starts_with_keyword(trimmed, "except")
            || starts_with_keyword(trimmed, "finally")
            || starts_with_keyword(trimmed, "do")
            || trimmed.starts_with("} else")
        {
            return (PrefixSymbol::One, Category::Logic);
        }

        // Modifiers — flow control
        if starts_with_keyword(trimmed, "return")
            || starts_with_keyword(trimmed, "yield")
            || starts_with_keyword(trimmed, "break")
            || starts_with_keyword(trimmed, "continue")
            || starts_with_keyword(trimmed, "throw")
            || starts_with_keyword(trimmed, "raise")
            || starts_with_keyword(trimmed, "panic!")
            || starts_with_keyword(trimmed, "assert")
            || starts_with_keyword(trimmed, "defer")
            || starts_with_keyword(trimmed, "await")
        {
            return (PrefixSymbol::PlusN, Category::Modifier);
        }

        // I/O — side effects
        if contains_io_pattern(trimmed) {
            return (PrefixSymbol::MinusOne, Category::IO);
        }

        // Assignment — state mutation
        if contains_assignment(trimmed) {
            return (PrefixSymbol::PlusZero, Category::Assignment);
        }

        // Closing braces / brackets alone
        if trimmed == "}"
            || trimmed == "};"
            || trimmed == ")"
            || trimmed == "]"
            || trimmed == "end"
            || trimmed == "fi"
            || trimmed == "done"
            || trimmed == "})"
        {
            return (PrefixSymbol::Zero, Category::Neutral);
        }

        // Unknown — fallback
        (PrefixSymbol::MinusN, Category::Unknown)
    }

    /// Classify a single line and return a structured result
    pub fn classify_line(&self, line: &str, line_num: usize) -> ClassifyResult {
        let (sym, cat) = self.classify(line);
        ClassifyResult {
            symbol: sym.as_str().to_string(),
            category: cat.as_str().to_string(),
            bits: sym.to_bits(),
            coords: sym.to_3d(),
            line_num,
        }
    }

    /// Classify a batch of lines (optimized for large files)
    pub fn classify_batch(&self, source: &str) -> Vec<ClassifyResult> {
        source
            .lines()
            .enumerate()
            .map(|(i, line)| self.classify_line(line, i + 1))
            .collect()
    }

    /// Classify and return compact binary representation
    /// Each line maps to 4 bits (half-byte), packed into bytes
    pub fn classify_binary(&self, source: &str) -> Vec<u8> {
        let results: Vec<u8> = source
            .lines()
            .map(|line| self.classify(line).0.to_bits())
            .collect();

        // Pack two 4-bit values per byte
        let mut packed = Vec::with_capacity(results.len().div_ceil(2));
        for chunk in results.chunks(2) {
            let hi = chunk[0] << 4;
            let lo = if chunk.len() > 1 { chunk[1] } else { 0 };
            packed.push(hi | lo);
        }
        packed
    }

    /// Generate prefix gutter string for display
    pub fn gutter(&self, source: &str) -> Vec<String> {
        source
            .lines()
            .map(|line| {
                let (sym, _) = self.classify(line);
                format!("{:>2}", sym.as_str())
            })
            .collect()
    }
}

// ─── Helper functions ───

#[inline]
fn starts_with_keyword(line: &str, keyword: &str) -> bool {
    if line.len() < keyword.len() {
        return false;
    }
    if !line.starts_with(keyword) {
        return false;
    }
    // Ensure keyword boundary (next char is space, '(', '{', ':', '<', etc.)
    if line.len() == keyword.len() {
        return true;
    }
    let next = line.as_bytes()[keyword.len()];
    matches!(
        next,
        b' ' | b'(' | b'{' | b':' | b'<' | b'[' | b'\t' | b'!' | b'.'
    )
}

#[inline]
fn contains_io_pattern(line: &str) -> bool {
    line.contains("print")
        || line.contains("println")
        || line.contains("console.")
        || line.contains(".log(")
        || line.contains(".warn(")
        || line.contains(".error(")
        || line.contains("write(")
        || line.contains("writeln!")
        || line.contains("read(")
        || line.contains("readline")
        || line.contains("fetch(")
        || line.contains("XMLHttpRequest")
        || line.contains("stdin")
        || line.contains("stdout")
        || line.contains("stderr")
        || line.contains("fs.read")
        || line.contains("fs.write")
        || line.contains("open(")
        || line.contains("socket")
        || line.contains("http.")
}

#[inline]
fn contains_assignment(line: &str) -> bool {
    // Look for assignment operators, excluding == and ===
    let bytes = line.as_bytes();
    for i in 0..bytes.len().saturating_sub(1) {
        if bytes[i] == b'=' {
            // Skip == and ===
            if i > 0 && bytes[i - 1] == b'=' {
                continue;
            }
            if i + 1 < bytes.len() && bytes[i + 1] == b'=' {
                continue;
            }
            // Found a standalone = (or +=, -=, *=, /=, :=, etc.)
            return true;
        }
    }
    false
}

// ─── WASM bindings ───

#[cfg(feature = "wasm")]
mod wasm {
    use super::*;
    use wasm_bindgen::prelude::*;

    #[wasm_bindgen]
    pub struct WasmPrefixClassifier {
        inner: PrefixClassifier,
    }

    #[wasm_bindgen]
    impl WasmPrefixClassifier {
        #[wasm_bindgen(constructor)]
        pub fn new() -> Self {
            Self {
                inner: PrefixClassifier::new(),
            }
        }

        /// Classify a single line, returns JSON string
        #[wasm_bindgen]
        pub fn classify(&self, line: &str) -> String {
            let result = self.inner.classify_line(line, 0);
            serde_json::to_string(&result).unwrap_or_default()
        }

        /// Classify entire source, returns JSON array string
        #[wasm_bindgen]
        pub fn classify_source(&self, source: &str) -> String {
            let results = self.inner.classify_batch(source);
            serde_json::to_string(&results).unwrap_or_default()
        }

        /// Get prefix gutter lines as JSON array
        #[wasm_bindgen]
        pub fn gutter(&self, source: &str) -> String {
            let gutter = self.inner.gutter(source);
            serde_json::to_string(&gutter).unwrap_or_default()
        }

        /// Get binary-packed prefix data as bytes
        #[wasm_bindgen]
        pub fn classify_binary(&self, source: &str) -> Vec<u8> {
            self.inner.classify_binary(source)
        }
    }
}

// ─── C ABI for FFI ───

/// C-compatible classify function
/// Returns category index (0-8) mapping to PrefixSymbol
///
/// # Safety
/// `line_ptr` must point to valid UTF-8 memory of at least `line_len` bytes.
#[no_mangle]
pub unsafe extern "C" fn uvspeed_classify(line_ptr: *const u8, line_len: usize) -> u8 {
    if line_ptr.is_null() {
        return 8;
    } // MinusN
    let line = std::str::from_utf8_unchecked(std::slice::from_raw_parts(line_ptr, line_len));
    let classifier = PrefixClassifier::new();
    let (sym, _) = classifier.classify(line);
    sym.to_bits()
}

// ─── Tests ───

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty_line() {
        let c = PrefixClassifier::new();
        let (sym, cat) = c.classify("");
        assert_eq!(sym, PrefixSymbol::Zero);
        assert_eq!(cat, Category::Neutral);
    }

    #[test]
    fn test_comment() {
        let c = PrefixClassifier::new();
        assert_eq!(c.classify("// hello").0, PrefixSymbol::MinusZero);
        assert_eq!(c.classify("# comment").0, PrefixSymbol::MinusZero);
        assert_eq!(c.classify("/* block */").0, PrefixSymbol::MinusZero);
        assert_eq!(c.classify("-- sql comment").0, PrefixSymbol::MinusZero);
    }

    #[test]
    fn test_import() {
        let c = PrefixClassifier::new();
        assert_eq!(c.classify("import os").0, PrefixSymbol::N);
        assert_eq!(c.classify("from pathlib import Path").0, PrefixSymbol::N);
        assert_eq!(c.classify("use std::io;").0, PrefixSymbol::N);
        assert_eq!(c.classify("require('express')").0, PrefixSymbol::N);
        assert_eq!(c.classify("#include <stdio.h>").0, PrefixSymbol::N);
    }

    #[test]
    fn test_declaration() {
        let c = PrefixClassifier::new();
        assert_eq!(c.classify("fn main() {").0, PrefixSymbol::PlusOne);
        assert_eq!(c.classify("function hello() {").0, PrefixSymbol::PlusOne);
        assert_eq!(c.classify("def process(x):").0, PrefixSymbol::PlusOne);
        assert_eq!(c.classify("class Foo:").0, PrefixSymbol::PlusOne);
        assert_eq!(
            c.classify("struct Point { x: f32, y: f32 }").0,
            PrefixSymbol::PlusOne
        );
        assert_eq!(c.classify("const PI = 3.14;").0, PrefixSymbol::PlusOne);
        assert_eq!(c.classify("let x = 5;").0, PrefixSymbol::PlusOne);
    }

    #[test]
    fn test_logic() {
        let c = PrefixClassifier::new();
        assert_eq!(c.classify("if x > 0 {").0, PrefixSymbol::One);
        assert_eq!(c.classify("else {").0, PrefixSymbol::One);
        assert_eq!(c.classify("for i in range(10):").0, PrefixSymbol::One);
        assert_eq!(c.classify("while running {").0, PrefixSymbol::One);
        assert_eq!(c.classify("match result {").0, PrefixSymbol::One);
    }

    #[test]
    fn test_modifier() {
        let c = PrefixClassifier::new();
        assert_eq!(c.classify("return 42").0, PrefixSymbol::PlusN);
        assert_eq!(c.classify("break").0, PrefixSymbol::PlusN);
        assert_eq!(c.classify("continue").0, PrefixSymbol::PlusN);
        assert_eq!(c.classify("yield value").0, PrefixSymbol::PlusN);
    }

    #[test]
    fn test_io() {
        let c = PrefixClassifier::new();
        assert_eq!(c.classify("print('hello')").0, PrefixSymbol::MinusOne);
        assert_eq!(c.classify("console.log(x)").0, PrefixSymbol::MinusOne);
        assert_eq!(
            c.classify("fs.readFile('data.txt')").0,
            PrefixSymbol::MinusOne
        );
    }

    #[test]
    fn test_assignment() {
        let c = PrefixClassifier::new();
        assert_eq!(c.classify("x = 42").0, PrefixSymbol::PlusZero);
        assert_eq!(c.classify("count += 1").0, PrefixSymbol::PlusZero);
        assert_eq!(c.classify("name := 'test'").0, PrefixSymbol::PlusZero);
    }

    #[test]
    fn test_batch() {
        let c = PrefixClassifier::new();
        let source = "import os\n\ndef main():\n    print('hello')\n    x = 42\n    return x\n";
        let results = c.classify_batch(source);
        assert_eq!(results.len(), 6);
        assert_eq!(results[0].symbol, "n"); // import
        assert_eq!(results[1].symbol, "0"); // empty
        assert_eq!(results[2].symbol, "+1"); // def
        assert_eq!(results[3].symbol, "-1"); // print
        assert_eq!(results[4].symbol, "+0"); // assignment
        assert_eq!(results[5].symbol, "+n"); // return
    }

    #[test]
    fn test_binary_packing() {
        let c = PrefixClassifier::new();
        let source = "import os\n\n";
        let packed = c.classify_binary(source);
        assert_eq!(packed.len(), 1); // 2 lines → 1 byte
                                     // import (7=n) in high nibble, empty (4=0) in low nibble
        assert_eq!(packed[0], (7 << 4) | 4);
    }

    #[test]
    fn test_3d_coordinates() {
        // Verify all 9 symbols have unique 3D coords
        let symbols = [
            PrefixSymbol::PlusOne,
            PrefixSymbol::One,
            PrefixSymbol::MinusOne,
            PrefixSymbol::PlusZero,
            PrefixSymbol::Zero,
            PrefixSymbol::MinusZero,
            PrefixSymbol::PlusN,
            PrefixSymbol::N,
            PrefixSymbol::MinusN,
        ];
        let coords: Vec<_> = symbols.iter().map(|s| s.to_3d()).collect();
        for i in 0..coords.len() {
            for j in (i + 1)..coords.len() {
                assert_ne!(
                    coords[i], coords[j],
                    "Duplicate 3D coord: {:?} and {:?}",
                    symbols[i], symbols[j]
                );
            }
        }
    }

    #[test]
    fn test_bits_roundtrip() {
        for i in 0..=8u8 {
            let sym = PrefixSymbol::from_bits(i);
            assert_eq!(sym.to_bits(), i);
        }
    }
}
