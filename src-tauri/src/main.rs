#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod ai;
mod webgal;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            // Scene parsing & serialization
            webgal::commands::parse_scene,
            webgal::commands::serialize_scene,
            webgal::commands::load_scene,
            webgal::commands::save_scene,
            webgal::commands::list_scenes,
            // Project management
            webgal::project::init_project,
            webgal::project::open_project,
            webgal::project::save_config,
            webgal::project::get_scene_path,
            webgal::project::create_scene,
            // AI
            ai::commands::get_ai_config,
            ai::commands::set_ai_config,
            ai::commands::default_ai_system_prompt,
            ai::commands::ai_chat_stream,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
