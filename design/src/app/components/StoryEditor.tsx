import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  Sparkles, Save, Play, Settings, Image, ArrowLeft, Send,
  Upload, Download, FileText, FolderOpen, FilePlus, Check, Loader2, SlidersHorizontal,
} from 'lucide-react';
import { open as openDialog, save as saveDialog } from '@tauri-apps/plugin-dialog';
import { NodePanel } from './NodePanel';
import { FlowCanvas } from './FlowCanvas';
import { DetailPanel } from './DetailPanel';
import { AiSettingsDialog } from './AiSettingsDialog';
import { PreviewOverlay } from './PreviewOverlay';
import { AppSettingsDialog } from './AppSettingsDialog';
import type { WebGalNode, WebGalCommandType } from '../lib/webgal-types';
import {
  parseScene, serializeScene, saveScene, loadScene,
  openProject, getScenePath, createScene,
  type ProjectInfo,
} from '../lib/webgal-ipc';
import { aiChatStream, type AiChatMessage } from '../lib/ai-ipc';

interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const DEMO_SCRIPT = `; 序章 —— 宁静的午后
changeBg:afternoon_park.webp -next;
bgm:peaceful_afternoon.mp3;
changeFigure:girl_smile.webp -left -next;
setAnimation:enter-from-left -target=fig-left -next;
未知少女:你好，我是……;
未知少女:你也是这个学校的学生吗？;
:这时候，一阵微风吹过，带来了樱花的香气;
choose:友好地打招呼:branch_friendly.txt|保持沉默:branch_silent.txt;
`;

