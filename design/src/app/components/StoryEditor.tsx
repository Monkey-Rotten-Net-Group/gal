import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Sparkles, Save, Play, Plus, Settings, Image, ArrowLeft } from 'lucide-react';
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
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

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
              <button
                onClick={() => setAiPanelOpen(!aiPanelOpen)}
                className="px-4 py-2 rounded-md bg-primary text-primary-foreground flex items-center gap-2 hover:opacity-90 transition-all hover:shadow-[0_0_20px_rgba(212,165,116,0.4)]"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI 助手</span>
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
        <div className="flex-1 flex overflow-hidden relative">
          {/* AI Panel Overlay */}
          {aiPanelOpen && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="w-full max-w-2xl bg-card border border-primary/30 rounded-lg shadow-[0_0_40px_rgba(212,165,116,0.3)] p-8 animate-in fade-in duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-full bg-primary/20">
                    <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                  </div>
                  <h2 className="text-2xl" style={{ fontFamily: 'var(--font-display)' }}>AI 创作助手</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">输入你的创作想法</label>
                    <textarea
                      className="w-full h-32 bg-input-background border border-border rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                      placeholder="例如：生成一段关于主角在雨中独自思考人生的场景..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button className="px-4 py-3 rounded-md bg-secondary hover:bg-secondary/70 transition-all border border-border">
                      生成对话
                    </button>
                    <button className="px-4 py-3 rounded-md bg-secondary hover:bg-secondary/70 transition-all border border-border">
                      生成场景
                    </button>
                    <button className="px-4 py-3 rounded-md bg-secondary hover:bg-secondary/70 transition-all border border-border">
                      生成选项
                    </button>
                    <button className="px-4 py-3 rounded-md bg-secondary hover:bg-secondary/70 transition-all border border-border">
                      续写剧情
                    </button>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button className="flex-1 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-all">
                      生成
                    </button>
                    <button
                      onClick={() => setAiPanelOpen(false)}
                      className="px-4 py-2 rounded-md border border-border hover:bg-secondary/50 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Left Panel - Node List */}
          <NodePanel
            nodes={nodes}
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
            onAddNode={addNode}
          />

          {/* Center - Flow Canvas */}
          <FlowCanvas
            nodes={nodes}
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
            onUpdateNode={updateNode}
          />

          {/* Right Panel - Details */}
          <DetailPanel
            node={selectedNode}
            onUpdateNode={(updates) => {
              if (selectedNode) {
                updateNode(selectedNode.id, updates);
              }
            }}
          />
        </div>
      </div>
    </DndProvider>
  );
}