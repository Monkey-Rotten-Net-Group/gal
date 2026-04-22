import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Sparkles, Save, Play, Settings, Image, ArrowLeft, Send, Upload, Download, FileText } from 'lucide-react';
import { NodePanel } from './NodePanel';
import { FlowCanvas } from './FlowCanvas';
import { DetailPanel } from './DetailPanel';
import type { WebGalNode, WebGalCommandType } from '../lib/webgal-types';
import { parseScene, serializeScene } from '../lib/webgal-ipc';

interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

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

  const [nodes, setNodes] = useState<WebGalNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<WebGalNode | null>(null);
  const [scriptSource, setScriptSource] = useState(DEMO_SCRIPT);
  const [showScript, setShowScript] = useState(false);
  const [loading, setLoading] = useState(true);

  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是 AI 创作助手。我可以帮你生成 WebGAL 脚本——对话、场景切换、选项分支等。请告诉我你需要什么帮助？',
    },
  ]);

  // Initial parse via backend
  useEffect(() => {
    parseScene(DEMO_SCRIPT).then((parsed) => {
      setNodes(parsed);
      setLoading(false);
    });
  }, []);

  // Sync nodes → script text (debounced via backend)
  const syncScript = useCallback(async (nextNodes: WebGalNode[]) => {
    try {
      const text = await serializeScene(nextNodes);
      setScriptSource(text);
    } catch {
      // Serialization error — keep stale script text
    }
  }, []);

  const updateNode = useCallback((id: string, updates: Partial<WebGalNode>) => {
    setNodes(prev => {
      const next = prev.map(n => n.id === id ? { ...n, ...updates } : n);
      syncScript(next);
      return next;
    });
    setSelectedNode(prev => prev && prev.id === id ? { ...prev, ...updates } : prev);
  }, [syncScript]);

  const deleteNode = useCallback((id: string) => {
    setNodes(prev => {
      const next = prev
        .filter(n => n.id !== id)
        .map(n => ({
          ...n,
          connections: n.connections.filter(c => c !== id),
        }));
      syncScript(next);
      return next;
    });
    setSelectedNode(null);
  }, [syncScript]);

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
  }, [syncScript]);

  // Import .txt via backend parse
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
    };
    input.click();
  }, []);

  // Export via backend serialize
  const handleExport = useCallback(async () => {
    const text = await serializeScene(nodes);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scene.txt';
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes]);

  // Apply script text edits via backend parse
  const handleApplyScript = useCallback(async () => {
    const parsed = await parseScene(scriptSource);
    setNodes(parsed);
    setSelectedNode(null);
    setShowScript(false);
  }, [scriptSource]);

  const handleAiSend = () => {
    if (!aiInput.trim()) return;
    const userMsg: AiMessage = { id: Date.now().toString(), role: 'user', content: aiInput };
    const assistantMsg: AiMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: '正在思考中...' };
    setAiMessages(prev => [...prev, userMsg, assistantMsg]);
    setAiInput('');
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
          正在加载场景...
        </div>
      </div>
    );
  }

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
                {projectId === '1' ? '苍穹之下的誓言' : projectId === '2' ? '雨夜侦探' : projectId === '3' ? '夏日回忆' : '新项目'}
              </span>
            </div>

            <div className="flex items-center gap-2">
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
              <button className="p-2 rounded-md hover:bg-secondary/50 transition-colors">
                <Settings className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-md hover:bg-secondary/50 transition-colors">
                <Play className="w-4 h-4" />
              </button>
              <button className="px-3 py-1.5 rounded-md bg-secondary hover:bg-secondary/70 transition-colors flex items-center gap-2 text-sm">
                <Save className="w-3.5 h-3.5" />
                <span>保存</span>
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
                  WebGAL 脚本编辑器 — scene.txt
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
                <button className="px-2 py-1.5 rounded text-xs bg-secondary hover:bg-secondary/70 transition-all border border-border">
                  生成对话
                </button>
                <button className="px-2 py-1.5 rounded text-xs bg-secondary hover:bg-secondary/70 transition-all border border-border">
                  生成场景
                </button>
                <button className="px-2 py-1.5 rounded text-xs bg-secondary hover:bg-secondary/70 transition-all border border-border">
                  生成分支
                </button>
                <button className="px-2 py-1.5 rounded text-xs bg-secondary hover:bg-secondary/70 transition-all border border-border">
                  续写剧情
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {aiMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary border border-border'
                    }`}
                    style={{ fontFamily: 'var(--font-body)' }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
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
                className="w-full h-20 bg-input-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                placeholder="输入你的创作想法..."
              />
              <button
                onClick={handleAiSend}
                className="mt-2 w-full px-3 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>发送</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
