import { Sparkles, Trash2, Plus, X } from 'lucide-react';
import type { WebGalNode, WebGalCommandType } from '../lib/webgal-types';
import { commandLabels } from '../lib/webgal-types';

interface DetailPanelProps {
  node: WebGalNode;
  onUpdateNode: (updates: Partial<WebGalNode>) => void;
  onDeleteNode: () => void;
  onClose: () => void;
}

const typeOptions: { value: WebGalCommandType; label: string }[] = [
  { value: 'dialogue', label: '对话' },
  { value: 'narrator', label: '旁白' },
  { value: 'intro', label: '黑屏文字' },
  { value: 'choose', label: '选项分支' },
  { value: 'changeBg', label: '切换背景' },
  { value: 'changeFigure', label: '切换立绘' },
  { value: 'miniAvatar', label: '小头像' },
  { value: 'changeScene', label: '切换场景' },
  { value: 'callScene', label: '调用场景' },
  { value: 'end', label: '结束' },
  { value: 'bgm', label: '背景音乐' },
  { value: 'playEffect', label: '音效' },
  { value: 'playVideo', label: '播放视频' },
  { value: 'label', label: '标签' },
  { value: 'jumpLabel', label: '跳转标签' },
  { value: 'setVar', label: '设置变量' },
  { value: 'setTextbox', label: '文本框控制' },
  { value: 'getUserInput', label: '用户输入' },
  { value: 'setAnimation', label: '设置动画' },
  { value: 'setTransform', label: '设置变换' },
  { value: 'unlockCg', label: '解锁CG' },
  { value: 'unlockBgm', label: '解锁BGM' },
  { value: 'comment', label: '注释' },
];

const inputClass = 'w-full px-3 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm';
const labelClass = 'block text-xs uppercase tracking-widest text-muted-foreground mb-1.5';

export function DetailPanel({ node, onUpdateNode, onDeleteNode, onClose }: DetailPanelProps) {
  return (
    <div className="w-80 border-r border-border bg-card/30 backdrop-blur-sm flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-1" style={{ fontFamily: 'var(--font-mono)' }}>
            指令编辑
          </h3>
          <div className="text-base font-medium" style={{ fontFamily: 'var(--font-display)' }}>
            {commandLabels[node.type]}
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-md hover:bg-secondary/50 transition-colors">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Type selector */}
        <div>
          <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>指令类型</label>
          <select
            value={node.type}
            onChange={(e) => onUpdateNode({ type: e.target.value as WebGalCommandType })}
            className={inputClass}
          >
            {typeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Type-specific fields */}
        {renderTypeFields(node, onUpdateNode)}

        {/* Common flags */}
        <div className="pt-3 border-t border-border space-y-3">
          <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>通用选项</label>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={node.next ?? false}
              onChange={(e) => onUpdateNode({ next: e.target.checked })}
              className="rounded border-border"
            />
            <span>-next (立即执行下一条)</span>
          </label>

          <div>
            <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>条件 (-when)</label>
            <input
              type="text"
              value={node.when || ''}
              onChange={(e) => onUpdateNode({ when: e.target.value || undefined })}
              className={inputClass}
              placeholder="例: score>10"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </div>

        {/* Raw content preview */}
        <div className="pt-3 border-t border-border">
          <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>
            节点 ID
          </label>
          <div className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
            {node.id}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <button
          onClick={onDeleteNode}
          className="w-full px-4 py-2 bg-destructive/10 text-destructive rounded-md hover:bg-destructive/20 transition-colors text-sm"
        >
          删除指令
        </button>
      </div>
    </div>
  );
}

