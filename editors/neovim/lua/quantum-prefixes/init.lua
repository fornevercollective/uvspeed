-- beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
--
-- Neovim Plugin: Quantum Prefix Gutter
-- Renders the 9-symbol prefix system as virtual text in the sign column.
--
-- Install: add to your lazy.nvim/packer config:
--   { dir = "~/dev/uvspeed/editors/neovim" }
--
-- Usage:
--   :QuantumPrefixToggle    - toggle gutter on/off
--   :QuantumPrefixClassify  - show classification stats
--   :QuantumPrefixExport    - export prefixed file

local M = {}
local ns = vim.api.nvim_create_namespace("quantum-prefixes")
local enabled = true

-- Symbol definitions with highlight groups
local SYMBOLS = {
    ["+1"] = { hl = "QpDeclaration", color = "#7ee787", cat = "declaration" },
    ["1"]  = { hl = "QpLogic",       color = "#79c0ff", cat = "logic" },
    ["-1"] = { hl = "QpIO",          color = "#ff7b72", cat = "io" },
    ["+0"] = { hl = "QpAssignment",  color = "#d2a8ff", cat = "assignment" },
    ["0"]  = { hl = "QpNeutral",     color = "#484f58", cat = "neutral" },
    ["-0"] = { hl = "QpComment",     color = "#8b949e", cat = "comment" },
    ["+n"] = { hl = "QpModifier",    color = "#f0d852", cat = "modifier" },
    ["n"]  = { hl = "QpImport",      color = "#f0883e", cat = "import" },
    ["-n"] = { hl = "QpUnknown",     color = "#6e7681", cat = "unknown" },
}

-- Create highlight groups
local function setup_highlights()
    for sym, info in pairs(SYMBOLS) do
        vim.api.nvim_set_hl(0, info.hl, { fg = info.color, bold = true })
    end
end

-- Keyword patterns for classification
local IMPORT_KW = { "import", "from", "use", "require", "using", "extern", "mod", "package", "#include" }
local DECL_KW = { "fn", "function", "def", "class", "struct", "enum", "trait", "interface", "type", "const", "let", "var", "val", "static", "impl", "export", "pub fn", "pub struct", "async fn" }
local LOGIC_KW = { "if", "else", "elif", "for", "while", "loop", "match", "switch", "case", "try", "catch", "except", "finally", "do" }
local MOD_KW = { "return", "yield", "break", "continue", "throw", "raise", "defer", "await" }

local function starts_with_keyword(line, keywords)
    for _, kw in ipairs(keywords) do
        if line:sub(1, #kw) == kw then
            if #line == #kw or line:sub(#kw + 1, #kw + 1):match("[%s%({\t:<[!.]") then
                return true
            end
        end
    end
    return false
end

-- Classify a single line
function M.classify_line(line)
    local trimmed = line:match("^%s*(.-)%s*$") or ""

    if trimmed == "" then return "0", "neutral" end

    -- Comments
    if trimmed:sub(1, 2) == "//" or trimmed:sub(1, 1) == "#" or trimmed:sub(1, 2) == "/*"
        or trimmed:sub(1, 2) == "--" or trimmed:sub(1, 4) == "<!--" then
        return "-0", "comment"
    end

    -- Imports
    if starts_with_keyword(trimmed, IMPORT_KW) then return "n", "import" end

    -- Declarations
    if starts_with_keyword(trimmed, DECL_KW) then return "+1", "declaration" end

    -- Logic
    if starts_with_keyword(trimmed, LOGIC_KW) or trimmed:sub(1, 6) == "} else" then
        return "1", "logic"
    end

    -- Modifiers
    if starts_with_keyword(trimmed, MOD_KW) then return "+n", "modifier" end

    -- I/O patterns
    local io_patterns = { "print", "console%.", "%.log%(", "%.warn%(", "%.error%(", "write%(", "read%(", "fetch%(", "stdin", "stdout", "stderr" }
    for _, p in ipairs(io_patterns) do
        if trimmed:find(p) then return "-1", "io" end
    end

    -- Assignment
    if trimmed:find("[^=]=[^=]") then return "+0", "assignment" end

    -- Closing
    if trimmed == "}" or trimmed == "};" or trimmed == ")" or trimmed == "]"
        or trimmed == "end" or trimmed == "fi" or trimmed == "done" then
        return "0", "neutral"
    end

    return "-n", "unknown"
end

-- Update gutter for current buffer
function M.update_gutter(bufnr)
    bufnr = bufnr or vim.api.nvim_get_current_buf()
    if not enabled then
        vim.api.nvim_buf_clear_namespace(bufnr, ns, 0, -1)
        return
    end

    local lines = vim.api.nvim_buf_get_lines(bufnr, 0, -1, false)
    vim.api.nvim_buf_clear_namespace(bufnr, ns, 0, -1)

    for i, line in ipairs(lines) do
        local sym, _ = M.classify_line(line)
        local info = SYMBOLS[sym]
        if info then
            vim.api.nvim_buf_set_extmark(bufnr, ns, i - 1, 0, {
                virt_text = { { string.format("%2s", sym), info.hl } },
                virt_text_pos = "right_align",
                hl_mode = "combine",
            })
        end
    end
end

-- Toggle on/off
function M.toggle()
    enabled = not enabled
    if enabled then
        M.update_gutter()
        vim.notify("⚛ Quantum Prefixes: Enabled", vim.log.levels.INFO)
    else
        vim.api.nvim_buf_clear_namespace(0, ns, 0, -1)
        vim.notify("⚛ Quantum Prefixes: Disabled", vim.log.levels.INFO)
    end
end

-- Show classification stats
function M.classify_stats()
    local lines = vim.api.nvim_buf_get_lines(0, 0, -1, false)
    local counts = {}
    local classified = 0
    for _, line in ipairs(lines) do
        local sym, cat = M.classify_line(line)
        counts[sym] = (counts[sym] or 0) + 1
        if cat ~= "neutral" and cat ~= "unknown" then classified = classified + 1 end
    end
    local total = #lines
    local pct = total > 0 and math.floor((classified / total) * 100) or 0
    local parts = {}
    for sym, count in pairs(counts) do
        table.insert(parts, string.format("%s:%d", sym, count))
    end
    vim.notify(string.format("⚛ %s: %d/%d lines (%d%%) — %s",
        vim.fn.expand("%:t"), classified, total, pct, table.concat(parts, " | ")),
        vim.log.levels.INFO)
end

-- Setup
function M.setup(opts)
    opts = opts or {}
    setup_highlights()

    -- Auto-update on buffer change
    local group = vim.api.nvim_create_augroup("QuantumPrefixes", { clear = true })
    vim.api.nvim_create_autocmd({ "BufEnter", "TextChanged", "TextChangedI" }, {
        group = group,
        callback = function() M.update_gutter() end,
    })

    -- Commands
    vim.api.nvim_create_user_command("QuantumPrefixToggle", function() M.toggle() end, {})
    vim.api.nvim_create_user_command("QuantumPrefixClassify", function() M.classify_stats() end, {})
    vim.api.nvim_create_user_command("QuantumPrefixExport", function()
        vim.notify("⚛ Export — coming in v0.2.0", vim.log.levels.INFO)
    end, {})

    -- Initial render
    M.update_gutter()
end

return M
