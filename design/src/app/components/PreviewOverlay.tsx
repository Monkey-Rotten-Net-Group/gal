import { useState, useEffect, useCallback, useMemo } from 'react';
import { X, ChevronDown, Volume2, Music } from 'lucide-react';
import { convertFileSrc } from '@tauri-apps/api/core';
import type { WebGalNode, ChoiceBranch } from '../lib/webgal-types';

interface Props {
  nodes: WebGalNode[];
  projectPath: string;
  onClose: () => void;
}

interface FigureState {
  asset: string;
  position: 'left' | 'center' | 'right';
  id: string; // composite key for figure tracking
}

function assetUrl(projectPath: string, category: string, name: string): string {
  if (!name || name === 'none') return '';
  return convertFileSrc(`${projectPath}/game/${category}/${name}`);
}

export function PreviewOverlay({ nodes, projectPath, onClose }: Props) {
  // --- labels map (build once) ---
  const labelMap = useMemo(() => {
    const map: Record<string, number> = {};
    nodes.forEach((n, idx) => {
      if (n.type === 'label' && n.labelName) {
        map[n.labelName] = idx;
      }
    });
    return map;
  }, [nodes]);

  // --- rendering state ---
  const [bg, setBg] = useState<string | null>(null);
  const [figures, setFigures] = useState<FigureState[]>([]);
  const [textbox, setTextbox] = useState<{ speaker?: string; text: string } | null>(null);
  const [textboxVisible, setTextboxVisible] = useState(true);
  const [choices, setChoices] = useState<ChoiceBranch[] | null>(null);
  const [introLines, setIntroLines] = useState<string[] | null>(null);
  const [introIndex, setIntroIndex] = useState(0);
  const [vars, setVars] = useState<Record<string, string>>({});
  const [nodeIdx, setNodeIdx] = useState(0);
  const [ended, setEnded] = useState(false);
  const [bgmLabel, setBgmLabel] = useState<string | null>(null);
  const [effectLabel, setEffectLabel] = useState<string | null>(null);
  const [waitingForClick, setWaitingForClick] = useState(false);

  // --- evaluate when condition ---
  const evalWhen = useCallback((when: string | undefined): boolean => {
    if (!when) return true;
    try {
      // Simple expressions: varName == value, varName != value, varName > value, etc.
      const expr = when.trim();
      const ops = ['>=', '<=', '!=', '==', '>', '<'];
      for (const op of ops) {
        const idx = expr.indexOf(op);
        if (idx === -1) continue;
        const left = expr.slice(0, idx).trim();
        const right = expr.slice(idx + op.length).trim();
        const lv = vars[left] || '0';
        const rv = right.replace(/^["']|["']$/g, '');
        const ln = parseFloat(lv);
        const rn = parseFloat(rv);

        switch (op) {
          case '==': return lv === rv;
          case '!=': return lv !== rv;
          case '>=': return ln >= rn;
          case '<=': return ln <= rn;
          case '>': return ln > rn;
          case '<': return ln < rn;
        }
      }
    } catch { /* fall through */ }
    return true;
  }, [vars]);

  // --- process a single node ---
  const processNode = useCallback((node: WebGalNode): 'continue' | 'wait' | 'end' => {
    // Check when condition
    if (!evalWhen(node.when)) {
      return 'continue';
    }

    const autoAdvance = node.next === true;

    switch (node.type) {
      case 'comment':
        return 'continue';

      case 'changeBg': {
        const name = node.asset || node.content;
        setBg(name || null);
        break;
      }

      case 'changeFigure': {
        const asset = node.asset || node.content;
        const pos = node.figurePosition || 'center';
        const figId = node.figureId || pos;

        setFigures(prev => {
          if (!asset || asset === 'none') {
            return prev.filter(f => f.id !== figId);
          }
          const existing = prev.find(f => f.id === figId);
          if (existing) {
            return prev.map(f => f.id === figId ? { ...f, asset, position: pos } : f);
          }
          return [...prev, { asset, position: pos, id: figId }];
        });
        break;
      }

      case 'miniAvatar': {
        // For now, miniAvatar changes the mini display but we don't render it in preview
        break;
      }

      case 'bgm': {
        setBgmLabel(node.asset || node.content || null);
        break;
      }

      case 'playEffect': {
        setEffectLabel(node.asset || node.content || null);
        // Auto-clear after 2s
        setTimeout(() => setEffectLabel(null), 2000);
        break;
      }

      case 'playVideo': {
        // Can't play video in preview — show indicator
        setTextbox({ text: `[视频: ${node.asset || node.content || '(无名称)'}]` });
        setWaitingForClick(true);
        return 'wait';
      }

      case 'dialogue': {
        const speaker = node.character || undefined;
        const text = node.content;
        setTextbox({ speaker, text });
        if (!autoAdvance) {
          setWaitingForClick(true);
          return 'wait';
        }
        break;
      }

      case 'narrator': {
        setTextbox({ text: node.content });
        if (!autoAdvance) {
          setWaitingForClick(true);
          return 'wait';
        }
        break;
      }

      case 'intro': {
        const lines = node.introLines || [node.content];
        setIntroLines(lines);
        setIntroIndex(0);
        setWaitingForClick(true);
        return 'wait';
      }

      case 'choose': {
        if (node.choices && node.choices.length > 0) {
          setChoices(node.choices);
          setWaitingForClick(true);
          return 'wait';
        }
        break;
      }

      case 'label': {
        // labels are just reference points, no rendering
        break;
      }

      case 'jumpLabel': {
        const target = node.labelName || node.content;
        if (target && labelMap[target] !== undefined) {
          setChoices(null);
          setWaitingForClick(false);
          setNodeIdx(labelMap[target]);
          return 'continue';
        }
        break;
      }

      case 'setVar': {
        if (node.varName) {
          setVars(prev => ({ ...prev, [node.varName]: node.varValue || '' }));
        }
        break;
      }

      case 'setTextbox': {
        // content is typically "hide" or "show"
        if (node.content === 'hide') setTextboxVisible(false);
        else setTextboxVisible(true);
        break;
      }

      case 'getUserInput': {
        setTextbox({ text: `[用户输入: ${node.inputTitle || node.content || ''}]` });
        setWaitingForClick(true);
        return 'wait';
      }

      case 'setAnimation': {
        // Show indicator
        setEffectLabel(`动画: ${node.animationName || node.content || ''}`);
        setTimeout(() => setEffectLabel(null), 2000);
        break;
      }

      case 'setTransform': {
        // Skip — no WebGL rendering in preview
        break;
      }

      case 'changeScene':
      case 'callScene': {
        const target = node.targetScene || node.content;
        setTextbox({ text: `[切换场景: → ${target || '(未知)'}]` });
        setWaitingForClick(true);
        return 'wait';
      }

      case 'end': {
        setEnded(true);
        setWaitingForClick(false);
        return 'end';
      }

      case 'unlockCg':
      case 'unlockBgm': {
        // gallery unlocks — skip in preview
        break;
      }
    }

    return 'continue';
  }, [evalWhen, labelMap]);

  // --- advance to next node ---
  const advance = useCallback(() => {
    setChoices(null);
    setWaitingForClick(false);

    const current = nodes[nodeIdx];
    if (!current) {
      setEnded(true);
      return;
    }

    // Find next node via connections
    const nextIds = current.connections;
    let nextNode: WebGalNode | undefined;
    if (nextIds.length > 0) {
      nextNode = nodes.find(n => n.id === nextIds[0]);
    }

    if (!nextNode) {
      setEnded(true);
      return;
    }

    const nextIdx = nodes.indexOf(nextNode);
    if (nextIdx === -1) {
      setEnded(true);
      return;
    }

    setNodeIdx(nextIdx);
  }, [nodeIdx, nodes]);

  // --- click-to-continue ---
  const handleClick = useCallback(() => {
    if (ended || choices) return; // choices are handled separately

    // If in intro mode, advance intro lines
    if (introLines && introIndex < introLines.length - 1) {
      setIntroIndex(i => i + 1);
      return;
    }
    if (introLines) {
      setIntroLines(null);
      setIntroIndex(0);
      advance();
      return;
    }

    advance();
  }, [ended, choices, introLines, introIndex, advance]);

  // --- choose handler ---
  const handleChoice = useCallback((choice: ChoiceBranch) => {
    setChoices(null);
    setWaitingForClick(false);

    if (!choice.target) {
      // No target — follow normal connection
      advance();
      return;
    }

    // If target is a .txt file, show scene switch
    if (choice.target.endsWith('.txt')) {
      setTextbox({ text: `[切换场景: → ${choice.target}]` });
      setWaitingForClick(true);
      return;
    }

    // Try label jump
    if (labelMap[choice.target] !== undefined) {
      setNodeIdx(labelMap[choice.target]);
      return;
    }

    // Fallback: try to find a label node by matching
    const labelNode = nodes.find(n => n.type === 'label' && n.labelName === choice.target);
    if (labelNode) {
      setNodeIdx(nodes.indexOf(labelNode));
      return;
    }

    // No match — show and advance
    setTextbox({ text: `[跳转: → ${choice.target}]` });
    setWaitingForClick(true);
  }, [advance, labelMap, nodes]);

  // --- process current node on mount and after state changes ---
  useEffect(() => {
    if (ended) return;
    if (nodeIdx < 0 || nodeIdx >= nodes.length) {
      setEnded(true);
      return;
    }

    const node = nodes[nodeIdx];
    if (!node) {
      setEnded(true);
      return;
    }

    // Don't auto-process if we're waiting for user interaction
    if (waitingForClick || choices) return;

    const result = processNode(node);

    if (result === 'continue') {
      // Auto-advance (either -next or non-blocking command)
      advance();
    }
    // 'wait' and 'end' are handled by setting states
  }, [nodeIdx, ended, nodes, processNode, advance, waitingForClick, choices]);

  // --- keyboard ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClick, onClose]);

  // --- build figure position class ---
  const figurePosClass = (pos: string) => {
    switch (pos) {
      case 'left': return 'left-[8%]';
      case 'right': return 'right-[8%]';
      default: return 'left-1/2 -translate-x-1/2';
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black select-none"
      onClick={handleClick}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {/* Background */}
      {bg && (
        <img
          src={assetUrl(projectPath, 'background', bg)}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
          alt=""
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}
      {!bg && (
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-gray-800" />
      )}

      {/* Figures */}
      {figures.map((fig) => (
        <img
          key={fig.id}
          src={assetUrl(projectPath, 'figure', fig.asset)}
          className={`absolute bottom-[15%] max-h-[70%] max-w-[35%] object-contain transition-all duration-500 ${figurePosClass(fig.pos)}`}
          alt=""
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ))}

      {/* BGM indicator */}
      {bgmLabel && (
        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/60 text-xs flex items-center gap-2">
          <Music className="w-3 h-3" />
          {bgmLabel}
        </div>
      )}

      {/* Effect indicator */}
      {effectLabel && (
        <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/60 text-xs flex items-center gap-2">
          <Volume2 className="w-3 h-3" />
          {effectLabel}
        </div>
      )}

      {/* Intro overlay */}
      {introLines && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
          <p
            className="text-white/90 text-2xl text-center px-12 transition-opacity duration-500 animate-in fade-in"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {introLines[introIndex]}
          </p>
        </div>
      )}

      {/* Choices */}
      {choices && !introLines && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-20 bg-black/30">
          <p className="text-white/70 text-lg mb-2">做出选择</p>
          {choices.map((c, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); handleChoice(c); }}
              className="px-8 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all hover:scale-105 min-w-[280px] text-lg"
            >
              {c.text}
            </button>
          ))}
        </div>
      )}

      {/* Textbox */}
      {textboxVisible && textbox && !introLines && !choices && !ended && (
        <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
          <div className="max-w-4xl mx-auto bg-black/70 backdrop-blur-md rounded-xl border border-white/10 p-6">
            {textbox.speaker && (
              <div className="text-primary text-sm mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                {textbox.speaker}
              </div>
            )}
            <p className="text-white/90 text-lg leading-relaxed">{textbox.text}</p>
          </div>

          {/* Click indicator */}
          <div className="absolute bottom-3 right-6 animate-bounce">
            <ChevronDown className="w-5 h-5 text-white/40" />
          </div>
        </div>
      )}

      {/* Ended screen */}
      {ended && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20">
          <p className="text-white/60 text-2xl mb-4" style={{ fontFamily: 'var(--font-display)' }}>
            预览结束
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 transition-all"
          >
            返回编辑器
          </button>
        </div>
      )}

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-white/60 hover:text-white hover:bg-black/60 transition-colors z-30"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Hint text */}
      {!ended && !choices && !introLines && (
        <div className="absolute top-4 left-4 text-white/20 text-xs z-10">
          点击或按空格键继续 · Esc 退出
        </div>
      )}
    </div>
  );
}
