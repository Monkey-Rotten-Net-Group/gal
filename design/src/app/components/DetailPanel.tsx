import { StoryNode } from './StoryEditor';
import { Sparkles, Trash2, Plus, X } from 'lucide-react';

interface DetailPanelProps {
  node: StoryNode;
  onUpdateNode: (updates: Partial<StoryNode>) => void;
  onClose: () => void;
}

export function DetailPanel({ node, onUpdateNode, onClose }: DetailPanelProps) {
  const addChoice = () => {
    const choices = node.choices || [];
    onUpdateNode({
      choices: [...choices, { text: '新选项', next: '' }],
    });
  };

  const updateChoice = (index: number, updates: Partial<{ text: string; next: string }>) => {
    const choices = [...(node.choices || [])];
    choices[index] = { ...choices[index], ...updates };
    onUpdateNode({ choices });
  };

  const removeChoice = (index: number) => {
    const choices = [...(node.choices || [])];
    choices.splice(index, 1);
    onUpdateNode({ choices });
  };

  return (
    <div className="w-80 border-r border-border bg-card/30 backdrop-blur-sm flex flex-col overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-1" style={{ fontFamily: 'var(--font-mono)' }}>
            节点详情
          </h3>
          <div className="text-lg" style={{ fontFamily: 'var(--font-display)' }}>
            {node.title}
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-secondary/50 transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Type */}
        <div>
          <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
            类型
          </label>
          <select
            value={node.type}
            onChange={(e) => onUpdateNode({ type: e.target.value as StoryNode['type'] })}
            className="w-full px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          >
            <option value="dialogue">对话</option>
            <option value="choice">选项</option>
            <option value="scene">场景</option>
            <option value="character">角色</option>
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
            标题
          </label>
          <input
            type="text"
            value={node.title}
            onChange={(e) => onUpdateNode({ title: e.target.value })}
            className="w-full px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            style={{ fontFamily: 'var(--font-display)' }}
          />
        </div>

        {/* Character (for dialogue nodes) */}
        {node.type === 'dialogue' && (
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
              角色
            </label>
            <input
              type="text"
              value={node.character || ''}
              onChange={(e) => onUpdateNode({ character: e.target.value })}
              className="w-full px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
              placeholder="角色名称"
            />
          </div>
        )}

        {/* Content */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs uppercase tracking-widest text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
              内容
            </label>
            <button className="p-1 hover:bg-primary/10 rounded transition-colors group">
              <Sparkles className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
            </button>
          </div>
          <textarea
            value={node.content}
            onChange={(e) => onUpdateNode({ content: e.target.value })}
            className="w-full h-32 px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none text-sm"
            placeholder={
              node.type === 'dialogue'
                ? '输入对话内容...'
                : node.type === 'scene'
                ? '描述场景...'
                : node.type === 'choice'
                ? '描述选择情境...'
                : '输入内容...'
            }
            style={{ fontFamily: 'var(--font-body)' }}
          />
          <div className="text-xs text-muted-foreground mt-1">
            {node.content.length} 字
          </div>
        </div>

        {/* Choices (for choice nodes) */}
        {node.type === 'choice' && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                选项分支
              </label>
              <button
                onClick={addChoice}
                className="px-2 py-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                添加
              </button>
            </div>

            <div className="space-y-3">
              {(node.choices || []).map((choice, idx) => (
                <div key={idx} className="p-3 bg-input-background border border-border rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                      选项 {idx + 1}
                    </span>
                    <button
                      onClick={() => removeChoice(idx)}
                      className="p-1 hover:bg-destructive/10 rounded transition-colors group"
                    >
                      <Trash2 className="w-3 h-3 text-muted-foreground group-hover:text-destructive transition-colors" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={choice.text}
                    onChange={(e) => updateChoice(idx, { text: e.target.value })}
                    className="w-full px-2 py-1 mb-2 bg-background border border-border/50 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                    placeholder="选项文本"
                  />
                  <input
                    type="text"
                    value={choice.next}
                    onChange={(e) => updateChoice(idx, { next: e.target.value })}
                    className="w-full px-2 py-1 bg-background border border-border/50 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
                    placeholder="下一个节点 ID"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              ))}

              {(!node.choices || node.choices.length === 0) && (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  点击上方添加选项分支
                </div>
              )}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="pt-4 border-t border-border">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
            元数据
          </div>
          <div className="space-y-2 text-xs" style={{ fontFamily: 'var(--font-mono)' }}>
            <div className="flex justify-between">
              <span className="text-muted-foreground">节点 ID</span>
              <span className="text-foreground">{node.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">连接数</span>
              <span className="text-foreground">{node.connections.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">位置</span>
              <span className="text-foreground">
                ({Math.round(node.position.x)}, {Math.round(node.position.y)})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-all hover:shadow-[0_0_15px_rgba(212,165,116,0.3)] text-sm">
          应用更改
        </button>
        <button className="w-full px-4 py-2 bg-destructive/10 text-destructive rounded-md hover:bg-destructive/20 transition-colors text-sm">
          删除节点
        </button>
      </div>
    </div>
  );
}
