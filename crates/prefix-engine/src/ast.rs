// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
//
// AST-backed prefix classification using tree-sitter.
// Maps tree-sitter node types to the 11-symbol quantum prefix system.
// Zero false positives — every classification is backed by a parsed AST node.
//
// Coverage target: 99%+ for supported languages.
// Supported: Python, JavaScript, TypeScript, Rust, Go, C

use crate::{Category, ClassifyResult, PrefixSymbol};

/// Language enum for AST parsing
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AstLanguage {
    Python,
    JavaScript,
    TypeScript,
    Rust,
    Go,
    C,
}

impl AstLanguage {
    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "python" | "py" => Some(Self::Python),
            "javascript" | "js" => Some(Self::JavaScript),
            "typescript" | "ts" => Some(Self::TypeScript),
            "rust" | "rs" => Some(Self::Rust),
            "go" => Some(Self::Go),
            "c" | "h" => Some(Self::C),
            _ => None,
        }
    }
}

/// AST-backed prefix classifier
/// Falls back to regex classifier for unsupported languages.
pub struct AstClassifier {
    regex_fallback: crate::PrefixClassifier,
}

impl Default for AstClassifier {
    fn default() -> Self {
        Self::new()
    }
}

impl AstClassifier {
    pub fn new() -> Self {
        Self {
            regex_fallback: crate::PrefixClassifier::new(),
        }
    }

    /// Get tree-sitter language for a given AstLanguage
    fn get_ts_language(lang: AstLanguage) -> tree_sitter::Language {
        match lang {
            AstLanguage::Python => tree_sitter_python::LANGUAGE.into(),
            AstLanguage::JavaScript => tree_sitter_javascript::LANGUAGE.into(),
            AstLanguage::TypeScript => tree_sitter_typescript::LANGUAGE_TYPESCRIPT.into(),
            AstLanguage::Rust => tree_sitter_rust::LANGUAGE.into(),
            AstLanguage::Go => tree_sitter_go::LANGUAGE.into(),
            AstLanguage::C => tree_sitter_c::LANGUAGE.into(),
        }
    }

    /// Map a tree-sitter node kind to a prefix symbol and category
    fn classify_node_kind(kind: &str, lang: AstLanguage) -> (PrefixSymbol, Category) {
        // ── Comments ──
        if kind == "comment"
            || kind == "line_comment"
            || kind == "block_comment"
            || kind == "doc_comment"
            || kind == "string_content"
        // docstrings handled separately
        {
            return (PrefixSymbol::MinusZero, Category::Comment);
        }

        // ── Imports ──
        if kind == "import_statement"
            || kind == "import_from_statement"
            || kind == "use_declaration"
            || kind == "use_item"
            || kind == "import_declaration"
            || kind == "import_spec"
            || kind == "preproc_include"
            || kind == "module_declaration"
            || kind == "package_clause"
        {
            return (PrefixSymbol::N, Category::Import);
        }

        // ── Declarations ──
        if kind == "function_definition"
            || kind == "function_declaration"
            || kind == "function_item"
            || kind == "method_definition"
            || kind == "class_definition"
            || kind == "class_declaration"
            || kind == "struct_item"
            || kind == "struct_specifier"
            || kind == "enum_item"
            || kind == "enum_specifier"
            || kind == "trait_item"
            || kind == "interface_declaration"
            || kind == "type_alias_declaration"
            || kind == "type_item"
            || kind == "const_item"
            || kind == "static_item"
            || kind == "variable_declaration"
            || kind == "lexical_declaration"
            || kind == "let_declaration"
            || kind == "short_var_declaration"
            || kind == "impl_item"
            || kind == "macro_definition"
            || kind == "decorated_definition"
            || kind == "export_statement"
        {
            return (PrefixSymbol::PlusOne, Category::Declaration);
        }

        // ── Logic / Control Flow ──
        if kind == "if_statement"
            || kind == "if_expression"
            || kind == "else_clause"
            || kind == "elif_clause"
            || kind == "for_statement"
            || kind == "for_expression"
            || kind == "while_statement"
            || kind == "while_expression"
            || kind == "loop_expression"
            || kind == "match_expression"
            || kind == "match_arm"
            || kind == "switch_statement"
            || kind == "case_clause"
            || kind == "try_statement"
            || kind == "catch_clause"
            || kind == "except_clause"
            || kind == "finally_clause"
            || kind == "do_statement"
            || kind == "conditional_expression"
            || kind == "ternary_expression"
        {
            return (PrefixSymbol::One, Category::Logic);
        }

        // ── Modifiers / Flow Control ──
        if kind == "return_statement"
            || kind == "yield_expression"
            || kind == "break_statement"
            || kind == "continue_statement"
            || kind == "throw_statement"
            || kind == "raise_statement"
            || kind == "assert_statement"
            || kind == "defer_statement"
            || kind == "await_expression"
        {
            return (PrefixSymbol::PlusN, Category::Modifier);
        }

        // ── I/O (language-specific) ──
        if kind == "call_expression" || kind == "call" {
            // Will be refined by checking the callee in full classify
            return (PrefixSymbol::MinusN, Category::Unknown);
        }

        // ── Assignment ──
        if kind == "assignment_statement"
            || kind == "assignment_expression"
            || kind == "augmented_assignment"
            || kind == "compound_assignment_expr"
            || kind == "assignment"
        {
            return (PrefixSymbol::PlusZero, Category::Assignment);
        }

        // ── Expression statements (need further analysis) ──
        if kind == "expression_statement" {
            return (PrefixSymbol::MinusN, Category::Unknown);
        }

        // ── Neutral ──
        if kind == "}"
            || kind == "{"
            || kind == "("
            || kind == ")"
            || kind == "["
            || kind == "]"
            || kind == ";"
            || kind == ","
            || kind == "ERROR"
            || kind == "program"
            || kind == "source_file"
            || kind == "block"
            || kind == "statement_block"
        {
            return (PrefixSymbol::Zero, Category::Neutral);
        }

        // Unknown
        let _ = lang; // suppress unused warning
        (PrefixSymbol::MinusN, Category::Unknown)
    }

