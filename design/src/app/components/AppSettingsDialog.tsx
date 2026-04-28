import { useEffect, useState } from 'react';
import { X, Save, FolderOpen } from 'lucide-react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';

export interface AppSettings {
  defaultProjectDir: string;
  autoSaveInterval: number; // seconds, 0 = disabled
  language: 'zh-CN' | 'en';
  theme: 'dark' | 'light';
}

const STORAGE_KEY = 'webgal-app-settings';

const DEFAULTS: AppSettings = {
  defaultProjectDir: '',
  autoSaveInterval: 30,
  language: 'zh-CN',
  theme: 'dark',
};

export function loadAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveAppSettings(settings: AppSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

interface Props {
  open: boolean;
  onClose: () => void;
  onOpenAiSettings?: () => void;
}

export function AppSettingsDialog({ open, onClose, onOpenAiSettings }: Props) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSettings(loadAppSettings());
    setError(null);
  }, [open]);

  if (!open) return null;

  const update = (patch: Partial<AppSettings>) =>
    setSettings((s) => ({ ...s, ...patch }));

  const handlePickDir = async () => {
    const dir = await openDialog({
      title: '选择默认项目目录',
      directory: true,
    });
    if (dir) update({ defaultProjectDir: dir });
  };

  const handleSave = () => {
    setSaving(true);
    setError(null);
    try {
      saveAppSettings(settings);
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[520px] max-h-[85vh] flex flex-col bg-card border border-border rounded-lg shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg" style={{ fontFamily: 'var(--font-display)' }}>
            编辑器设置
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-secondary/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Default project directory */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5" style={{ fontFamily: 'var(--font-mono)' }}>
              默认项目目录
            </label>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2 bg-input-background border border-border rounded-md text-sm truncate" style={{ fontFamily: 'var(--font-mono)' }}>
                {settings.defaultProjectDir || '（未设置）'}
              </div>
              <button
                onClick={handlePickDir}
                className="px-3 py-2 rounded-md bg-secondary hover:bg-secondary/70 transition-colors border border-border"
              >
                <FolderOpen className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              创建新项目时默认选择此目录
            </p>
          </div>

          {/* Auto-save interval */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5" style={{ fontFamily: 'var(--font-mono)' }}>
              自动保存间隔
            </label>
            <select
              value={settings.autoSaveInterval}
              onChange={(e) => update({ autoSaveInterval: Number(e.target.value) })}
              className="w-full px-3 py-2 bg-input-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value={0}>禁用自动保存</option>
              <option value={15}>15 秒</option>
              <option value={30}>30 秒</option>
              <option value={60}>60 秒</option>
              <option value={120}>2 分钟</option>
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5" style={{ fontFamily: 'var(--font-mono)' }}>
              界面语言
            </label>
            <select
              value={settings.language}
              onChange={(e) => update({ language: e.target.value as 'zh-CN' | 'en' })}
              disabled
              className="w-full px-3 py-2 bg-input-background border border-border rounded-md text-sm focus:outline-none opacity-50 cursor-not-allowed"
            >
              <option value="zh-CN">简体中文</option>
              <option value="en">English</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">即将推出</p>
          </div>

          {/* Theme */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5" style={{ fontFamily: 'var(--font-mono)' }}>
              主题
            </label>
            <select
              value={settings.theme}
              disabled
              className="w-full px-3 py-2 bg-input-background border border-border rounded-md text-sm focus:outline-none opacity-50 cursor-not-allowed"
            >
              <option value="dark">深邃暖调（当前）</option>
              <option value="light">浅色模式</option>
            </select>
            <p className="mt-1 text-xs text-muted-foreground">即将推出</p>
          </div>

          {/* Link to AI settings */}
          {onOpenAiSettings && (
            <div className="pt-2 border-t border-border">
              <button
                onClick={() => { onClose(); onOpenAiSettings(); }}
                className="text-sm text-primary hover:underline"
              >
                打开 AI 设置 →
              </button>
            </div>
          )}

          {error && (
            <div className="px-3 py-2 rounded-md bg-destructive/10 border border-destructive/30 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-secondary hover:bg-secondary/70 transition-colors text-sm"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2 text-sm disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? '保存中…' : '保存'}
          </button>
        </div>
      </div>
    </div>
  );
}
