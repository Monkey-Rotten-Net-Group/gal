use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

const CONFIG_DIR: &str = "ciallo";
const CONFIG_FILE: &str = "ai.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(default)]
pub struct AiConfig {
    pub provider: String,
    pub model: String,
    pub api_key: String,
    pub base_url: String,
    pub system_prompt: String,
}

impl Default for AiConfig {
    fn default() -> Self {
        Self {
            provider: "openai".into(),
            model: "gpt-4o-mini".into(),
            api_key: String::new(),
            base_url: String::new(),
            system_prompt: default_system_prompt(),
        }
    }
}

pub fn default_system_prompt() -> String {
    r#"你是 WebGAL 视觉小说脚本的创作助手。WebGAL 脚本由若干指令组成，每行一条，以 `;` 结尾。常用指令：

- 旁白：`:旁白文本;`
- 对话：`角色名:台词;`
- 切换背景：`changeBg:bg_file.webp -next;`
- 切换立绘：`changeFigure:char.webp -left -next;`（位置 -left/-center/-right，可省略）
- 播放 BGM：`bgm:track.mp3;`
- 选项：`choose:选项A:branch_a.txt|选项B:branch_b.txt;`
- 跳转场景：`changeScene:next.txt;`
- 注释行以 `;` 开头

请根据用户需求生成符合上述语法的 WebGAL 片段，输出时只给出脚本内容（必要时附简短说明），保持每行以 `;` 结尾。"#
        .to_string()
}

fn config_path() -> Option<PathBuf> {
    Some(dirs::config_dir()?.join(CONFIG_DIR).join(CONFIG_FILE))
}

pub fn load_config() -> AiConfig {
    let Some(path) = config_path() else {
        return AiConfig::default();
    };
    let Ok(text) = fs::read_to_string(&path) else {
        return AiConfig::default();
    };
    serde_json::from_str(&text).unwrap_or_default()
}

pub fn save_config(config: &AiConfig) -> Result<(), String> {
    let path = config_path().ok_or_else(|| "无法定位用户配置目录".to_string())?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("创建配置目录失败: {e}"))?;
    }
    let json = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| format!("写入配置失败: {e}"))
}
