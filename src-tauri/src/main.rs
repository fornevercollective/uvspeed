// beyondBINARY quantum-prefixed | uvspeed | {+1, 1, -1, +0, 0, -0, +n, n, -n}
// hexterm — Tauri v2 standalone terminal emulator + device emulator
// Phase 4.2

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;
use tauri::menu::{MenuBuilder, SubmenuBuilder, MenuItemBuilder};

// ──────────────────────────────────────────────────────────
// Device frame presets (width, height)
// ──────────────────────────────────────────────────────────

// Phones
const DEVICE_IPHONE: (f64, f64) = (393.0, 852.0);         // iPhone 15 Pro
const DEVICE_IPHONE_SE: (f64, f64) = (375.0, 667.0);      // iPhone SE
const DEVICE_IPHONE_PM: (f64, f64) = (430.0, 932.0);      // iPhone 15 Pro Max
const DEVICE_GALAXY_S24: (f64, f64) = (360.0, 780.0);     // Samsung Galaxy S24
const DEVICE_PIXEL_8: (f64, f64) = (412.0, 915.0);        // Google Pixel 8

// Tablets
const DEVICE_IPAD: (f64, f64) = (820.0, 1180.0);          // iPad Air
const DEVICE_IPAD_MINI: (f64, f64) = (744.0, 1133.0);     // iPad mini
const DEVICE_IPAD_PRO: (f64, f64) = (1024.0, 1366.0);     // iPad Pro 12.9

// Desktop
const DEVICE_MACBOOK: (f64, f64) = (1440.0, 900.0);       // MacBook Air
const DEVICE_DESKTOP: (f64, f64) = (1400.0, 900.0);       // Desktop
const DEVICE_1080P: (f64, f64) = (1920.0, 1080.0);        // Full HD
const DEVICE_1440P: (f64, f64) = (2560.0, 1440.0);        // QHD

// XR Headsets
const DEVICE_QUEST3: (f64, f64) = (2064.0, 2208.0);       // Meta Quest 3
const DEVICE_QUEST_PRO: (f64, f64) = (1800.0, 1920.0);    // Meta Quest Pro
const DEVICE_RAYBANS: (f64, f64) = (1280.0, 960.0);       // Meta Ray-Ban
const DEVICE_VISION_PRO: (f64, f64) = (3660.0, 3200.0);   // Apple Vision Pro

// Feed windows (compact)
const DEVICE_FEED: (f64, f64) = (480.0, 640.0);           // Feed window (portrait)
const DEVICE_FEED_WIDE: (f64, f64) = (640.0, 480.0);      // Feed window (landscape)

/// Resolve device name to (width, height)
fn resolve_device(device: &str) -> Option<(f64, f64)> {
    match device {
        // Phones
        "iphone" | "phone" | "iphone-15"        => Some(DEVICE_IPHONE),
        "iphone-se" | "se"                       => Some(DEVICE_IPHONE_SE),
        "iphone-pm" | "iphone-max" | "pro-max"   => Some(DEVICE_IPHONE_PM),
        "galaxy" | "galaxy-s24" | "samsung"       => Some(DEVICE_GALAXY_S24),
        "pixel" | "pixel-8" | "android"           => Some(DEVICE_PIXEL_8),
        // Tablets
        "ipad" | "tablet"                         => Some(DEVICE_IPAD),
        "ipad-mini"                               => Some(DEVICE_IPAD_MINI),
        "ipad-pro"                                => Some(DEVICE_IPAD_PRO),
        // Desktop
        "macbook" | "laptop"                      => Some(DEVICE_MACBOOK),
        "desktop"                                 => Some(DEVICE_DESKTOP),
        "1080p" | "fhd"                           => Some(DEVICE_1080P),
        "1440p" | "qhd"                           => Some(DEVICE_1440P),
        // XR
        "quest3" | "quest-3" | "meta-quest"       => Some(DEVICE_QUEST3),
        "quest-pro"                               => Some(DEVICE_QUEST_PRO),
        "raybans" | "ray-ban" | "meta-glasses"    => Some(DEVICE_RAYBANS),
        "vision" | "vision-pro" | "avp"           => Some(DEVICE_VISION_PRO),
        // Feed
        "feed"                                    => Some(DEVICE_FEED),
        "feed-wide" | "feed-landscape"            => Some(DEVICE_FEED_WIDE),
        _ => {
            // Try "WxH" format
            let parts: Vec<&str> = device.split('x').collect();
            if parts.len() == 2 {
                let w = parts[0].parse::<f64>().ok()?;
                let h = parts[1].parse::<f64>().ok()?;
                Some((w, h))
            } else {
                None
            }
        }
    }
}


