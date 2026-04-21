import { MessageCircle, GitBranch, Image, User } from 'lucide-react';
import { StoryNode } from './StoryEditor';

interface NodePanelProps {
  nodes: StoryNode[];
  selectedNode: StoryNode | null;
  onSelectNode: (node: StoryNode) => void;
  onAddNode: (type: StoryNode['type']) => void;
}

const nodeTypeIcons = {
  dialogue: MessageCircle,
  choice: GitBranch,
  scene: Image,
  character: User,
};

const nodeTypeLabels = {
  dialogue: '对话',
  choice: '选项',
  scene: '场景',
  character: '角色',
};

const nodeTypeColors = {
  dialogue: 'text-accent',
  choice: 'text-primary',
  scene: 'text-chart-5',
  character: 'text-destructive',
};

export function NodePanel({ nodes, selectedNode, onSelectNode, onAddNode }: NodePanelProps) {
  return (
    <div className="w-64 border-r border-border bg-card/30 backdrop-blur-sm flex flex-col">
      <div className="p-4 border-b border-border">
        <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
          节点列表
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onAddNode('dialogue')}
            className="p-2 rounded border border-border hover:border-accent hover:bg-accent/10 transition-all flex flex-col items-center gap-1 group"
          >
            <MessageCircle className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
            <span className="text-xs">对话</span>
          </button>
          <button
            onClick={() => onAddNode('choice')}
            className="p-2 rounded border border-border hover:border-primary hover:bg-primary/10 transition-all flex flex-col items-center gap-1 group"
          >
            <GitBranch className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-xs">选项</span>
          </button>
          <button
            onClick={() => onAddNode('scene')}
            className="p-2 rounded border border-border hover:border-chart-5 hover:bg-chart-5/10 transition-all flex flex-col items-center gap-1 group"
          >
            <Image className="w-4 h-4 text-muted-foreground group-hover:text-chart-5 transition-colors" />
            <span className="text-xs">场景</span>
          </button>
          <button
            onClick={() => onAddNode('character')}
            className="p-2 rounded border border-border hover:border-destructive hover:bg-destructive/10 transition-all flex flex-col items-center gap-1 group"
          >
            <User className="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors" />
            <span className="text-xs">角色</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {nodes.map((node) => {
          const Icon = nodeTypeIcons[node.type];
          const isSelected = selectedNode?.id === node.id;

          return (
            <button
              key={node.id}
              onClick={() => onSelectNode(node)}
              className={`
                w-full p-3 rounded border transition-all text-left
                ${isSelected
                  ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(212,165,116,0.2)]'
                  : 'border-border hover:border-primary/50 hover:bg-secondary/50'
                }
              `}
            >
              <div className="flex items-start gap-2">
                <Icon className={`w-4 h-4 mt-0.5 ${nodeTypeColors[node.type]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                      {nodeTypeLabels[node.type]}
                    </span>
                  </div>
                  <div className="font-medium truncate mb-1 text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                    {node.title}
                  </div>
                  <div className="text-xs text-muted-foreground line-clamp-2">
                    {node.content || '无内容'}
                  </div>
                  {node.character && (
                    <div className="text-xs text-accent mt-1">
                      {node.character}
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="p-3 border-t border-border">
        <div className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
          共 {nodes.length} 个节点
        </div>
      </div>
    </div>
  );
}
