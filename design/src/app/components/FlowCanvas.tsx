import { useRef, useEffect } from 'react';
import {
  MessageCircle, GitBranch, Image as ImageIcon, User, Music, Film, Tag,
  ArrowRight, Type, Monitor, Variable, Keyboard, Wand2, Move, Award,
} from 'lucide-react';
import type { WebGalNode, WebGalCommandType } from '../lib/webgal-types';
import { commandLabels } from '../lib/webgal-types';

interface FlowCanvasProps {
  nodes: WebGalNode[];
  selectedNode: WebGalNode | null;
  onSelectNode: (node: WebGalNode) => void;
  onUpdateNode: (id: string, updates: Partial<WebGalNode>) => void;
}

const commandIcons: Partial<Record<WebGalCommandType, typeof MessageCircle>> = {
  dialogue: MessageCircle,
  narrator: Type,
  intro: Monitor,
  choose: GitBranch,
  changeBg: ImageIcon,
  changeFigure: User,
  miniAvatar: User,
  changeScene: ArrowRight,
  callScene: ArrowRight,
  end: ArrowRight,
  bgm: Music,
  playEffect: Music,
  playVideo: Film,
  label: Tag,
  jumpLabel: Tag,
  setVar: Variable,
  setTextbox: Monitor,
  getUserInput: Keyboard,
  setAnimation: Wand2,
  setTransform: Move,
  unlockCg: Award,
  unlockBgm: Award,
  comment: Type,
};

const typeColors: Partial<Record<WebGalCommandType, string>> = {
  dialogue: 'border-accent bg-accent/5',
  narrator: 'border-accent bg-accent/5',
  intro: 'border-accent bg-accent/5',
  choose: 'border-primary bg-primary/5',
  changeBg: 'border-chart-5 bg-chart-5/5',
  changeFigure: 'border-chart-5 bg-chart-5/5',
  miniAvatar: 'border-chart-5 bg-chart-5/5',
  changeScene: 'border-blue-400 bg-blue-400/5',
  callScene: 'border-blue-400 bg-blue-400/5',
  end: 'border-blue-400 bg-blue-400/5',
  bgm: 'border-purple-400 bg-purple-400/5',
  playEffect: 'border-purple-400 bg-purple-400/5',
  playVideo: 'border-purple-400 bg-purple-400/5',
  label: 'border-yellow-400 bg-yellow-400/5',
  jumpLabel: 'border-yellow-400 bg-yellow-400/5',
  setVar: 'border-yellow-400 bg-yellow-400/5',
  setTextbox: 'border-yellow-400 bg-yellow-400/5',
  getUserInput: 'border-yellow-400 bg-yellow-400/5',
  setAnimation: 'border-primary bg-primary/5',
  setTransform: 'border-primary bg-primary/5',
  unlockCg: 'border-primary bg-primary/5',
  unlockBgm: 'border-primary bg-primary/5',
  comment: 'border-muted bg-muted/5',
};

const typeGlows: Partial<Record<WebGalCommandType, string>> = {
  dialogue: 'shadow-[0_0_15px_rgba(201,148,74,0.12)]',
  choose: 'shadow-[0_0_15px_rgba(212,165,116,0.15)]',
  changeBg: 'shadow-[0_0_15px_rgba(124,152,133,0.12)]',
  changeScene: 'shadow-[0_0_15px_rgba(96,165,250,0.12)]',
  bgm: 'shadow-[0_0_15px_rgba(192,132,252,0.12)]',
  label: 'shadow-[0_0_15px_rgba(250,204,21,0.12)]',
  comment: 'shadow-none',
};

function getNodeSummary(node: WebGalNode): string {
  switch (node.type) {
    case 'dialogue':
      return node.content || '(空对话)';
    case 'narrator':
      return node.content || '(空旁白)';
    case 'changeBg':
      return node.asset || node.content || 'none';
    case 'changeFigure':
      return `${node.asset || node.content || 'none'}${node.figurePosition && node.figurePosition !== 'center' ? ` [${node.figurePosition}]` : ''}`;
    case 'choose':
      return node.choices?.map(c => c.text).join(' | ') || '';
    case 'changeScene':
    case 'callScene':
      return `→ ${node.targetScene || node.content}`;
    case 'label':
      return `# ${node.labelName || node.content}`;
    case 'jumpLabel':
      return `→ ${node.labelName || node.content}`;
    case 'setVar':
      return node.varName ? `${node.varName} = ${node.varValue}` : node.content;
    case 'intro':
      return node.introLines?.join(' | ') || node.content;
    case 'bgm':
    case 'playEffect':
      return node.asset || node.content || 'none';
    case 'setAnimation':
      return `${node.animationName || node.content}${node.animationTarget ? ` → ${node.animationTarget}` : ''}`;
    case 'comment':
      return node.content;
    case 'end':
      return '场景结束';
    default:
      return node.content || '—';
  }
}

