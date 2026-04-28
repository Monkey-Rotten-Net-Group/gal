use super::config::{self, AiConfig};
use futures::StreamExt;
use genai::adapter::AdapterKind;
use genai::chat::{ChatMessage, ChatRequest, ChatStreamEvent, StreamChunk};
use genai::resolver::{AuthData, Endpoint, ServiceTargetResolver};
use genai::{Client, ModelIden, ServiceTarget};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter};

#[derive(Debug, Deserialize)]
pub struct AiMessageInput {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize, Clone)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum AiStreamEvent {
    Start,
    Chunk { content: String },
    Done,
    Error { message: String },
}

#[tauri::command]
pub fn get_ai_config() -> AiConfig {
    config::load_config()
}

#[tauri::command]
pub fn set_ai_config(config: AiConfig) -> Result<(), String> {
    config::save_config(&config)
}

#[tauri::command]
pub fn default_ai_system_prompt() -> String {
    config::default_system_prompt()
}

#[tauri::command]
pub async fn ai_chat_stream(
    app: AppHandle,
    request_id: String,
    messages: Vec<AiMessageInput>,
) -> Result<(), String> {
    let cfg = config::load_config();

    if cfg.api_key.is_empty() && cfg.provider != "ollama" {
        return Err("尚未配置 API Key，请先在 AI 设置中填写".into());
    }
    if cfg.model.trim().is_empty() {
        return Err("尚未配置模型名称".into());
    }

    let mut chat_messages: Vec<ChatMessage> = Vec::new();
    let sys = cfg.system_prompt.trim();
    if !sys.is_empty() {
        chat_messages.push(ChatMessage::system(sys));
    }
    for m in messages {
        let msg = match m.role.as_str() {
            "user" => ChatMessage::user(m.content),
            "assistant" => ChatMessage::assistant(m.content),
            "system" => ChatMessage::system(m.content),
            _ => ChatMessage::user(m.content),
        };
        chat_messages.push(msg);
    }

    let request = ChatRequest::new(chat_messages);
    let client = build_client(&cfg);
    let model = cfg.model.clone();
    let event_name = format!("ai-chat-{request_id}");

    let app_handle = app.clone();
    tauri::async_runtime::spawn(async move {
        let _ = app_handle.emit(&event_name, AiStreamEvent::Start);
        match client.exec_chat_stream(&model, request, None).await {
            Ok(chat_res) => {
                let mut stream = chat_res.stream;
                while let Some(event) = stream.next().await {
                    match event {
                        Ok(ChatStreamEvent::Chunk(StreamChunk { content })) => {
                            let _ = app_handle
                                .emit(&event_name, AiStreamEvent::Chunk { content });
                        }
                        Ok(ChatStreamEvent::End(_)) => break,
                        Ok(_) => {}
                        Err(e) => {
                            let _ = app_handle.emit(
                                &event_name,
                                AiStreamEvent::Error {
                                    message: e.to_string(),
                                },
                            );
                            return;
                        }
                    }
                }
                let _ = app_handle.emit(&event_name, AiStreamEvent::Done);
            }
            Err(e) => {
                let _ = app_handle.emit(
                    &event_name,
                    AiStreamEvent::Error {
                        message: e.to_string(),
                    },
                );
            }
        }
    });

    Ok(())
}

fn build_client(cfg: &AiConfig) -> Client {
    let api_key = cfg.api_key.clone();
    let base_url = cfg.base_url.clone();
    let provider = cfg.provider.clone();

    let resolver = ServiceTargetResolver::from_resolver_fn(
        move |service_target: ServiceTarget| -> Result<ServiceTarget, genai::resolver::Error> {
            let ServiceTarget {
                mut endpoint,
                mut auth,
                model,
            } = service_target;

            // User-chosen provider always wins over genai's auto model->adapter mapping.
            // Without this, exotic model names (e.g. `deepseek-v4-flash`) fall through
            // to Ollama and try `localhost:11434`.
            let (forced_kind, default_endpoint) = match provider.as_str() {
                "openai" => (Some(AdapterKind::OpenAI), Some("https://api.openai.com/v1/")),
                "anthropic" => (Some(AdapterKind::Anthropic), Some("https://api.anthropic.com/v1/")),
                "gemini" => (
                    Some(AdapterKind::Gemini),
                    Some("https://generativelanguage.googleapis.com/v1beta/"),
                ),
                "deepseek" => (Some(AdapterKind::DeepSeek), Some("https://api.deepseek.com/v1/")),
                "groq" => (Some(AdapterKind::Groq), Some("https://api.groq.com/openai/v1/")),
                "xai" => (Some(AdapterKind::Xai), Some("https://api.x.ai/v1/")),
                "ollama" => (Some(AdapterKind::Ollama), Some("http://localhost:11434/v1/")),
                "cohere" => (Some(AdapterKind::Cohere), Some("https://api.cohere.com/v2/")),
                "custom" => (Some(AdapterKind::OpenAI), None),
                _ => (None, None),
            };

            let model = if let Some(kind) = forced_kind {
                ModelIden::new(kind, model.model_name)
            } else {
                model
            };

            if !base_url.is_empty() {
                endpoint = Endpoint::from_owned(base_url.clone());
            } else if let Some(default) = default_endpoint {
                endpoint = Endpoint::from_static(default);
            }

            if !api_key.is_empty() {
                auth = AuthData::from_single(api_key.clone());
            }

            Ok(ServiceTarget {
                endpoint,
                auth,
                model,
            })
        },
    );

    Client::builder()
        .with_service_target_resolver(resolver)
        .build()
}
