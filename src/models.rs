use gpui::*;

#[derive(Clone, Debug)]
pub struct Project {
    pub id: SharedString,
    pub name: SharedString,
    pub description: SharedString,
    pub last_modified: SharedString,
    pub thumbnail: Option<SharedString>,
    pub is_favorite: bool,
    pub node_count: usize,
    pub asset_count: usize,
}