function renderTypeFields(
  node: WebGalNode,
  onUpdate: (updates: Partial<WebGalNode>) => void,
) {
  switch (node.type) {
    case 'dialogue':
      return (
        <>
          <div>
            <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>角色名</label>
            <input
              type="text"
              value={node.character || ''}
              onChange={(e) => onUpdate({ character: e.target.value })}
              className={inputClass}
              placeholder="留空则继承上一句角色"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelClass} style={{ fontFamily: 'var(--font-mono)', marginBottom: 0 }}>对话内容</label>
              <button className="p-1 hover:bg-primary/10 rounded transition-colors group">
                <Sparkles className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            </div>
            <textarea
              value={node.content}
              onChange={(e) => onUpdate({ content: e.target.value })}
              className={`${inputClass} h-24 resize-none`}
              placeholder="输入对话内容..."
              style={{ fontFamily: 'var(--font-body)' }}
            />
          </div>
          <div>
            <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>语音文件</label>
            <input
              type="text"
              value={node.voice || ''}
              onChange={(e) => onUpdate({ voice: e.target.value || undefined })}
              className={inputClass}
              placeholder="例: v1.wav"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </>
      );

    case 'narrator':
      return (
        <div>
          <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>旁白内容</label>
          <textarea
            value={node.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            className={`${inputClass} h-24 resize-none`}
            placeholder="输入旁白文本..."
            style={{ fontFamily: 'var(--font-body)' }}
          />
        </div>
      );

    case 'intro':
      return (
        <div>
          <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>
            黑屏文字（每行用回车分隔）
          </label>
          <textarea
            value={(node.introLines || []).join('\n')}
            onChange={(e) => onUpdate({ introLines: e.target.value.split('\n'), content: e.target.value.split('\n').join('|') })}
            className={`${inputClass} h-28 resize-none`}
            placeholder="第一行&#10;第二行&#10;第三行"
            style={{ fontFamily: 'var(--font-body)' }}
          />
        </div>
      );

    case 'choose':
      return <ChoiceEditor node={node} onUpdate={onUpdate} />;

    case 'changeBg':
      return (
        <div>
          <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>背景图片</label>
          <input
            type="text"
            value={node.asset || node.content}
            onChange={(e) => onUpdate({ asset: e.target.value, content: e.target.value })}
            className={inputClass}
            placeholder="例: bg.webp 或 none"
            style={{ fontFamily: 'var(--font-mono)' }}
          />
          <p className="text-[10px] text-muted-foreground mt-1">放在 game/background/ 目录下</p>
        </div>
      );

    case 'changeFigure':
      return (
        <>
          <div>
            <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>立绘文件</label>
            <input
              type="text"
              value={node.asset || node.content}
              onChange={(e) => onUpdate({ asset: e.target.value, content: e.target.value })}
              className={inputClass}
              placeholder="例: stand.webp 或 none"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
            <p className="text-[10px] text-muted-foreground mt-1">放在 game/figure/ 目录下</p>
          </div>
          <div>
            <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>位置</label>
            <select
              value={node.figurePosition || 'center'}
              onChange={(e) => onUpdate({ figurePosition: e.target.value as 'left' | 'center' | 'right' })}
              className={inputClass}
            >
              <option value="left">左侧</option>
              <option value="center">居中</option>
              <option value="right">右侧</option>
            </select>
          </div>
          <div>
            <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>自定义 ID</label>
            <input
              type="text"
              value={node.figureId || ''}
              onChange={(e) => onUpdate({ figureId: e.target.value || undefined })}
              className={inputClass}
              placeholder="可选，用于精确定位"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </>
      );

    case 'miniAvatar':
      return (
        <div>
          <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>小头像文件</label>
          <input
            type="text"
            value={node.asset || node.content}
            onChange={(e) => onUpdate({ asset: e.target.value, content: e.target.value })}
            className={inputClass}
            placeholder="例: miniavatar.webp 或 none"
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>
      );

    case 'changeScene':
    case 'callScene':
      return (
        <div>
          <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>
            目标场景文件
          </label>
          <input
            type="text"
            value={node.targetScene || node.content}
            onChange={(e) => onUpdate({ targetScene: e.target.value, content: e.target.value })}
            className={inputClass}
            placeholder="例: Chapter-2.txt"
            style={{ fontFamily: 'var(--font-mono)' }}
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            {node.type === 'callScene' ? 'callScene 执行完后会返回当前场景' : 'changeScene 会永久切换'}
          </p>
        </div>
      );

    case 'end':
      return (
        <p className="text-sm text-muted-foreground">结束当前场景，无需参数。</p>
      );

    case 'bgm':
    case 'playEffect':
    case 'playVideo':
      return (
        <>
          <div>
            <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>
              {node.type === 'bgm' ? '音乐文件' : node.type === 'playEffect' ? '音效文件' : '视频文件'}
            </label>
            <input
              type="text"
              value={node.asset || node.content}
              onChange={(e) => onUpdate({ asset: e.target.value, content: e.target.value })}
              className={inputClass}
              placeholder={node.type === 'bgm' ? '例: bgm.mp3 或 none' : '例: effect.mp3'}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
          <div>
            <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>音量 (0-100)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={node.volume ?? ''}
              onChange={(e) => onUpdate({ volume: e.target.value ? parseInt(e.target.value, 10) : undefined })}
              className={inputClass}
              placeholder="默认 100"
            />
          </div>
        </>
      );

    case 'label':
    case 'jumpLabel':
      return (
        <div>
          <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>
            标签名称
          </label>
          <input
            type="text"
            value={node.labelName || node.content}
            onChange={(e) => onUpdate({ labelName: e.target.value, content: e.target.value })}
            className={inputClass}
            placeholder="例: branch_a"
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>
      );

    case 'setVar':
      return (
        <>
          <div>
            <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>变量名</label>
            <input
              type="text"
              value={node.varName || ''}
              onChange={(e) => onUpdate({ varName: e.target.value, content: `${e.target.value}=${node.varValue || ''}` })}
              className={inputClass}
              placeholder="例: score"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
          <div>
            <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>值</label>
            <input
              type="text"
              value={node.varValue || ''}
              onChange={(e) => onUpdate({ varValue: e.target.value, content: `${node.varName || ''}=${e.target.value}` })}
              className={inputClass}
              placeholder="例: 1, true, 文本"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </>
      );

    case 'getUserInput':
      return (
        <>
          <div>
            <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>存入变量</label>
            <input
              type="text"
              value={node.varName || node.content}
              onChange={(e) => onUpdate({ varName: e.target.value, content: e.target.value })}
              className={inputClass}
              placeholder="例: name"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
          <div>
            <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>提示文字</label>
            <input
              type="text"
              value={node.inputTitle || ''}
              onChange={(e) => onUpdate({ inputTitle: e.target.value })}
              className={inputClass}
              placeholder="例: 请输入你的名字"
            />
          </div>
          <div>
            <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>按钮文字</label>
            <input
              type="text"
              value={node.inputButton || ''}
              onChange={(e) => onUpdate({ inputButton: e.target.value })}
              className={inputClass}
              placeholder="例: 确认"
            />
          </div>
        </>
      );

    case 'setTextbox':
      return (
        <div>
          <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>操作</label>
          <select
            value={node.content || 'hide'}
            onChange={(e) => onUpdate({ content: e.target.value })}
            className={inputClass}
          >
            <option value="hide">隐藏</option>
            <option value="show">显示</option>
          </select>
        </div>
      );

    case 'setAnimation':
      return (
        <>
          <div>
            <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>动画名称</label>
            <input
              type="text"
              value={node.animationName || node.content}
              onChange={(e) => onUpdate({ animationName: e.target.value, content: e.target.value })}
              className={inputClass}
              placeholder="例: enter-from-left"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
          <div>
            <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>目标 (-target)</label>
            <input
              type="text"
              value={node.animationTarget || ''}
              onChange={(e) => onUpdate({ animationTarget: e.target.value || undefined })}
              className={inputClass}
              placeholder="例: fig-left"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
        </>
      );

    case 'setTransform':
      return (
        <div>
          <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>变换 JSON</label>
          <textarea
            value={node.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            className={`${inputClass} h-24 resize-none`}
            placeholder='例: {"position":{"x":100,"y":0}}'
            style={{ fontFamily: 'var(--font-mono)' }}
          />
        </div>
      );

    case 'unlockCg':
    case 'unlockBgm':
      return (
        <>
          <div>
            <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>
              {node.type === 'unlockCg' ? 'CG 文件' : 'BGM 文件'}
            </label>
            <input
              type="text"
              value={node.asset || node.content}
              onChange={(e) => onUpdate({ asset: e.target.value, content: e.target.value })}
              className={inputClass}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
          <div>
            <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>显示名称</label>
            <input
              type="text"
              value={node.displayName || ''}
              onChange={(e) => onUpdate({ displayName: e.target.value || undefined })}
              className={inputClass}
              placeholder="在鉴赏中显示的名称"
            />
          </div>
        </>
      );

    case 'comment':
      return (
        <div>
          <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>注释内容</label>
          <textarea
            value={node.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            className={`${inputClass} h-24 resize-none`}
            placeholder="写下备注..."
          />
        </div>
      );

    default:
      return (
        <div>
          <label className={labelClass} style={{ fontFamily: 'var(--font-mono)' }}>内容</label>
          <textarea
            value={node.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            className={`${inputClass} h-24 resize-none`}
          />
        </div>
      );
  }
}

function ChoiceEditor({ node, onUpdate }: { node: WebGalNode; onUpdate: (u: Partial<WebGalNode>) => void }) {
  const choices = node.choices || [];

  const add = () => {
    onUpdate({ choices: [...choices, { text: '新选项', target: '' }] });
  };

  const update = (idx: number, field: 'text' | 'target', value: string) => {
    const next = [...choices];
    next[idx] = { ...next[idx], [field]: value };
    onUpdate({ choices: next, content: next.map(c => c.target ? `${c.text}:${c.target}` : c.text).join('|') });
  };

  const remove = (idx: number) => {
    const next = choices.filter((_, i) => i !== idx);
    onUpdate({ choices: next, content: next.map(c => c.target ? `${c.text}:${c.target}` : c.text).join('|') });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className={labelClass} style={{ fontFamily: 'var(--font-mono)', marginBottom: 0 }}>选项分支</label>
        <button
          onClick={add}
          className="px-2 py-0.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded transition-colors flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          添加
        </button>
      </div>

      <div className="space-y-2">
        {choices.map((choice, idx) => (
          <div key={idx} className="p-2.5 bg-input-background border border-border rounded-md">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                选项 {idx + 1}
              </span>
              <button
                onClick={() => remove(idx)}
                className="p-0.5 hover:bg-destructive/10 rounded transition-colors group"
              >
                <Trash2 className="w-3 h-3 text-muted-foreground group-hover:text-destructive transition-colors" />
              </button>
            </div>
            <input
              type="text"
              value={choice.text}
              onChange={(e) => update(idx, 'text', e.target.value)}
              className="w-full px-2 py-1 mb-1.5 bg-background border border-border/50 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              placeholder="选项文本"
            />
            <input
              type="text"
              value={choice.target}
              onChange={(e) => update(idx, 'target', e.target.value)}
              className="w-full px-2 py-1 bg-background border border-border/50 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              placeholder="目标场景文件 (例: scene2.txt)"
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          </div>
        ))}

        {choices.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-xs">
            点击上方添加选项分支
          </div>
        )}
      </div>
    </div>
  );
}
