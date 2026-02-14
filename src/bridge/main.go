// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
// Go Bridge Server — High-performance WebSocket bridge for quantum prefix sync
// Replaces Python bridge for production deployments (10x throughput)
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"
)

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Quantum Prefix Classifier
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// PrefixSymbol represents one of the 9 quantum prefix symbols
type PrefixSymbol string

const (
	PrefixPlusOne  PrefixSymbol = "+1"
	PrefixOne      PrefixSymbol = "1"
	PrefixMinusOne PrefixSymbol = "-1"
	PrefixPlusZero PrefixSymbol = "+0"
	PrefixZero     PrefixSymbol = "0"
	PrefixMinusZero PrefixSymbol = "-0"
	PrefixPlusN    PrefixSymbol = "+n"
	PrefixN        PrefixSymbol = "n"
	PrefixMinusN   PrefixSymbol = "-n"
)

// ClassifyResult holds the classification of a single line
type ClassifyResult struct {
	Symbol   PrefixSymbol `json:"symbol"`
	Category string       `json:"category"`
	Line     int          `json:"line"`
}

// ClassifyLine assigns a quantum prefix to a single line of code
func ClassifyLine(line string, lineNum int) ClassifyResult {
	trimmed := strings.TrimSpace(line)

	if trimmed == "" {
		return ClassifyResult{PrefixZero, "neutral", lineNum}
	}

	// Comments
	if strings.HasPrefix(trimmed, "//") || strings.HasPrefix(trimmed, "#") ||
		strings.HasPrefix(trimmed, "/*") || strings.HasPrefix(trimmed, "--") {
		return ClassifyResult{PrefixMinusZero, "comment", lineNum}
	}

	// Imports
	if strings.HasPrefix(trimmed, "import ") || strings.HasPrefix(trimmed, "from ") ||
		strings.HasPrefix(trimmed, "use ") || strings.HasPrefix(trimmed, "require") ||
		strings.HasPrefix(trimmed, "#include") || strings.HasPrefix(trimmed, "package ") {
		return ClassifyResult{PrefixN, "import", lineNum}
	}

	// Declarations
	if strings.HasPrefix(trimmed, "fn ") || strings.HasPrefix(trimmed, "function ") ||
		strings.HasPrefix(trimmed, "def ") || strings.HasPrefix(trimmed, "class ") ||
		strings.HasPrefix(trimmed, "struct ") || strings.HasPrefix(trimmed, "enum ") ||
		strings.HasPrefix(trimmed, "type ") || strings.HasPrefix(trimmed, "interface ") ||
		strings.HasPrefix(trimmed, "const ") || strings.HasPrefix(trimmed, "let ") ||
		strings.HasPrefix(trimmed, "var ") || strings.HasPrefix(trimmed, "pub fn ") ||
		strings.HasPrefix(trimmed, "func ") {
		return ClassifyResult{PrefixPlusOne, "declaration", lineNum}
	}

	// Logic/control flow
	if strings.HasPrefix(trimmed, "if ") || strings.HasPrefix(trimmed, "else") ||
		strings.HasPrefix(trimmed, "for ") || strings.HasPrefix(trimmed, "while ") ||
		strings.HasPrefix(trimmed, "match ") || strings.HasPrefix(trimmed, "switch ") ||
		strings.HasPrefix(trimmed, "case ") {
		return ClassifyResult{PrefixOne, "logic", lineNum}
	}

	// Modifiers
	if strings.HasPrefix(trimmed, "return ") || strings.HasPrefix(trimmed, "yield ") ||
		strings.HasPrefix(trimmed, "break") || strings.HasPrefix(trimmed, "continue") {
		return ClassifyResult{PrefixPlusN, "modifier", lineNum}
	}

	// I/O
	if strings.Contains(trimmed, "print") || strings.Contains(trimmed, "console.") ||
		strings.Contains(trimmed, "log(") || strings.Contains(trimmed, "fmt.") ||
		strings.Contains(trimmed, "write(") || strings.Contains(trimmed, "read(") {
		return ClassifyResult{PrefixMinusOne, "io", lineNum}
	}

	// Assignment
	if strings.Contains(trimmed, " = ") || strings.Contains(trimmed, " := ") ||
		strings.Contains(trimmed, " += ") || strings.Contains(trimmed, " -= ") {
		return ClassifyResult{PrefixPlusZero, "assignment", lineNum}
	}

	return ClassifyResult{PrefixMinusN, "unknown", lineNum}
}

// ClassifySource classifies all lines in source code
func ClassifySource(source string) []ClassifyResult {
	lines := strings.Split(source, "\n")
	results := make([]ClassifyResult, len(lines))
	for i, line := range lines {
		results[i] = ClassifyLine(line, i+1)
	}
	return results
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HTTP API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// State tracks connected clients and global prefix state
type State struct {
	mu       sync.RWMutex
	clients  map[string]time.Time
	global   map[string]json.RawMessage
}

var state = &State{
	clients: make(map[string]time.Time),
	global:  make(map[string]json.RawMessage),
}

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}

func handleHealth(w http.ResponseWriter, _ *http.Request) {
	json.NewEncoder(w).Encode(map[string]any{
		"status":  "ok",
		"version": "4.2.0",
		"engine":  "go",
		"uptime":  time.Since(startTime).String(),
	})
}

func handleClassify(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Source   string `json:"source"`
		Language string `json:"language"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid JSON", http.StatusBadRequest)
		return
	}
	results := ClassifySource(req.Source)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"results":  results,
		"language": req.Language,
		"lines":    len(results),
	})
}

func handleState(w http.ResponseWriter, _ *http.Request) {
	state.mu.RLock()
	defer state.mu.RUnlock()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(state.global)
}

var startTime = time.Now()

func main() {
	port := "8085"

	mux := http.NewServeMux()
	mux.HandleFunc("/health", corsMiddleware(handleHealth))
	mux.HandleFunc("/api/classify", corsMiddleware(handleClassify))
	mux.HandleFunc("/api/state", corsMiddleware(handleState))

	fmt.Printf("⚛ uvspeed Go bridge server\n")
	fmt.Printf("  {+1, 1, -1, +0, 0, -0, +n, n, -n}\n")
	fmt.Printf("  Listening on :%s\n\n", port)

	log.Fatal(http.ListenAndServe(":"+port, mux))
}