export function FlowCanvas({ nodes, selectedNode, onSelectNode }: FlowCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    svg.innerHTML = '';

    nodes.forEach(node => {
      node.connections.forEach(targetId => {
        const target = nodes.find(n => n.id === targetId);
        if (!target) return;

        const startX = node.position.x + 140;
        const startY = node.position.y + 44;
        const endX = target.position.x + 140;
        const endY = target.position.y;

        const midY = (startY + endY) / 2;

        // Glow
        const glow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        glow.setAttribute('d', `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`);
        glow.setAttribute('stroke', 'rgba(212, 165, 116, 0.08)');
        glow.setAttribute('stroke-width', '6');
        glow.setAttribute('fill', 'none');
        glow.setAttribute('filter', 'blur(3px)');
        svg.appendChild(glow);

        // Line
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`);
        path.setAttribute('stroke', 'rgba(212, 165, 116, 0.25)');
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('fill', 'none');
        svg.appendChild(path);

        // Arrow
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const size = 6;
        arrow.setAttribute('points', `${endX},${endY} ${endX - size},${endY - size * 1.5} ${endX + size},${endY - size * 1.5}`);
        arrow.setAttribute('fill', 'rgba(212, 165, 116, 0.4)');
        svg.appendChild(arrow);
      });
    });
  }, [nodes]);

  return (
    <div className="flex-1 relative overflow-hidden bg-background/50">
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(212, 165, 116, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212, 165, 116, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px',
        }}
      />
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      {/* Canvas */}
      <div ref={canvasRef} className="relative size-full overflow-auto">
        <div className="relative min-w-[2000px] min-h-[1500px] p-8">
          <svg
            ref={svgRef}
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%' }}
          />

          {nodes.map((node) => {
            const Icon = commandIcons[node.type] || Type;
            const isSelected = selectedNode?.id === node.id;
            const colors = typeColors[node.type] || 'border-border bg-card/50';
            const glow = typeGlows[node.type] || '';

            return (
              <div
                key={node.id}
                onClick={() => onSelectNode(node)}
                className={`
                  absolute w-[280px] cursor-pointer transition-all duration-200
                  ${isSelected ? 'z-10 scale-[1.03]' : 'z-0 hover:scale-[1.01]'}
                `}
                style={{ left: node.position.x, top: node.position.y }}
              >
                <div
                  className={`
                    px-4 py-3 rounded-lg border backdrop-blur-sm transition-all
                    ${colors}
                    ${isSelected
                      ? 'border-primary shadow-[0_0_25px_rgba(212,165,116,0.3)]'
                      : glow
                    }
                  `}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className={`p-1.5 rounded ${isSelected ? 'bg-primary/20' : 'bg-background/50'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                        {commandLabels[node.type]}
                      </div>
                    </div>
                    {node.character && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent shrink-0">
                        {node.character}
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-foreground/80 line-clamp-2" style={{ fontFamily: 'var(--font-body)' }}>
                    {getNodeSummary(node) || '(空)'}
                  </p>

                  {node.type === 'choose' && node.choices && node.choices.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {node.choices.map((choice, idx) => (
                        <div key={idx} className="text-xs px-2 py-1 rounded bg-primary/10 text-primary/80 truncate">
                          → {choice.text}{choice.target ? ` → ${choice.target}` : ''}
                        </div>
                      ))}
                    </div>
                  )}

                  {node.next && (
                    <div className="mt-1.5 text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                      -next
                    </div>
                  )}

                  {/* Connection points */}
                  <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-3 h-3 rounded-full bg-primary/60 border-2 border-background" />
                  <div className="absolute left-1/2 -translate-x-1/2 -top-2 w-3 h-3 rounded-full bg-primary/40 border-2 border-background" />
                </div>
              </div>
            );
          })}

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-5xl mb-4 opacity-20">📖</div>
                <p className="text-lg text-muted-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  开始编织你的故事
                </p>
                <p className="text-sm text-muted-foreground">
                  从左侧添加 WebGAL 指令，或导入 .txt 场景文件
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mini Map */}
      <div className="absolute bottom-4 right-4 w-44 h-28 bg-card/80 backdrop-blur-sm border border-border rounded-lg p-2">
        <div className="text-[10px] text-muted-foreground mb-1" style={{ fontFamily: 'var(--font-mono)' }}>
          画布总览
        </div>
        <div className="relative w-full h-full bg-background/50 rounded">
          {nodes.map(node => (
            <div
              key={node.id}
              className={`absolute w-1.5 h-1.5 rounded-full ${selectedNode?.id === node.id ? 'bg-primary' : 'bg-muted-foreground/50'}`}
              style={{
                left: `${(node.position.x / 2000) * 100}%`,
                top: `${(node.position.y / 1500) * 100}%`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