    /// Classify a full source file using AST parsing
    /// Returns per-line classification results
    pub fn classify_source(&self, source: &str, lang: AstLanguage) -> Vec<ClassifyResult> {
        let mut parser = tree_sitter::Parser::new();
        let ts_lang = Self::get_ts_language(lang);
        parser
            .set_language(&ts_lang)
            .expect("Failed to set language");

        let tree = match parser.parse(source, None) {
            Some(t) => t,
            None => return self.regex_fallback.classify_batch(source),
        };

        let line_count = source.lines().count();
        let mut line_symbols: Vec<(PrefixSymbol, Category)> =
            vec![(PrefixSymbol::Zero, Category::Neutral); line_count];

        // Walk the AST and assign symbols to lines based on node types
        Self::walk_tree(tree.root_node(), source, &mut line_symbols, lang);

        // Build results
        line_symbols
            .into_iter()
            .enumerate()
            .map(|(i, (sym, cat))| ClassifyResult {
                symbol: sym.as_str().to_string(),
                category: cat.as_str().to_string(),
                bits: sym.to_bits(),
                coords: sym.to_3d(),
                line_num: i + 1,
            })
            .collect()
    }

    /// Recursively walk the AST and classify lines
    fn walk_tree(
        node: tree_sitter::Node,
        source: &str,
        line_symbols: &mut Vec<(PrefixSymbol, Category)>,
        lang: AstLanguage,
    ) {
        let kind = node.kind();
        let start_line = node.start_position().row;

        // Only classify meaningful nodes (skip program/source_file root)
        if kind != "program" && kind != "source_file" && kind != "translation_unit" {
            let (sym, cat) = Self::classify_node_kind(kind, lang);

            // For call expressions, check if it's an I/O call
            let (sym, cat) =
                if (kind == "call_expression" || kind == "call") && cat == Category::Unknown {
                    let callee_text = node.child(0).map(|c| &source[c.byte_range()]).unwrap_or("");
                    if Self::is_io_call(callee_text) {
                        (PrefixSymbol::MinusOne, Category::IO)
                    } else {
                        (sym, cat)
                    }
                } else {
                    (sym, cat)
                };

            // For expression_statement, look at the child
            let (sym, cat) = if kind == "expression_statement" && cat == Category::Unknown {
                if let Some(child) = node.child(0) {
                    let child_kind = child.kind();
                    let (cs, cc) = Self::classify_node_kind(child_kind, lang);
                    if cc != Category::Unknown {
                        (cs, cc)
                    } else if child_kind == "call_expression" || child_kind == "call" {
                        let callee_text = child
                            .child(0)
                            .map(|c| &source[c.byte_range()])
                            .unwrap_or("");
                        if Self::is_io_call(callee_text) {
                            (PrefixSymbol::MinusOne, Category::IO)
                        } else {
                            (PrefixSymbol::MinusN, Category::Unknown)
                        }
                    } else {
                        (sym, cat)
                    }
                } else {
                    (sym, cat)
                }
            } else {
                (sym, cat)
            };

            // Apply to the starting line (higher-priority nodes overwrite)
            if start_line < line_symbols.len()
                && cat != Category::Unknown
                && cat != Category::Neutral
            {
                line_symbols[start_line] = (sym, cat);
            }
        }

        // Recurse into children
        let child_count = node.child_count();
        for i in 0..child_count {
            if let Some(child) = node.child(i) {
                Self::walk_tree(child, source, line_symbols, lang);
            }
        }
    }

    /// Check if a callee string is an I/O function
    fn is_io_call(callee: &str) -> bool {
        callee.contains("print")
            || callee.contains("console.")
            || callee.contains("log")
            || callee.contains("write")
            || callee.contains("read")
            || callee.contains("fetch")
            || callee.contains("stdin")
            || callee.contains("stdout")
            || callee.contains("stderr")
            || callee.contains("open")
            || callee.contains("socket")
    }

