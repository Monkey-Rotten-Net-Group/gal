use gpui::*;
use gpui_component::{button::*, input::*, *};

pub struct ChatInputView {
    state: Entity<InputState>,
    char_limit: usize,
    messages: Vec<String>,
}

impl ChatInputView {
    fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let state = cx.new(|cx| {
            InputState::new(window, cx)
                .auto_grow(6, 6)
                .placeholder("chat here")
        });

        Self {
            state,
            char_limit: 500,
            messages: Vec::new(),
        }
    }
}

impl Render for ChatInputView {
    fn render(&mut self, _: &mut Window, cx: &mut Context<Self>) -> impl IntoElement {
        let content = self.state.read(cx).value();
        let char_count = content.len();
        let remaining = self.char_limit.saturating_sub(char_count);
        let entity = cx.entity().clone();
        let state = self.state.clone();

        v_flex()
            .size_full()
            .items_center()
            .child(
                div()
                    .flex_1()
                    .w(relative(0.6))
                    .mt_10()
                    .mb_4()
                    .p_4()
                    .bg(cx.theme().background)
                    .border_1()
                    .border_color(cx.theme().border)
                    .rounded_xl()
                    .shadow_sm()
                    .child(
                        v_flex()
                            .gap_2()
                            .children(self.messages.iter().map(|msg: &String| {
                                div()
                                    .p_2()
                                    .bg(cx.theme().muted)
                                    .rounded_lg()
                                    .text_sm()
                                    .child(msg.clone())
                            })),
                    ),
            )
            .child(
                v_flex()
                    .w(relative(0.6))
                    .gap_2()
                    .child(Input::new(&self.state).rounded(px(14.0)))
                    .child(
                        h_flex()
                            .justify_between()
                            .child(
                                div()
                                    .text_xs()
                                    .text_color(cx.theme().muted_foreground)
                                    .child(format!("{} characters remaining", remaining)),
                            )
                            .child(
                                Button::new("send")
                                    .primary()
                                    .shadow_sm()
                                    .rounded_full()
                                    .disabled(char_count == 0 || char_count > self.char_limit)
                                    .label("Send")
                                    .on_click(move |_, window, cx| {
                                        let msg = state.read(cx).value().to_string();
                                        if msg.is_empty() {
                                            return;
                                        }
                                        entity.update(cx, |this, cx| {
                                            this.messages.push(msg);
                                            cx.notify();
                                        });
                                        state.update(cx, |s, cx| {
                                            s.set_value("", window, cx);
                                        });
                                    }),
                            ),
                    ),
            )
            .child(div().h(relative(0.05)))
    }
}

fn main() {
    let app = Application::new();

    app.run(move |cx| {
        gpui_component::init(cx);

        cx.spawn(async move |cx| {
            cx.open_window(WindowOptions::default(), |window, cx| {
                let view = cx.new(|cx| ChatInputView::new(window, cx));

                cx.new(|cx| Root::new(view, window, cx))
            })
            .expect("Failed to open window");
        })
        .detach();
    });
}
