use gpui::*;
use crate::project_home::{ProjectHome, ProjectSelected};
use crate::story_editor::{StoryEditor, NavigateBack};

pub enum ActiveView {
    ProjectHome(Entity<ProjectHome>),
    StoryEditor(Entity<StoryEditor>),
}

pub struct Workspace {
    active_view: ActiveView,
}

impl Workspace {
    pub fn new(window: &mut Window, cx: &mut Context<Self>) -> Self {
        let mut this = Self {
            active_view: ActiveView::ProjectHome(cx.new(|cx| ProjectHome::new(window, cx))),
        };
        this.subscribe(window, cx);
        this
    }

    fn subscribe(&mut self, window: &mut Window, cx: &mut Context<Self>) {
        match &self.active_view {
            ActiveView::ProjectHome(home) => {
                cx.subscribe(home, move |this, _, event: &ProjectSelected, cx| {
                    let project_id = event.0.clone();
                    this.active_view = ActiveView::StoryEditor(cx.new(|cx| StoryEditor::new(project_id, cx)));
                    this.subscribe(window, cx);
                    cx.notify();
                }).detach();
            }
            ActiveView::StoryEditor(editor) => {
                cx.subscribe(editor, move |this, _, _: &NavigateBack, cx| {
                    this.active_view = ActiveView::ProjectHome(cx.new(|cx| ProjectHome::new(window, cx)));
                    this.subscribe(window, cx);
                    cx.notify();
                }).detach();
            }
        }
    }
}

impl Render for Workspace {
    fn render(&mut self, _window: &mut Window, _cx: &mut Context<Self>) -> impl IntoElement {
        match &self.active_view {
            ActiveView::ProjectHome(home) => div().size_full().child(home.clone()),
            ActiveView::StoryEditor(editor) => div().size_full().child(editor.clone()),
        }
    }
}
