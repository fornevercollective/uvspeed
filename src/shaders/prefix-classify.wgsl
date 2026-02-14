// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
// WGSL Compute Shader — GPU-accelerated quantum prefix classification
//
// Maps code lines to the 9-symbol prefix system using parallel GPU threads.
// Each workgroup processes a batch of lines simultaneously.
//
// Symbol encoding (4-bit):
//   0 = +1 (declaration)    1 = 1  (logic)      2 = -1 (io)
//   3 = +0 (assignment)     4 = 0  (neutral)    5 = -0 (comment)
//   6 = +n (modifier)       7 = n  (import)     8 = -n (unknown)

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Bindings
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

struct Params {
  line_count:    u32,     // Total number of lines
  max_line_len:  u32,     // Maximum characters per line
  _pad0:         u32,
  _pad1:         u32,
}

@group(0) @binding(0) var<uniform>          params:    Params;
@group(0) @binding(1) var<storage, read>    source:    array<u32>;   // UTF-32 source chars, line_count × max_line_len
@group(0) @binding(2) var<storage, read>    line_lens: array<u32>;   // Actual length of each line
@group(0) @binding(3) var<storage, read_write> output: array<u32>;   // 4-bit packed prefixes (2 per u32 element)

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Constants — ASCII patterns
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const SPACE:   u32 = 0x20u;
const TAB:     u32 = 0x09u;
const HASH:    u32 = 0x23u;  // #
const SLASH:   u32 = 0x2Fu;  // /
const STAR:    u32 = 0x2Au;  // *
const DASH:    u32 = 0x2Du;  // -
const EQUALS:  u32 = 0x3Du;  // =

// Prefix symbol constants
const SYM_DECLARATION: u32 = 0u;  // +1
const SYM_LOGIC:       u32 = 1u;  // 1
const SYM_IO:          u32 = 2u;  // -1
const SYM_ASSIGNMENT:  u32 = 3u;  // +0
const SYM_NEUTRAL:     u32 = 4u;  // 0
const SYM_COMMENT:     u32 = 5u;  // -0
const SYM_MODIFIER:    u32 = 6u;  // +n
const SYM_IMPORT:      u32 = 7u;  // n
const SYM_UNKNOWN:     u32 = 8u;  // -n

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helper: read character at (line, col)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

fn char_at(line_idx: u32, col: u32) -> u32 {
  let offset = line_idx * params.max_line_len + col;
  return source[offset];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helper: skip leading whitespace, return first non-ws column
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

fn skip_ws(line_idx: u32, len: u32) -> u32 {
  var col: u32 = 0u;
  loop {
    if col >= len { break; }
    let c = char_at(line_idx, col);
    if c != SPACE && c != TAB { break; }
    col = col + 1u;
  }
  return col;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helper: check if line starts with keyword at given column
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

fn matches_keyword(line_idx: u32, col: u32, len: u32, k0: u32, k1: u32, k2: u32, klen: u32) -> bool {
  if col + klen > len { return false; }
  if char_at(line_idx, col) != k0 { return false; }
  if klen >= 2u && char_at(line_idx, col + 1u) != k1 { return false; }
  if klen >= 3u && char_at(line_idx, col + 2u) != k2 { return false; }
  // Check word boundary
  if col + klen < len {
    let next = char_at(line_idx, col + klen);
    if next != SPACE && next != 0x28u && next != 0x7Bu && next != 0x3Au { // ( { :
      return false;
    }
  }
  return true;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Main classifier — one invocation per line
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

fn classify_line(line_idx: u32) -> u32 {
  let len = line_lens[line_idx];

  // Empty line → neutral
  if len == 0u { return SYM_NEUTRAL; }

  let start = skip_ws(line_idx, len);
  if start >= len { return SYM_NEUTRAL; }

  let c0 = char_at(line_idx, start);

  // Comment detection: #, //, /*, --
  if c0 == HASH { return SYM_COMMENT; }
  if c0 == SLASH && start + 1u < len {
    let c1 = char_at(line_idx, start + 1u);
    if c1 == SLASH || c1 == STAR { return SYM_COMMENT; }
  }
  if c0 == DASH && start + 1u < len && char_at(line_idx, start + 1u) == DASH {
    return SYM_COMMENT;
  }

  // Import: 'i' 'm' for "import", 'f' 'r' for "from", 'u' 's' for "use"
  if matches_keyword(line_idx, start, len, 0x69u, 0x6Du, 0x70u, 6u) { return SYM_IMPORT; }  // import
  if matches_keyword(line_idx, start, len, 0x66u, 0x72u, 0x6Fu, 4u) { return SYM_IMPORT; }  // from
  if matches_keyword(line_idx, start, len, 0x75u, 0x73u, 0x65u, 3u) { return SYM_IMPORT; }  // use

  // Declaration: fn, def, class, struct
  if matches_keyword(line_idx, start, len, 0x66u, 0x6Eu, 0x00u, 2u) { return SYM_DECLARATION; }  // fn
  if matches_keyword(line_idx, start, len, 0x64u, 0x65u, 0x66u, 3u) { return SYM_DECLARATION; }  // def
  if matches_keyword(line_idx, start, len, 0x63u, 0x6Cu, 0x61u, 5u) { return SYM_DECLARATION; }  // class

  // Logic: if, for, while
  if matches_keyword(line_idx, start, len, 0x69u, 0x66u, 0x00u, 2u) { return SYM_LOGIC; }  // if
  if matches_keyword(line_idx, start, len, 0x66u, 0x6Fu, 0x72u, 3u) { return SYM_LOGIC; }  // for

  // Return
  if matches_keyword(line_idx, start, len, 0x72u, 0x65u, 0x74u, 6u) { return SYM_MODIFIER; }  // return

  // Assignment: scan for ' = '
  var i: u32 = start;
  loop {
    if i + 2u >= len { break; }
    if char_at(line_idx, i) == SPACE && char_at(line_idx, i + 1u) == EQUALS && char_at(line_idx, i + 2u) == SPACE {
      return SYM_ASSIGNMENT;
    }
    i = i + 1u;
  }

  return SYM_UNKNOWN;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Compute entry point — 256 threads per workgroup
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@compute @workgroup_size(256)
fn main_classify(@builtin(global_invocation_id) gid: vec3<u32>) {
  let line_idx = gid.x;
  if line_idx >= params.line_count { return; }

  let sym = classify_line(line_idx);

  // Pack two 4-bit symbols per u32 element
  let pack_idx = line_idx / 8u;     // 8 symbols per u32 (4 bits each)
  let bit_offset = (line_idx % 8u) * 4u;

  // Atomic OR to avoid race conditions between threads
  let mask = sym << bit_offset;
  atomicOr(&output[pack_idx], mask);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Statistics pass — count prefix distribution
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

@group(0) @binding(4) var<storage, read_write> counts: array<atomic<u32>, 9>;

@compute @workgroup_size(256)
fn main_stats(@builtin(global_invocation_id) gid: vec3<u32>) {
  let line_idx = gid.x;
  if line_idx >= params.line_count { return; }

  let sym = classify_line(line_idx);
  atomicAdd(&counts[sym], 1u);
}
