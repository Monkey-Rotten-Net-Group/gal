use std::borrow::Cow;
use anyhow::anyhow;
use gpui::*;
use gpui_component::*;
use gpui_component::theme::Theme;

mod models;
mod project_home;
mod story_editor;
mod workspace;

use workspace::Workspace;

struct CombinedAssets;

impl AssetSource for CombinedAssets {
    fn load(&self, path: &str) -> Result<Option<Cow<'static, [u8]>>> {
        if path.is_empty() {
            return Ok(None);
        }

        // Try bundled assets first
        if let Ok(result) = gpui_component_assets::Assets.load(path) {
            return Ok(result);
        }

        // Fall back to custom assets on disk
        let custom_path = std::path::Path::new("assets").join(path);
        match std::fs::read(&custom_path) {
            Ok(data) => Ok(Some(Cow::Owned(data))),
            Err(_) => Err(anyhow!("could not find asset at path \"{path}\"")),
        }
    }

    fn list(&self, path: &str) -> Result<Vec<SharedString>> {
        gpui_component_assets::Assets.list(path)
    }
}

fn main() {
    let app = Application::new().with_assets(CombinedAssets);

    app.run(move |cx| {
        gpui_component::init(cx);
        
        let mut theme = Theme::default();
        // Earthy tones from design/src/styles/theme.css
        theme.background = rgb(0x0f0d0a).into();
        theme.foreground = rgb(0xf4ede4).into();
        theme.primary = rgb(0xd4a574).into();
        theme.primary_foreground = rgb(0x1a1612).into();
        theme.secondary = rgb(0x2a241e).into();
        theme.secondary_foreground = rgb(0xf4ede4).into();
        theme.muted = rgb(0x2a241e).into();
        theme.muted_foreground = rgb(0x9d8f7f).into();
        theme.accent = rgb(0xc9944a).into();
        theme.accent_foreground = rgb(0x1a1612).into();
        theme.border = rgba(0xd4a57426).into(); // 212, 165, 116, 0.15

        cx.set_global(theme);

        cx.spawn(async move |cx| {
            cx.open_window(WindowOptions::default(), |window, cx| {
                let view = cx.new(|cx| Workspace::new(window, cx));

                cx.new(|cx| Root::new(view, window, cx))
            })
            .expect("Failed to open window");
        })
        .detach();
    });
}