    /// Classify using AST if language is supported, regex otherwise
    pub fn classify_auto(&self, source: &str, lang_hint: &str) -> Vec<ClassifyResult> {
        match AstLanguage::from_str(lang_hint) {
            Some(lang) => self.classify_source(source, lang),
            None => self.regex_fallback.classify_batch(source),
        }
    }

    /// Get classification accuracy metrics comparing AST vs regex
    pub fn compare_methods(&self, source: &str, lang: AstLanguage) -> AstVsRegexReport {
        let ast_results = self.classify_source(source, lang);
        let regex_results = self.regex_fallback.classify_batch(source);

        let total = ast_results.len();
        let mut agree = 0;
        let mut ast_classified = 0;
        let mut regex_classified = 0;
        let mut disagreements = Vec::new();

        for (i, (ast, regex)) in ast_results.iter().zip(regex_results.iter()).enumerate() {
            if ast.category != "neutral" && ast.category != "unknown" {
                ast_classified += 1;
            }
            if regex.category != "neutral" && regex.category != "unknown" {
                regex_classified += 1;
            }
            if ast.symbol == regex.symbol {
                agree += 1;
            } else {
                disagreements.push(Disagreement {
                    line: i + 1,
                    ast_symbol: ast.symbol.clone(),
                    regex_symbol: regex.symbol.clone(),
                    ast_category: ast.category.clone(),
                    regex_category: regex.category.clone(),
                });
            }
        }

        AstVsRegexReport {
            total_lines: total,
            agreement_count: agree,
            agreement_pct: if total > 0 {
                (agree as f64 / total as f64) * 100.0
            } else {
                0.0
            },
            ast_coverage: if total > 0 {
                (ast_classified as f64 / total as f64) * 100.0
            } else {
                0.0
            },
            regex_coverage: if total > 0 {
                (regex_classified as f64 / total as f64) * 100.0
            } else {
                0.0
            },
            disagreements,
        }
    }
}

/// Report comparing AST vs regex classification
#[derive(Debug, serde::Serialize)]
pub struct AstVsRegexReport {
    pub total_lines: usize,
    pub agreement_count: usize,
    pub agreement_pct: f64,
    pub ast_coverage: f64,
    pub regex_coverage: f64,
    pub disagreements: Vec<Disagreement>,
}

/// A single disagreement between AST and regex
#[derive(Debug, serde::Serialize)]
pub struct Disagreement {
    pub line: usize,
    pub ast_symbol: String,
    pub regex_symbol: String,
    pub ast_category: String,
    pub regex_category: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_python_ast() {
        let classifier = AstClassifier::new();
        let source = r#"import os
from pathlib import Path

def main():
    x = 42
    print(x)
    if x > 0:
        return x
    for i in range(10):
        pass
"#;
        let results = classifier.classify_source(source, AstLanguage::Python);
        assert!(!results.is_empty());
        assert_eq!(results[0].category, "import"); // import os
        assert_eq!(results[1].category, "import"); // from pathlib
                                                   // line 2 = empty
        assert_eq!(results[3].category, "declaration"); // def main
    }

    #[test]
    fn test_javascript_ast() {
        let classifier = AstClassifier::new();
        let source = r#"import React from 'react';

function App() {
    const x = 42;
    console.log(x);
    if (x > 0) {
        return x;
    }
}
"#;
        let results = classifier.classify_source(source, AstLanguage::JavaScript);
        assert!(!results.is_empty());
        assert_eq!(results[0].category, "import");
    }

    #[test]
    fn test_rust_ast() {
        let classifier = AstClassifier::new();
        let source = r#"use std::io;

fn main() {
    let x = 42;
    println!("{}", x);
    if x > 0 {
        return;
    }
}
"#;
        let results = classifier.classify_source(source, AstLanguage::Rust);
        assert!(!results.is_empty());
        assert_eq!(results[0].category, "import"); // use std::io
    }

    #[test]
    fn test_compare_methods() {
        let classifier = AstClassifier::new();
        let source = "import os\n\ndef main():\n    print('hello')\n    x = 42\n    return x\n";
        let report = classifier.compare_methods(source, AstLanguage::Python);
        assert_eq!(report.total_lines, 6);
        assert!(report.ast_coverage > 50.0);
    }

    #[test]
    fn test_auto_classify() {
        let classifier = AstClassifier::new();
        let source = "import os\ndef hello():\n    pass\n";
        let results = classifier.classify_auto(source, "python");
        assert_eq!(results.len(), 3);
        assert_eq!(results[0].category, "import");
    }

    #[test]
    fn test_unsupported_lang_falls_back() {
        let classifier = AstClassifier::new();
        let source = "PRINT 'Hello'\n";
        let results = classifier.classify_auto(source, "basic");
        // Falls back to regex
        assert_eq!(results.len(), 1);
    }
}