// ──────────────────────────────────────────────────────────
// Tauri commands
// ──────────────────────────────────────────────────────────

/// Prefix classifier — maps code lines to 9-symbol quantum prefix system
#[tauri::command]
fn classify_prefix(line: &str) -> serde_json::Value {
    let trimmed = line.trim();

    let category = if trimmed.is_empty() {
        "neutral"
    } else if trimmed.starts_with("//") || trimmed.starts_with('#') || trimmed.starts_with("/*") || trimmed.starts_with("--") {
        "comment"
    } else if trimmed.starts_with("import ") || trimmed.starts_with("from ") || trimmed.starts_with("use ")
            || trimmed.starts_with("require") || trimmed.starts_with("#include") {
        "import"
    } else if trimmed.starts_with("fn ") || trimmed.starts_with("function ")
            || trimmed.starts_with("def ") || trimmed.starts_with("class ")
            || trimmed.starts_with("struct ") || trimmed.starts_with("enum ")
            || trimmed.starts_with("const ") || trimmed.starts_with("let ")
            || trimmed.starts_with("var ") || trimmed.starts_with("type ") {
        "declaration"
    } else if trimmed.starts_with("if ") || trimmed.starts_with("else")
            || trimmed.starts_with("for ") || trimmed.starts_with("while ")
            || trimmed.starts_with("match ") || trimmed.starts_with("switch ")
            || trimmed.starts_with("case ") {
        "logic"
    } else if trimmed.starts_with("return ") || trimmed.starts_with("yield ")
            || trimmed.starts_with("break") || trimmed.starts_with("continue") {
        "modifier"
    } else if trimmed.contains("print") || trimmed.contains("console.")
            || trimmed.contains("log(") || trimmed.contains("write(")
            || trimmed.contains("read(") || trimmed.contains("fetch(") {
        "io"
    } else if trimmed.contains(" = ") || trimmed.contains(" := ") || trimmed.contains(" += ")
            || trimmed.contains(" -= ") || trimmed.contains(" *= ") {
        "assignment"
    } else {
        "unknown"
    };

    let symbol = match category {
        "declaration" => "+1",
        "logic"       => "1",
        "io"          => "-1",
        "assignment"  => "+0",
        "neutral"     => "0",
        "comment"     => "-0",
        "modifier"    => "+n",
        "import"      => "n",
        "unknown"     => "-n",
        _             => "-n",
    };

    serde_json::json!({
        "category": category,
        "symbol": symbol,
        "line": trimmed
    })
}

/// Batch classify multiple lines
#[tauri::command]
fn classify_batch(lines: Vec<String>) -> Vec<serde_json::Value> {
    lines.iter().map(|l| classify_prefix(l)).collect()
}

/// Bridge server health check
#[tauri::command]
fn bridge_health() -> serde_json::Value {
    use std::net::TcpStream;
    use std::time::Duration;
    match TcpStream::connect_timeout(
        &"127.0.0.1:8085".parse().unwrap(),
        Duration::from_millis(500),
    ) {
        Ok(_) => serde_json::json!({"status": "connected", "port": 8085}),
        Err(_) => serde_json::json!({"status": "offline"}),
    }
}