export function StoryEditor() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();

  // Project state
  const [projectPath, setProjectPath] = useState<string | null>(null);
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);
  const [currentSceneName, setCurrentSceneName] = useState('start.txt');
  const [dirty, setDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  // Editor state
  const [nodes, setNodes] = useState<WebGalNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<WebGalNode | null>(null);
  const [scriptSource, setScriptSource] = useState(DEMO_SCRIPT);
  const [showScript, setShowScript] = useState(false);
  const [loading, setLoading] = useState(true);

  // AI state
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是 AI 创作助手。我可以帮你生成 WebGAL 脚本——对话、场景切换、选项分支等。请告诉我你需要什么帮助？',
    },
  ]);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSettingsOpen, setAiSettingsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [appSettingsOpen, setAppSettingsOpen] = useState(false);
  const aiCancelRef = useRef<(() => void) | null>(null);
  const aiStreamingIdRef = useRef<string | null>(null);
  const aiMessagesEndRef = useRef<HTMLDivElement | null>(null);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // ---------------------------------------------------------------------------
  // Initialization: try to load project from localStorage or URL params
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const init = async () => {
      // Try to restore project path from localStorage
      const storedPath = localStorage.getItem(`project-path-${projectId}`);
      const sceneName = searchParams.get('scene') || 'start.txt';
      setCurrentSceneName(sceneName);

      if (storedPath) {
        try {
          const info = await openProject(storedPath);
          setProjectPath(storedPath);
          setProjectInfo(info);

          // Load the scene file
          const scenePath = await getScenePath(storedPath, sceneName);
          try {
            const loaded = await loadScene(scenePath);
            setNodes(loaded);
            const text = await serializeScene(loaded);
            setScriptSource(text);
          } catch {
            // Scene doesn't exist yet, start with empty
            const parsed = await parseScene(DEMO_SCRIPT);
            setNodes(parsed);
            setScriptSource(DEMO_SCRIPT);
          }
        } catch {
          // Stored path no longer valid — fall back to demo
          const parsed = await parseScene(DEMO_SCRIPT);
          setNodes(parsed);
        }
      } else {
        // No project path — just load demo script
        const parsed = await parseScene(DEMO_SCRIPT);
        setNodes(parsed);
      }

      setLoading(false);
    };
    init();
  }, [projectId, searchParams]);

  // ---------------------------------------------------------------------------
  // Sync nodes → script text
  // ---------------------------------------------------------------------------
  const syncScript = useCallback(async (nextNodes: WebGalNode[]) => {
    try {
      const text = await serializeScene(nextNodes);
      setScriptSource(text);
    } catch {
      // keep stale
    }
  }, []);

  // Mark dirty on any node change
  const markDirty = useCallback(() => {
    setDirty(true);
    setSaveStatus('idle');
  }, []);

  // ---------------------------------------------------------------------------
  // Node CRUD
  // ---------------------------------------------------------------------------
  const updateNode = useCallback((id: string, updates: Partial<WebGalNode>) => {
    setNodes(prev => {
      const next = prev.map(n => n.id === id ? { ...n, ...updates } : n);
      syncScript(next);
      return next;
    });
    setSelectedNode(prev => prev && prev.id === id ? { ...prev, ...updates } : prev);
    markDirty();
  }, [syncScript, markDirty]);

  const deleteNode = useCallback((id: string) => {
    setNodes(prev => {
      const next = prev
        .filter(n => n.id !== id)
        .map(n => ({ ...n, connections: n.connections.filter(c => c !== id) }));
      syncScript(next);
      return next;
    });
    setSelectedNode(null);
    markDirty();
  }, [syncScript, markDirty]);

  const addNode = useCallback((type: WebGalCommandType) => {
    setNodes(prev => {
      const id = Date.now().toString();
      const lastNode = prev[prev.length - 1];
      const newNode: WebGalNode = {
        id,
        type,
        content: '',
        flags: [],
        position: {
          x: lastNode ? lastNode.position.x : 100,
          y: lastNode ? lastNode.position.y + 110 : 60,
        },
        connections: [],
      };
      if (type === 'dialogue') newNode.character = '';
      if (type === 'choose') newNode.choices = [{ text: '选项1', target: '' }];
      if (type === 'intro') newNode.introLines = [''];
      if (type === 'setVar') { newNode.varName = ''; newNode.varValue = ''; }

      const terminalTypes = new Set(['choose', 'changeScene', 'end', 'jumpLabel']);
      const updated = [...prev];
      if (lastNode && !terminalTypes.has(lastNode.type)) {
        const lastIdx = updated.findIndex(n => n.id === lastNode.id);
        if (lastIdx >= 0) {
          updated[lastIdx] = {
            ...updated[lastIdx],
            connections: [...updated[lastIdx].connections, id],
          };
        }
      }
      updated.push(newNode);
      syncScript(updated);
      setSelectedNode(newNode);
      return updated;
    });
    markDirty();
  }, [syncScript, markDirty]);

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------
  const handleSave = useCallback(async () => {
    setSaveStatus('saving');
    try {
      if (projectPath) {
        // Save to project's game/scene/ directory
        const scenePath = await getScenePath(projectPath, currentSceneName);
        await saveScene(scenePath, nodes);
      } else {
        // No project open — prompt user to pick a save location
        const selected = await saveDialog({
          title: '保存场景文件',
          defaultPath: currentSceneName,
          filters: [{ name: 'WebGAL Scene', extensions: ['txt'] }],
        });
        if (!selected) {
          setSaveStatus('idle');
          return;
        }
        await saveScene(selected, nodes);
      }
      setDirty(false);
      setSaveStatus('saved');
      // Reset status after 2s
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      console.error('Save failed:', e);
      setSaveStatus('error');
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [projectPath, currentSceneName, nodes]);

  // Ctrl+S / Cmd+S shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  // ---------------------------------------------------------------------------
  // Open project folder
  // ---------------------------------------------------------------------------
  const handleOpenProject = useCallback(async () => {
    const selected = await openDialog({
      title: '选择 WebGAL 项目文件夹',
      directory: true,
    });
    if (!selected) return;

    try {
      const info = await openProject(selected);
      setProjectPath(selected);
      setProjectInfo(info);
      localStorage.setItem(`project-path-${projectId}`, selected);

      // Load start.txt or first available scene
      const sceneName = info.scenes.includes('start.txt')
        ? 'start.txt'
        : info.scenes[0] || 'start.txt';
      setCurrentSceneName(sceneName);

      const scenePath = await getScenePath(selected, sceneName);
      try {
        const loaded = await loadScene(scenePath);
        setNodes(loaded);
        const text = await serializeScene(loaded);
        setScriptSource(text);
        setDirty(false);
      } catch {
        // empty scene
        setNodes([]);
        setScriptSource('');
      }
    } catch (e) {
      console.error('Open project failed:', e);
    }
  }, [projectId]);

  // ---------------------------------------------------------------------------
  // Switch scene within project
  // ---------------------------------------------------------------------------
  const handleSwitchScene = useCallback(async (sceneName: string) => {
    if (!projectPath) return;
    // Auto-save current if dirty
    if (dirty) {
      const scenePath = await getScenePath(projectPath, currentSceneName);
      await saveScene(scenePath, nodes);
    }

    setCurrentSceneName(sceneName);
    const scenePath = await getScenePath(projectPath, sceneName);
    try {
      const loaded = await loadScene(scenePath);
      setNodes(loaded);
      const text = await serializeScene(loaded);
      setScriptSource(text);
      setSelectedNode(null);
      setDirty(false);
    } catch {
      setNodes([]);
      setScriptSource('');
    }
  }, [projectPath, currentSceneName, dirty, nodes]);

  // ---------------------------------------------------------------------------
  // Create new scene
  // ---------------------------------------------------------------------------
  const handleNewScene = useCallback(async () => {
    if (!projectPath) return;
    const name = prompt('新场景文件名 (不含 .txt 后缀):');
    if (!name) return;
    try {
      await createScene(projectPath, name);
      // Refresh project info
      const info = await openProject(projectPath);
      setProjectInfo(info);
      // Switch to new scene
      const sceneName = name.endsWith('.txt') ? name : `${name}.txt`;
      await handleSwitchScene(sceneName);
    } catch (e) {
      console.error('Create scene failed:', e);
    }
  }, [projectPath, handleSwitchScene]);

  // ---------------------------------------------------------------------------
  // Import / Export / Apply script
  // ---------------------------------------------------------------------------
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      setScriptSource(text);
      const parsed = await parseScene(text);
      setNodes(parsed);
      setSelectedNode(null);
      markDirty();
    };
    input.click();
  }, [markDirty]);

  const handleExport = useCallback(async () => {
    const text = await serializeScene(nodes);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentSceneName;
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, currentSceneName]);

  const handleApplyScript = useCallback(async () => {
    const parsed = await parseScene(scriptSource);
    setNodes(parsed);
    setSelectedNode(null);
    setShowScript(false);
    markDirty();
  }, [scriptSource, markDirty]);

  // ---------------------------------------------------------------------------
  // AI chat
  // ---------------------------------------------------------------------------
  useEffect(() => {
    aiMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [aiMessages]);

  // Cancel in-flight stream on unmount
  useEffect(() => () => { aiCancelRef.current?.(); }, []);

  const buildAiPayload = useCallback(
    (history: AiMessage[], next: string): AiChatMessage[] => {
      const recent = history.slice(-12); // cap context
      const payload: AiChatMessage[] = recent.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      payload.push({ role: 'user', content: next });
      return payload;
    },
    [],
  );

  const sendAiPrompt = useCallback(async (prompt: string) => {
    const text = prompt.trim();
    if (!text || aiBusy) return;
    setAiError(null);

    const userId = `u-${Date.now()}`;
    const assistantId = `a-${Date.now() + 1}`;
    aiStreamingIdRef.current = assistantId;

    const newHistory: AiMessage[] = [
      ...aiMessages,
      { id: userId, role: 'user', content: text },
      { id: assistantId, role: 'assistant', content: '' },
    ];
    setAiMessages(newHistory);
    setAiInput('');
    setAiBusy(true);

    const appendChunk = (chunk: string) => {
      setAiMessages(prev =>
        prev.map(m => (m.id === assistantId ? { ...m, content: m.content + chunk } : m)),
      );
    };

    try {
      const { cancel } = await aiChatStream(buildAiPayload(aiMessages, text), {
        onChunk: appendChunk,
        onDone: () => {
          aiCancelRef.current = null;
          aiStreamingIdRef.current = null;
          setAiBusy(false);
        },
        onError: (msg) => {
          aiCancelRef.current = null;
          aiStreamingIdRef.current = null;
          setAiBusy(false);
          setAiError(msg);
          setAiMessages(prev =>
            prev.map(m =>
              m.id === assistantId && !m.content
                ? { ...m, content: `（出错：${msg}）` }
                : m,
            ),
          );
        },
      });
      aiCancelRef.current = cancel;
    } catch (e) {
      setAiBusy(false);
      setAiError(String(e));
    }
  }, [aiBusy, aiMessages, buildAiPayload]);

  const handleAiSend = () => { void sendAiPrompt(aiInput); };

  const handleQuickAction = (text: string) => {
    if (aiBusy) return;
    setAiInput(text);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const gameName = projectInfo?.config?.Game_name
    || (projectId === '1' ? '苍穹之下的誓言' : projectId === '2' ? '雨夜侦探' : projectId === '3' ? '夏日回忆' : '新项目');

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-md hover:bg-secondary/50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="h-6 w-px bg-border" />
              <h1 className="text-2xl tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                故事编织室
              </h1>
              <div className="h-6 w-px bg-border" />
              <span className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                {gameName}
              </span>

              {/* Scene selector */}
              {projectInfo && projectInfo.scenes.length > 0 && (
                <>
                  <div className="h-6 w-px bg-border" />
                  <select
                    value={currentSceneName}
                    onChange={(e) => handleSwitchScene(e.target.value)}
                    className="px-2 py-1 text-sm bg-secondary border border-border rounded-md"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {projectInfo.scenes.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleNewScene}
                    className="p-1.5 rounded-md hover:bg-secondary/50 transition-colors"
                    title="新建场景"
                  >
                    <FilePlus className="w-4 h-4 text-muted-foreground" />
                  </button>
                </>
              )}

              {dirty && (
                <span className="text-xs text-muted-foreground">未保存</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenProject}
                className="px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/70 transition-colors flex items-center gap-2 text-sm"
                title="打开 WebGAL 项目文件夹"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>打开项目</span>
              </button>
              <button
                onClick={handleImport}
                className="px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/70 transition-colors flex items-center gap-2 text-sm"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>导入</span>
              </button>
              <button
                onClick={handleExport}
                className="px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/70 transition-colors flex items-center gap-2 text-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>导出</span>
              </button>
              <button
                onClick={() => setShowScript(!showScript)}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 text-sm ${
                  showScript ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/70'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>脚本</span>
              </button>
              <div className="h-6 w-px bg-border mx-1" />
              <button
                onClick={() => navigate(`/editor/${projectId}/assets`)}
                className="px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/70 transition-colors flex items-center gap-2 text-sm"
              >
                <Image className="w-3.5 h-3.5" />
                <span>素材库</span>
              </button>
              <button
                onClick={() => setAiSettingsOpen(true)}
                className="p-2 rounded-md hover:bg-secondary/50 transition-colors"
                title="AI 设置"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => setAppSettingsOpen(true)}
                className="p-2 rounded-md hover:bg-secondary/50 transition-colors"
                title="编辑器设置"
              >
                <SlidersHorizontal className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewOpen(true)}
                className="p-2 rounded-md hover:bg-secondary/50 transition-colors"
                title="预览场景"
              >
                <Play className="w-4 h-4" />
              </button>

              {/* Save button with status */}
              <button
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
                className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 text-sm ${
                  saveStatus === 'saved'
                    ? 'bg-chart-5/20 text-chart-5'
                    : saveStatus === 'error'
                    ? 'bg-destructive/20 text-destructive'
                    : dirty
                    ? 'bg-primary text-primary-foreground hover:opacity-90'
                    : 'bg-secondary hover:bg-secondary/70'
                }`}
              >
                {saveStatus === 'saving' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : saveStatus === 'saved' ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>
                  {saveStatus === 'saving' ? '保存中' : saveStatus === 'saved' ? '已保存' : saveStatus === 'error' ? '保存失败' : '保存'}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Node List + Detail */}
          <div className="flex">
            <NodePanel
              nodes={nodes}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              onAddNode={addNode}
            />

            {selectedNode && (
              <DetailPanel
                node={selectedNode}
                onUpdateNode={(updates) => updateNode(selectedNode.id, updates)}
                onDeleteNode={() => deleteNode(selectedNode.id)}
                onClose={() => setSelectedNode(null)}
              />
            )}
          </div>

          {/* Center - Flow Canvas or Script Editor */}
          {showScript ? (
            <div className="flex-1 flex flex-col bg-background/50">
              <div className="p-3 border-b border-border flex items-center justify-between">
                <span className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                  WebGAL 脚本编辑器 — {currentSceneName}
                </span>
                <button
                  onClick={handleApplyScript}
                  className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-all text-sm"
                >
                  应用更改
                </button>
              </div>
              <textarea
                value={scriptSource}
                onChange={(e) => setScriptSource(e.target.value)}
                className="flex-1 p-4 bg-transparent resize-none focus:outline-none text-sm leading-relaxed"
                style={{ fontFamily: 'var(--font-mono)' }}
                spellCheck={false}
              />
            </div>
          ) : (
            <FlowCanvas
              nodes={nodes}
              selectedNode={selectedNode}
              onSelectNode={setSelectedNode}
              onUpdateNode={updateNode}
            />
          )}

          {/* Right Panel - AI Chat */}
          <div className="w-80 border-l border-border bg-card/30 backdrop-blur-sm flex flex-col">
            <div className="p-4 border-b border-border flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <h3 className="text-sm uppercase tracking-widest text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                AI 创作助手
              </h3>
            </div>

            {/* Quick Actions */}
            <div className="p-3 border-b border-border">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '生成对话', text: '请生成一段两位角色的日常对话，至少 6 行，包含称呼。' },
                  { label: '生成场景', text: '请生成一个新场景的开头：换背景、播放 BGM、加入立绘并写一段开场旁白。' },
                  { label: '生成分支', text: '请基于当前剧情写一个 choose 选项，包含 2-3 个分支并指向对应 .txt 文件。' },
                  { label: '续写剧情', text: '请基于当前已有的剧情上下文继续往下写一段 8 行左右的对话。' },
                ].map((a) => (
                  <button
                    key={a.label}
                    onClick={() => handleQuickAction(a.text)}
                    disabled={aiBusy}
                    className="px-2 py-1.5 rounded text-xs bg-secondary hover:bg-secondary/70 transition-all border border-border disabled:opacity-50"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {aiMessages.map((msg) => {
                const isStreaming = aiBusy && aiStreamingIdRef.current === msg.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap break-words ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary border border-border'
                      }`}
                      style={{ fontFamily: msg.role === 'assistant' ? 'var(--font-mono)' : 'var(--font-body)' }}
                    >
                      {msg.content || (isStreaming ? '正在思考…' : '')}
                      {isStreaming && msg.content && <span className="inline-block w-2 h-3 ml-1 bg-current align-middle animate-pulse" />}
                    </div>
                  </div>
                );
              })}
              {aiError && (
                <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                  {aiError}
                  <button
                    onClick={() => setAiSettingsOpen(true)}
                    className="ml-2 underline hover:no-underline"
                  >
                    打开设置
                  </button>
                </div>
              )}
              <div ref={aiMessagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border">
              <textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAiSend();
                  }
                }}
                disabled={aiBusy}
                className="w-full h-20 bg-input-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none disabled:opacity-60"
                placeholder={aiBusy ? '正在生成中…' : '输入你的创作想法...'}
              />
              {aiBusy ? (
                <button
                  onClick={() => { aiCancelRef.current?.(); aiCancelRef.current = null; aiStreamingIdRef.current = null; setAiBusy(false); }}
                  className="mt-2 w-full px-3 py-2 rounded-md bg-secondary hover:bg-secondary/70 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>停止</span>
                </button>
              ) : (
                <button
                  onClick={handleAiSend}
                  disabled={!aiInput.trim()}
                  className="mt-2 w-full px-3 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>发送</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <AiSettingsDialog
          open={aiSettingsOpen}
          onClose={() => setAiSettingsOpen(false)}
        />

        <AppSettingsDialog
          open={appSettingsOpen}
          onClose={() => setAppSettingsOpen(false)}
          onOpenAiSettings={() => setAiSettingsOpen(true)}
        />

        {previewOpen && projectPath && (
          <PreviewOverlay
            nodes={nodes}
            projectPath={projectPath}
            onClose={() => setPreviewOpen(false)}
          />
        )}
      </div>
    </DndProvider>
  );
}
