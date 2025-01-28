#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::path::Path;
use std::process::Command;
use tauri_plugin_log::{Target, TargetKind};
use tauri::Manager;
use lnk::ShellLink;
use windows_icons::get_icon_base64_by_path;
use window_vibrancy::{apply_blur, apply_vibrancy, apply_mica, apply_acrylic, NSVisualEffectMaterial};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn launch_app(_app_handle: tauri::AppHandle, path: &str) -> String {
    log::info!("raw_path: {:?}", path);
    let mut command_path = path;
    let shortcut: ShellLink;

    if is_shortcut(path) {
        // if it is a lnk
        shortcut = ShellLink::open(path).unwrap();
        log::debug!("{:#?}", shortcut);
        if let Some(link_info) = shortcut.link_info() {
            if let Some(command_literal) = link_info.local_base_path() {
                command_path = &command_literal;
            }
        }
    }
    log::info!("command_path: {:?}", path);

    let _child = Command::new(command_path).spawn().expect("failed");
    return "finish".to_string();
}

#[tauri::command]
fn img_path_to_base64(path: String) -> String {
    let result = get_icon_base64_by_path(&path);
    log::debug!("base64:{}", result);
    return result;
}

fn is_shortcut(path: &str) -> bool {
    let path = Path::new(path);
    path.extension().map(|ext| ext == "lnk").unwrap_or(false)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            // #[cfg(target_os = "macos")]
            // apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)
            //     .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");

            #[cfg(target_os = "windows")]
            apply_acrylic(&window, Some((0, 0, 0, (256.0_f64 * 0.2_f64).round() as u8)))
                .expect("Unsupported platform! 'apply_acrylic' is only supported on Windows");

            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir {
                        file_name: Some(String::from("app")),
                    }),
                    Target::new(TargetKind::Webview),
                ])
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            launch_app,
            img_path_to_base64,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