/// Open a new window with a specific page and device size
#[tauri::command]
fn open_window(
    app: tauri::AppHandle,
    label: String,
    url: String,
    title: String,
    device: String,
) -> Result<serde_json::Value, String> {
    let (width, height) = resolve_device(&device).unwrap_or(DEVICE_IPHONE);

    let final_label = if app.get_webview_window(&label).is_some() {
        format!("{}-{}", label, std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() % 10000)
    } else {
        label.clone()
    };

    let window_title = format!("{} — {} ({}x{})", title, device, width as u32, height as u32);

    match tauri::WebviewWindowBuilder::new(
        &app,
        &final_label,
        tauri::WebviewUrl::App(url.into()),
    )
    .title(&window_title)
    .inner_size(width, height)
    .min_inner_size(280.0, 400.0)
    .resizable(true)
    .center()
    .build()
    {
        Ok(_) => Ok(serde_json::json!({
            "label": final_label,
            "device": device,
            "width": width,
            "height": height,
        })),
        Err(e) => Err(format!("Failed to create window: {}", e)),
    }
}

/// Resize the current window to a device preset
#[tauri::command]
fn set_device_frame(
    app: tauri::AppHandle,
    label: String,
    device: String,
) -> Result<serde_json::Value, String> {
    let (width, height) = resolve_device(&device)
        .ok_or_else(|| format!("Unknown device: {}", device))?;

    if let Some(window) = app.get_webview_window(&label) {
        let size = tauri::LogicalSize::new(width, height);
        window.set_size(tauri::Size::Logical(size)).map_err(|e| format!("{}", e))?;
        window.set_title(&format!("hexterm — {} ({}x{})", device, width as u32, height as u32))
            .map_err(|e| format!("{}", e))?;
        window.center().map_err(|e| format!("{}", e))?;
        Ok(serde_json::json!({
            "label": label,
            "device": device,
            "width": width,
            "height": height,
        }))
    } else {
        Err(format!("Window '{}' not found", label))
    }
}

/// List all open windows
#[tauri::command]
fn list_windows(app: tauri::AppHandle) -> Vec<serde_json::Value> {
    app.webview_windows()
        .iter()
        .map(|(label, window)| {
            let size = window.inner_size().unwrap_or_default();
            serde_json::json!({
                "label": label,
                "width": size.width,
                "height": size.height,
            })
        })
        .collect()
}

/// Open a lightweight feed window (video/audio/transcript, no terminal)
#[tauri::command]
fn open_feed(
    app: tauri::AppHandle,
    feed_id: String,
    source: String,
) -> Result<serde_json::Value, String> {
    let (width, height) = DEVICE_FEED;

    let final_label = if app.get_webview_window(&feed_id).is_some() {
        format!("{}-{}", feed_id, std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() % 10000)
    } else {
        feed_id.clone()
    };

    // Simple URL encode for the source parameter
    let encoded_src = source.replace(' ', "%20").replace('&', "%26").replace('#', "%23");
    let url = format!("feed.html?id={}&src={}", final_label, encoded_src);
    let window_title = format!("feed — {}", if source.is_empty() { "waiting" } else { &source });

    match tauri::WebviewWindowBuilder::new(
        &app,
        &final_label,
        tauri::WebviewUrl::App(url.into()),
    )
    .title(&window_title)
    .inner_size(width, height)
    .min_inner_size(280.0, 200.0)
    .resizable(true)
    .center()
    .build()
    {
        Ok(_) => Ok(serde_json::json!({
            "feedId": final_label,
            "source": source,
            "width": width,
            "height": height,
        })),
        Err(e) => Err(format!("Failed to create feed window: {}", e)),
    }
}


// ──────────────────────────────────────────────────────────
// Menu builder
// ──────────────────────────────────────────────────────────

