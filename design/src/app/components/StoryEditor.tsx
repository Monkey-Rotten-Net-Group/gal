import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Sparkles, Save, Play, Settings, Image, ArrowLeft, Send } from 'lucide-react';
import { NodePanel } from './NodePanel';
import { FlowCanvas } from './FlowCanvas';
import { DetailPanel } from './DetailPanel';

export interface StoryNode {
  id: string;
  type: 'dialogue' | 'choice' | 'scene' | 'character';
  title: string;
  content: string;
  position: { x: number; y: number };
  connections: string[];
  character?: string;
  choices?: { text: string; next: string }[];
}

interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function StoryEditor() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [nodes, setNodes] = useState<StoryNode[]>([
    {
      id: '1',
      type: 'scene',
      title: '序章',
      content: '故事从一个宁静的午后开始...',
      position: { x: 100, y: 100 },
      connections: ['2'],
    },
    {
      id: '2',
      type: 'dialogue',
      title: '初次相遇',
      content: '你好，我是...',
      character: '未知少女',
      position: { x: 400, y: 100 },
      connections: ['3'],
    },
    {
      id: '3',
      type: 'choice',
      title: '回应',
      content: '如何回应她的问候？',
      position: { x: 700, y: 100 },
      connections: [],
      choices: [
        { text: '友好地打招呼', next: '4a' },
        { text: '保持沉默', next: '4b' },
      ],
    },
  ]);

  const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是 AI 创作助手。我可以帮你生成对话、场景描述、选项分支，或者续写剧情。请告诉我你需要什么帮助？',
    },
  ]);

  const updateNode = (id: string, updates: Partial<StoryNode>) => {
    setNodes(nodes.map(node => node.id === id ? { ...node, ...updates } : node));
  };

  const addNode = (type: StoryNode['type']) => {
    const newNode: StoryNode = {
      id: Date.now().toString(),
      type,
      title: `新${type === 'dialogue' ? '对话' : type === 'choice' ? '选项' : type === 'scene' ? '场景' : '角色'}`,
      content: '',
      position: { x: 200 + nodes.length * 50, y: 200 + nodes.length * 30 },
      connections: [],
    };
    setNodes([...nodes, newNode]);
    setSelectedNode(newNode);
  };

  const handleAiSend = () => {
    if (!aiInput.trim()) return;
    const userMsg: AiMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: aiInput,
    };
    const assistantMsg: AiMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '正在思考中...',
    };
    setAiMessages([...aiMessages, userMsg, assistantMsg]);
    setAiInput('');
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full flex flex-col bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-md hover:bg-secondary/50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="h-6 w-px bg-border" />
              <h1
                className="text-3xl tracking-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                故事编织室
              </h1>
              <div className="h-6 w-px bg-border" />
              <span className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                {projectId === '1' ? '苍穹之下的誓言' : projectId === '2' ? '雨夜侦探' : projectId === '3' ? '夏日回忆' : '新项目'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/editor/${projectId}/assets`)}
                className="px-4 py-2 rounded-md bg-secondary hover:bg-secondary/70 transition-colors flex items-center gap-2"
              >
                <Image className="w-4 h-4" />
                <span>素材库</span>
              </button>
              <button className="p-2 rounded-md hover:bg-secondary/50 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-md hover:bg-secondary/50 transition-colors">
                <Play className="w-5 h-5" />
              </button>
              <button className="px-4 py-2 rounded-md bg-secondary hover:bg-secondary/70 transition-colors flex items-center gap-2">
                <Save className="w-4 h-4" />
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
                onUpdateNode={(updates) => {
                  updateNode(selectedNode.id, updates);
                }}
                onClose={() => setSelectedNode(null)}
              />
            )}
          </div>

          {/* Center - Flow Canvas */}
          <FlowCanvas
            nodes={nodes}
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
            onUpdateNode={updateNode}
          />

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
                  生成选项
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
              <div className="flex gap-2">
                <textarea
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAiSend();
                    }
                  }}
                  className="flex-1 h-20 bg-input-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  placeholder="输入你的创作想法..."
                />
              </div>
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
