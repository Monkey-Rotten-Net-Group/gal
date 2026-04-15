use gpui::*;
use gpui_component::{button::*, *};

pub struct StoryEditor {
    project_id: SharedString,
}

pub struct NavigateBack;

impl StoryEditor {
    pub fn new(project_id: SharedString, _cx: &mut Context<Self>) -> Self {
        Self { project_id }
    }
}

impl EventEmitter<NavigateBack> for StoryEditor {}

impl Render for StoryEditor {
    fn render(&mut self, _window: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let theme = cx.theme();
        
        v_flex()
            .size_full()
            .bg(theme.background)
            .child(
                h_flex()
                    .w_full()
                    .p_4()
                    .justify_between()
                    .border_b_1()
                    .border_color(theme.border)
                    .child(
                        h_flex()
                            .gap_4()
                            .child(
                                Button::new("back")
                                    .ghost()
                                    .label("返回")
                                    .on_click(|_, _, cx| {
                                        cx.emit(NavigateBack);
                                    })
                            )
                            .child(div().text_2xl().child("故事编织室"))
                            .child(div().text_sm().text_color(theme.muted_foreground).child(self.project_id.clone()))
                    )
                    .child(
                        h_flex()
                            .gap_3()
                            .child(Button::new("assets").ghost().label("素材库"))
                            .child(Button::new("ai").primary().label("AI 助手"))
                            .child(Button::new("save").ghost().label("保存"))
                    )
            )
            .child(
                h_flex()
                    .flex_1()
                    .child(
                        v_flex()
                            .w(px(256.0))
                            .border_r_1()
                            .border_color(theme.border)
                            .child(div().p_4().child("节点面板"))
                    )
                    .child(
                        div()
                            .flex_1()
                            .bg(theme.background)
                            .child(div().p_4().child("流程画布 (Flow Canvas)"))
                    )
                    .child(
                        v_flex()
                            .w(px(320.0))
                            .border_l_1()
                            .border_color(theme.border)
                            .child(div().p_4().child("详情面板"))
                    )
            )
    }
}