fn build_menu(app: &tauri::App) -> Result<tauri::menu::Menu<tauri::Wry>, Box<dyn std::error::Error>> {
    // ── App menu (uvspeed) ──
    let app_menu = SubmenuBuilder::new(app, "uvspeed")
        .about(None)
        .separator()
        .services()
        .separator()
        .hide()
        .hide_others()
        .show_all()
        .separator()
        .quit()
        .build()?;

    // ── File ──
    let file_menu = SubmenuBuilder::new(app, "File")
        .item(&MenuItemBuilder::with_id("new-window", "New Terminal")
            .accelerator("CmdOrCtrl+N").build(app)?)
        .item(&MenuItemBuilder::with_id("new-grid", "New Grid View")
            .accelerator("CmdOrCtrl+Shift+G").build(app)?)
        .item(&MenuItemBuilder::with_id("show-launcher", "Show Launcher")
            .accelerator("CmdOrCtrl+Shift+L").build(app)?)
        .separator()
        .item(&MenuItemBuilder::with_id("close-window", "Close Window")
            .accelerator("CmdOrCtrl+W").build(app)?)
        .build()?;

    // ── Edit ──
    let edit_menu = SubmenuBuilder::new(app, "Edit")
        .undo()
        .redo()
        .separator()
        .cut()
        .copy()
        .paste()
        .select_all()
        .build()?;

    // ── Device submenu ──
    let device_menu = SubmenuBuilder::new(app, "Device")
        // Phones
        .item(&MenuItemBuilder::with_id("dev-iphone", "iPhone 15 Pro (393x852)").build(app)?)
        .item(&MenuItemBuilder::with_id("dev-iphone-se", "iPhone SE (375x667)").build(app)?)
        .item(&MenuItemBuilder::with_id("dev-iphone-pm", "iPhone 15 Pro Max (430x932)").build(app)?)
        .item(&MenuItemBuilder::with_id("dev-galaxy", "Galaxy S24 (360x780)").build(app)?)
        .item(&MenuItemBuilder::with_id("dev-pixel", "Pixel 8 (412x915)").build(app)?)
        .separator()
        // Tablets
        .item(&MenuItemBuilder::with_id("dev-ipad", "iPad Air (820x1180)").build(app)?)
        .item(&MenuItemBuilder::with_id("dev-ipad-pro", "iPad Pro 12.9 (1024x1366)").build(app)?)
        .item(&MenuItemBuilder::with_id("dev-ipad-mini", "iPad mini (744x1133)").build(app)?)
        .separator()
        // Desktop
        .item(&MenuItemBuilder::with_id("dev-macbook", "MacBook Air (1440x900)").build(app)?)
        .item(&MenuItemBuilder::with_id("dev-desktop", "Desktop (1400x900)").build(app)?)
        .item(&MenuItemBuilder::with_id("dev-1080p", "Full HD (1920x1080)").build(app)?)
        .item(&MenuItemBuilder::with_id("dev-1440p", "QHD (2560x1440)").build(app)?)
        .separator()
        // XR
        .item(&MenuItemBuilder::with_id("dev-quest3", "Meta Quest 3 (2064x2208)").build(app)?)
        .item(&MenuItemBuilder::with_id("dev-quest-pro", "Meta Quest Pro (1800x1920)").build(app)?)
        .item(&MenuItemBuilder::with_id("dev-raybans", "Meta Ray-Ban (1280x960)").build(app)?)
        .item(&MenuItemBuilder::with_id("dev-vision", "Apple Vision Pro (3660x3200)").build(app)?)
        .build()?;

    // ── View ──
    let view_menu = SubmenuBuilder::new(app, "View")
        .item(&MenuItemBuilder::with_id("force-reload", "Force Reload")
            .accelerator("CmdOrCtrl+Shift+R").build(app)?)
        .item(&MenuItemBuilder::with_id("toggle-devtools", "Toggle DevTools")
            .accelerator("CmdOrCtrl+Option+I").build(app)?)
        .separator()
        .item(&MenuItemBuilder::with_id("zoom-reset", "Actual Size")
            .accelerator("CmdOrCtrl+0").build(app)?)
        .item(&MenuItemBuilder::with_id("zoom-in", "Zoom In")
            .accelerator("CmdOrCtrl+=").build(app)?)
        .item(&MenuItemBuilder::with_id("zoom-out", "Zoom Out")
            .accelerator("CmdOrCtrl+-").build(app)?)
        .separator()
        .item(&device_menu)
        .build()?;

    // ── Terminal ──
    let terminal_menu = SubmenuBuilder::new(app, "Terminal")
        .item(&MenuItemBuilder::with_id("term-clear", "Clear Terminal")
            .accelerator("CmdOrCtrl+K").build(app)?)
        .separator()
        .item(&MenuItemBuilder::with_id("term-sync", "Quick Sync...")
            .accelerator("CmdOrCtrl+Shift+S").build(app)?)
        .item(&MenuItemBuilder::with_id("term-hexcast", "Hexcast Camera")
            .accelerator("CmdOrCtrl+Shift+H").build(app)?)
        .item(&MenuItemBuilder::with_id("term-send", "Hexcast Send...")
            .accelerator("CmdOrCtrl+Shift+E").build(app)?)
        .item(&MenuItemBuilder::with_id("term-connect", "Hexcast Connect...")
            .accelerator("CmdOrCtrl+Shift+C").build(app)?)
        .separator()
        .item(&MenuItemBuilder::with_id("term-console", "Dev Console")
            .accelerator("CmdOrCtrl+Shift+J").build(app)?)
        .build()?;

    // ── Window ──
    let window_menu = SubmenuBuilder::new(app, "Window")
        .minimize()
        .maximize()
        .separator()
        .close_window()
        .build()?;

    // ── Assemble ──
    let menu = MenuBuilder::new(app)
        .item(&app_menu)
        .item(&file_menu)
        .item(&edit_menu)
        .item(&view_menu)
        .item(&terminal_menu)
        .item(&window_menu)
        .build()?;

    Ok(menu)
}


