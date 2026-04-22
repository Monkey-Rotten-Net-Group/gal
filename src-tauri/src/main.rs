#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod webgal;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            webgal::commands::parse_scene,
            webgal::commands::serialize_scene,
            webgal::commands::load_scene,
            webgal::commands::save_scene,
            webgal::commands::list_scenes,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
