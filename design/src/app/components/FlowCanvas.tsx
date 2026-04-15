import { useRef, useEffect } from 'react';
import { MessageCircle, GitBranch, Image, User } from 'lucide-react';
import { StoryNode } from './StoryEditor';

interface FlowCanvasProps {
  nodes: StoryNode[];
  selectedNode: StoryNode | null;
  onSelectNode: (node: StoryNode) => void;
  onUpdateNode: (id: string, updates: Partial<StoryNode>) => void;
}

const nodeTypeIcons = {
  dialogue: MessageCircle,
  choice: GitBranch,
  scene: Image,
  character: User,
};

const nodeTypeColors = {
  dialogue: 'border-accent bg-accent/5',
  choice: 'border-primary bg-primary/5',
  scene: 'border-chart-5 bg-chart-5/5',
  character: 'border-destructive bg-destructive/5',
};

const nodeTypeGlows = {
  dialogue: 'shadow-[0_0_20px_rgba(201,148,74,0.15)]',
  choice: 'shadow-[0_0_20px_rgba(212,165,116,0.2)]',
  scene: 'shadow-[0_0_20px_rgba(124,152,133,0.15)]',
  character: 'shadow-[0_0_20px_rgba(193,70,70,0.15)]',
};

export function FlowCanvas({ nodes, selectedNode, onSelectNode, onUpdateNode }: FlowCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Draw connections
    if (svgRef.current) {
      const svg = svgRef.current;
      svg.innerHTML = '';

      nodes.forEach(node => {
        node.connections.forEach(targetId => {
          const target = nodes.find(n => n.id === targetId);
          if (target) {
            const startX = node.position.x + 150;
            const startY = node.position.y + 50;
            const endX = target.position.x;
            const endY = target.position.y + 50;

            const midX = (startX + endX) / 2;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute(
              'd',
              `M ${startX} ${startY} Q ${midX} ${startY}, ${midX} ${(startY + endY) / 2} T ${endX} ${endY}`
            );
            path.setAttribute('stroke', 'rgba(212, 165, 116, 0.3)');
            path.setAttribute('stroke-width', '2');
            path.setAttribute('fill', 'none');
            path.setAttribute('class', 'transition-all duration-300');

            // Add glow effect
            const glow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            glow.setAttribute('d', path.getAttribute('d') || '');
            glow.setAttribute('stroke', 'rgba(212, 165, 116, 0.1)');
            glow.setAttribute('stroke-width', '8');
            glow.setAttribute('fill', 'none');
            glow.setAttribute('filter', 'blur(4px)');

            svg.appendChild(glow);
            svg.appendChild(path);

            // Add arrow
            const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            const angle = Math.atan2(endY - startY, endX - startX);
            const arrowSize = 8;
            const points = [
              [endX, endY],
              [
                endX - arrowSize * Math.cos(angle - Math.PI / 6),
                endY - arrowSize * Math.sin(angle - Math.PI / 6),
              ],
              [
                endX - arrowSize * Math.cos(angle + Math.PI / 6),
                endY - arrowSize * Math.sin(angle + Math.PI / 6),
              ],
            ];
            arrow.setAttribute('points', points.map(p => p.join(',')).join(' '));
            arrow.setAttribute('fill', 'rgba(212, 165, 116, 0.5)');

            svg.appendChild(arrow);
          }
        });
      });
    }
  }, [nodes]);

  return (
    <div className="flex-1 relative overflow-hidden bg-background/50">
      {/* Grid Background */}
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

      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />

      {/* Canvas */}
      <div ref={canvasRef} className="relative size-full overflow-auto">
        <div className="relative min-w-[2000px] min-h-[1500px] p-8">
          {/* SVG for connections */}
          <svg
            ref={svgRef}
            className="absolute inset-0 pointer-events-none"
            style={{ width: '100%', height: '100%' }}
          />

          {/* Nodes */}
          {nodes.map((node) => {
            const Icon = nodeTypeIcons[node.type];
            const isSelected = selectedNode?.id === node.id;

            return (
              <div
                key={node.id}
                onClick={() => onSelectNode(node)}
                className={`
                  absolute w-[280px] cursor-pointer transition-all duration-300
                  ${isSelected ? 'z-10 scale-105' : 'z-0 hover:scale-102'}
                `}
                style={{
                  left: node.position.x,
                  top: node.position.y,
                }}
              >
                <div
                  className={`
                    p-4 rounded-lg border-2 backdrop-blur-sm transition-all
                    ${nodeTypeColors[node.type]}
                    ${isSelected
                      ? 'border-primary shadow-[0_0_30px_rgba(212,165,116,0.4)]'
                      : `${nodeTypeGlows[node.type]} hover:border-opacity-100`
                    }
                  `}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2 rounded ${isSelected ? 'bg-primary/20' : 'bg-background/50'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1" style={{ fontFamily: 'var(--font-mono)' }}>
                        {node.type}
                      </div>
                      <h4 className="font-semibold truncate" style={{ fontFamily: 'var(--font-display)' }}>
                        {node.title}
                      </h4>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                    {node.content || '暂无内容'}
                  </p>

                  {node.character && (
                    <div className="text-xs px-2 py-1 rounded-full bg-accent/20 text-accent inline-block mb-2">
                      {node.character}
                    </div>
                  )}

                  {node.choices && node.choices.length > 0 && (
                    <div className="space-y-1">
                      {node.choices.map((choice, idx) => (
                        <div key={idx} className="text-xs px-2 py-1 rounded bg-primary/10 text-primary/80 truncate">
                          → {choice.text}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Connection Points */}
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                  <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                </div>
              </div>
            );
          })}

          {/* Empty State */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4 opacity-20">📖</div>
                <p className="text-xl text-muted-foreground mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  开始编织你的故事
                </p>
                <p className="text-sm text-muted-foreground">
                  从左侧添加节点开始创作
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mini Map */}
      <div className="absolute bottom-4 right-4 w-48 h-32 bg-card/80 backdrop-blur-sm border border-border rounded-lg p-2">
        <div className="text-xs text-muted-foreground mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
          画布总览
        </div>
        <div className="relative w-full h-full bg-background/50 rounded">
          {nodes.map(node => (
            <div
              key={node.id}
              className={`absolute w-2 h-2 rounded-full ${selectedNode?.id === node.id ? 'bg-primary' : 'bg-muted-foreground/50'}`}
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
