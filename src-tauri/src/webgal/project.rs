use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

/// WebGAL game/ subdirectory structure.
const GAME_DIRS: &[&str] = &[
    "animation",
    "background",
    "figure",
    "scene",
    "bgm",
    "vocal",
    "video",
    "tex",
];

/// Metadata about a WebGAL project on disk.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectInfo {
    /// Absolute path to the project root (parent of game/).
    pub path: String,
    /// Config values from game/config.txt.
    pub config: HashMap<String, String>,
    /// Scene file names found in game/scene/.
    pub scenes: Vec<String>,
}

/// Information about a single scene file.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SceneInfo {
    pub name: String,
    pub path: String,
}

// ---------------------------------------------------------------------------
// config.txt helpers
// ---------------------------------------------------------------------------

fn parse_config(text: &str) -> HashMap<String, String> {
    let mut map = HashMap::new();
    for line in text.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with(';') {
            continue;
        }
        // Format: Key:Value;
        if let Some(colon) = line.find(':') {
            let key = line[..colon].trim().to_string();
            let mut val = line[colon + 1..].trim().to_string();
            // Strip trailing semicolon
            if val.ends_with(';') {
                val.pop();
            }
            map.insert(key, val);
        }
    }
    map
}

fn serialize_config(config: &HashMap<String, String>) -> String {
    let mut lines: Vec<String> = config
        .iter()
        .map(|(k, v)| format!("{}:{};", k, v))
        .collect();
    lines.sort(); // deterministic output
    lines.push(String::new());
    lines.join("\n")
}

// ---------------------------------------------------------------------------
// Tauri commands
// ---------------------------------------------------------------------------

/// Initialize a new WebGAL project at `base_dir/name/`.
/// Creates the full game/ directory structure and config.txt.
#[tauri::command]
pub fn init_project(base_dir: String, name: String) -> Result<ProjectInfo, String> {
    let root = PathBuf::from(&base_dir).join(&name);
    let game = root.join("game");

    // Create all subdirectories
    for dir in GAME_DIRS {
        fs::create_dir_all(game.join(dir))
            .map_err(|e| format!("Failed to create {}: {}", dir, e))?;
    }

    // Write default config.txt
    let mut config = HashMap::new();
    config.insert("Game_name".to_string(), name.clone());
    config.insert(
        "Game_key".to_string(),
        format!("{:x}", rand_u64()),
    );
    config.insert(
        "Title_img".to_string(),
        "WebGAL_New_Enter_Image.webp".to_string(),
    );
    config.insert("Title_bgm".to_string(), String::new());

    let config_path = game.join("config.txt");
    fs::write(&config_path, serialize_config(&config))
        .map_err(|e| format!("Failed to write config.txt: {}", e))?;

    // Write default start.txt
    let start_path = game.join("scene").join("start.txt");
    fs::write(&start_path, "; 在这里开始你的故事\n")
        .map_err(|e| format!("Failed to write start.txt: {}", e))?;

    Ok(ProjectInfo {
        path: root.to_string_lossy().to_string(),
        config,
        scenes: vec!["start.txt".to_string()],
    })
}

/// Open an existing WebGAL project by its root directory path.
/// Reads config.txt and lists scene files.
#[tauri::command]
pub fn open_project(path: String) -> Result<ProjectInfo, String> {
    let root = PathBuf::from(&path);
    let game = root.join("game");

    if !game.is_dir() {
        return Err(format!(
            "Not a valid WebGAL project: {}/game/ not found",
            root.display()
        ));
    }

    // Read config
    let config_path = game.join("config.txt");
    let config = if config_path.exists() {
        let text = fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read config.txt: {}", e))?;
        parse_config(&text)
    } else {
        HashMap::new()
    };

    // List scenes
    let scenes = list_txt_files(&game.join("scene"))?;

    Ok(ProjectInfo {
        path: root.to_string_lossy().to_string(),
        config,
        scenes,
    })
}

/// Update config.txt for a project.
#[tauri::command]
pub fn save_config(
    project_path: String,
    config: HashMap<String, String>,
) -> Result<(), String> {
    let config_path = PathBuf::from(&project_path)
        .join("game")
        .join("config.txt");
    fs::write(&config_path, serialize_config(&config))
        .map_err(|e| format!("Failed to write config.txt: {}", e))
}

/// Get the full path for a scene file within a project.
#[tauri::command]
pub fn get_scene_path(project_path: String, scene_name: String) -> Result<String, String> {
    let path = PathBuf::from(&project_path)
        .join("game")
        .join("scene")
        .join(&scene_name);
    Ok(path.to_string_lossy().to_string())
}

/// Create a new scene file in the project.
#[tauri::command]
pub fn create_scene(project_path: String, scene_name: String) -> Result<String, String> {
    let scene_dir = PathBuf::from(&project_path).join("game").join("scene");
    fs::create_dir_all(&scene_dir)
        .map_err(|e| format!("Failed to create scene dir: {}", e))?;

    let name = if scene_name.ends_with(".txt") {
        scene_name
    } else {
        format!("{}.txt", scene_name)
    };

    let path = scene_dir.join(&name);
    if path.exists() {
        return Err(format!("Scene {} already exists", name));
    }

    fs::write(&path, format!("; {}\n", name))
        .map_err(|e| format!("Failed to create scene: {}", e))?;

    Ok(path.to_string_lossy().to_string())
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn list_txt_files(dir: &Path) -> Result<Vec<String>, String> {
    if !dir.is_dir() {
        return Ok(Vec::new());
    }
    let mut files = Vec::new();
    let entries =
        fs::read_dir(dir).map_err(|e| format!("Failed to read directory: {}", e))?;
    for entry in entries {
        let entry = entry.map_err(|e| format!("Read entry error: {}", e))?;
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) == Some("txt") {
            if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                files.push(name.to_string());
            }
        }
    }
    files.sort();
    Ok(files)
}

/// Simple deterministic-enough u64 for game keys.
fn rand_u64() -> u64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    let d = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    d.as_nanos() as u64
}