// ──────────────────────────────────────────────────────────
// Menu event handler
// ──────────────────────────────────────────────────────────

/// Find the focused webview window (or fall back to "launcher")
fn focused_window(app: &tauri::AppHandle) -> Option<tauri::WebviewWindow> {
    let windows = app.webview_windows();
    // Try to find the focused one
    for (_label, w) in &windows {
        if w.is_focused().unwrap_or(false) {
            return Some(w.clone());
        }
    }
    // Fallback: try launcher, then hexterm, then first available
    app.get_webview_window("launcher")
        .or_else(|| app.get_webview_window("hexterm"))
        .or_else(|| windows.into_values().next())
}

fn handle_menu_event(app: &tauri::AppHandle, event: tauri::menu::MenuEvent) {
    let id = event.id().0.as_str();

    // Helper: eval JS in the focused window
    let eval_js = |js: &str| {
        if let Some(w) = focused_window(app) {
            let _ = w.eval(js);
        }
    };

    // Device resize helper
    let resize_to = |device_name: &str| {
        if let Some((w, h)) = resolve_device(device_name) {
            if let Some(win) = focused_window(app) {
                let size = tauri::LogicalSize::new(w, h);
                let _ = win.set_size(tauri::Size::Logical(size));
                let _ = win.set_title(&format!("hexterm — {} ({}x{})", device_name, w as u32, h as u32));
                let _ = win.center();
            }
        }
    };

    match id {
        // ── File ──
        "new-window" => {
            let label = format!("win-{}", std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default().as_millis() % 100000);
            let _ = tauri::WebviewWindowBuilder::new(
                app,
                &label,
                tauri::WebviewUrl::App("terminal.html".into()),
            )
            .title("uvspeed — terminal")
            .inner_size(820.0, 1080.0)
            .min_inner_size(280.0, 400.0)
            .resizable(true)
            .center()
            .build();
        }
        "new-grid" => {
            let label = format!("grid-{}", std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default().as_millis() % 100000);
            let _ = tauri::WebviewWindowBuilder::new(
                app,
                &label,
                tauri::WebviewUrl::App("grid.html".into()),
            )
            .title("uvspeed — grid")
            .inner_size(1400.0, 900.0)
            .min_inner_size(400.0, 300.0)
            .resizable(true)
            .center()
            .build();
        }
        "show-launcher" => {
            // Focus or re-open the launcher
            if let Some(w) = app.get_webview_window("launcher") {
                let _ = w.set_focus();
            } else {
                let _ = tauri::WebviewWindowBuilder::new(
                    app,
                    "launcher",
                    tauri::WebviewUrl::App("launcher.html".into()),
                )
                .title("hexterm")
                .inner_size(580.0, 560.0)
                .min_inner_size(400.0, 420.0)
                .resizable(true)
                .center()
                .build();
            }
        }
        "close-window" => {
            if let Some(w) = focused_window(app) {
                let _ = w.close();
            }
        }

        // ── View ──
        "force-reload" => eval_js("sessionStorage.clear(); localStorage.removeItem('hexterm-intro-done'); location.reload(true)"),
        "toggle-devtools" => {
            #[cfg(debug_assertions)]
            {
                if let Some(w) = focused_window(app) {
                    if w.is_devtools_open() {
                        w.close_devtools();
                    } else {
                        w.open_devtools();
                    }
                }
            }
            #[cfg(not(debug_assertions))]
            {
                // DevTools not available in release builds
                let _ = app;
            }
        }
        "zoom-reset" => eval_js("document.body.style.zoom = '1'"),
        "zoom-in"    => eval_js("document.body.style.zoom = String(parseFloat(document.body.style.zoom || '1') + 0.1)"),
        "zoom-out"   => eval_js("document.body.style.zoom = String(Math.max(0.3, parseFloat(document.body.style.zoom || '1') - 0.1))"),

        // ── Device presets ──
        "dev-iphone"     => resize_to("iphone"),
        "dev-iphone-se"  => resize_to("iphone-se"),
        "dev-iphone-pm"  => resize_to("iphone-pm"),
        "dev-galaxy"     => resize_to("galaxy"),
        "dev-pixel"      => resize_to("pixel"),
        "dev-ipad"       => resize_to("ipad"),
        "dev-ipad-pro"   => resize_to("ipad-pro"),
        "dev-ipad-mini"  => resize_to("ipad-mini"),
        "dev-macbook"    => resize_to("macbook"),
        "dev-desktop"    => resize_to("desktop"),
        "dev-1080p"      => resize_to("1080p"),
        "dev-1440p"      => resize_to("1440p"),
        "dev-quest3"     => resize_to("quest3"),
        "dev-quest-pro"  => resize_to("quest-pro"),
        "dev-raybans"    => resize_to("raybans"),
        "dev-vision"     => resize_to("vision"),

        // ── Terminal commands (eval JS in terminal) ──
        "term-clear"   => eval_js("if(term){term.clear()}"),
        "term-sync"    => eval_js("if(typeof processCommand==='function'){processCommand('sync')}"),
        "term-hexcast" => eval_js("if(typeof processCommand==='function'){processCommand('hexcast')}"),
        "term-send"    => eval_js("if(typeof processCommand==='function'){processCommand('hexcast send')}"),
        "term-connect" => eval_js("if(typeof processCommand==='function'){processCommand('hexcast connect')}"),
        "term-console" => eval_js("if(typeof processCommand==='function'){processCommand('console')}"),

        _ => {}
    }
}


// ──────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            classify_prefix,
            classify_batch,
            bridge_health,
            open_window,
            open_feed,
            set_device_frame,
            list_windows,
        ])
        .setup(|app| {
            println!("⚛ uvspeed v4.0 — Tauri v2");
            println!("  {{+1, 1, -1, +0, 0, -0, +n, n, -n}}");

            // Build and set menu
            match build_menu(app) {
                Ok(menu) => {
                    let _ = app.set_menu(menu);
                }
                Err(e) => {
                    eprintln!("Menu build error: {}", e);
                }
            }

            // Open DevTools in debug mode
            #[cfg(debug_assertions)]
            {
                if let Some(window) = app.get_webview_window("launcher")
                    .or_else(|| app.get_webview_window("hexterm")) {
                    window.open_devtools();
                }
            }

            Ok(())
        })
        .on_menu_event(handle_menu_event)
        .run(tauri::generate_context!())
        .expect("error running uvspeed");
}
