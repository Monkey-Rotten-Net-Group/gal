use gpui::*;
use gpui_component::{button::*, input::*, *};
use crate::models::Project;

pub struct ProjectHome {
    projects: Vec<Project>,
    search_query: String,
    search_input: Entity<InputState>,
    view_mode: ViewMode,
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum ViewMode {
    Grid,
    List,
}

pub struct ProjectSelected(pub SharedString);

impl ProjectHome {
    pub fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let projects = vec![
            Project {
                id: "1".into(),
                name: "苍穹之下的誓言".into(),
                description: "一个关于星际旅行与古老传说的奇幻故事。".into(),
                last_modified: "2026-04-14 15:30".into(),
                thumbnail: Some("https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400".into()),
                is_favorite: true,
                node_count: 42,
                asset_count: 15,
            },
            Project {
                id: "2".into(),
                name: "雨夜侦探".into(),
                description: "硬汉派侦探在霓虹闪烁的都市中追寻真相。".into(),
                last_modified: "2026-04-12 09:15".into(),
                thumbnail: Some("https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400".into()),
                is_favorite: false,
                node_count: 28,
                asset_count: 8,
            },
            Project {
                id: "3".into(),
                name: "夏日回忆".into(),
                description: "重返那个蝉鸣阵阵的夏天，寻找失落的记忆。".into(),
                last_modified: "2026-04-10 18:45".into(),
                thumbnail: Some("https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400".into()),
                is_favorite: true,
                node_count: 115,
                asset_count: 34,
            },
        ];

        let search_input = cx.new(|cx| {
            InputState::new(window, cx)
                .placeholder("搜索项目...")
        });

        Self {
            projects,
            search_query: String::new(),
            search_input,
            view_mode: ViewMode::Grid,
        }
    }
}

impl EventEmitter<ProjectSelected> for ProjectHome {}

impl Render for ProjectHome {
    fn render(&mut self, _window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let theme = cx.theme();
        let projects = self.projects.clone();
        let search_input = self.search_input.clone();

        v_flex()
            .size_full()
            .bg(theme.background)
            .child(
                h_flex()
                    .w_full()
                    .p_8()
                    .justify_between()
                    .border_b_1()
                    .border_color(theme.border)
                    .child(
                        h_flex()
                            .gap_4()
                            .child(
                                div()
                                    .p_2()
                                    .rounded_xl()
                                    .bg(theme.primary.opacity(0.2))
                                    .border_1()
                                    .border_color(theme.primary.opacity(0.3))
                                    .child(Icon::new(IconName::Dash).size(px(32.0)).text_color(theme.primary))
                            )
                            .child(
                                v_flex()
                                    .child(div().text_3xl().text_color(theme.foreground).child("创作中心"))
                                    .child(div().text_sm().text_color(theme.muted_foreground).child("管理你的所有故事织卷"))
                            )
                    )
                    .child(
                        h_flex()
                            .gap_4()
                            .child(
                                div()
                                    .w(px(320.0))
                                    .child(Input::new(&search_input))
                            )
                            .child(
                                Button::new("create")
                                    .primary()
                                    .label("创建新项目")
                            )
                    )
            )
            .child(
                h_flex()
                    .flex_1()
                    .child(
                        v_flex()
                            .w(px(256.0))
                            .p_4()
                            .gap_2()
                            .child(Button::new("all-projects").ghost().w_full().label("全部项目"))
                            .child(Button::new("favorites").ghost().w_full().label("我的收藏"))
                            .child(Button::new("recent").ghost().w_full().label("最近编辑"))
                            .child(Button::new("trash").ghost().w_full().label("回收站"))
                    )
                    .child(
                        v_flex()
                            .flex_1()
                            .p_8()
                            .child(
                                h_flex()
                                    .justify_between()
                                    .mb_8()
                                    .child(div().text_xl().child(format!("项目列表 ({})", projects.len())))
                            )
                            .child(
                                div()
                                    .grid()
                                    .grid_cols(3)
                                    .gap_6()
                                    .children(projects.into_iter().map(|project| {
                                        let project_id = project.id.clone();
                                        v_flex()
                                            .bg(cx.theme().background)
                                            .border_1()
                                            .border_color(cx.theme().border)
                                            .rounded_2xl()
                                            .overflow_hidden()
                                            .cursor_pointer()
                                            .on_click(cx.listener(move |this, _, _, cx| {
                                                cx.emit(ProjectSelected(project_id.clone()));
                                            }))
                                            .child(
                                                div()
                                                    .h(px(180.0))
                                                    .bg(cx.theme().secondary)
                                                    .child(div().p_4().child(project.name.clone()))
                                            )
                                            .child(
                                                v_flex()
                                                    .p_6()
                                                    .child(div().text_xl().text_color(cx.theme().foreground).child(project.name.clone()))
                                                    .child(div().text_sm().text_color(cx.theme().muted_foreground).child(project.description.clone()))
                                            )
                                    }))
                            )
                    )
            )
    }
}
