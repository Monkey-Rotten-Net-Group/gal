import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { convertFileSrc } from '@tauri-apps/api/core';
import { open as openDialog, save as saveDialog } from '@tauri-apps/plugin-dialog';
import {
  ArrowLeft,
  Upload,
  Search,
  Image,
  Music,
  Users,
  FolderOpen,
  Grid3x3,
  List,
  Play,
  Pause,
  Trash2,
  Edit3,
  Download,
  Plus,
  Sparkles,
  Tag,
  Filter,
  Loader2,
  AlertTriangle,
  Copy,
} from 'lucide-react';
import {
  listAssets,
  listAllAssets,
  importAsset,
  deleteAsset,
  renameAsset,
  type AssetInfo,
} from '../lib/assets-ipc';

type TabId = 'scene' | 'music' | 'character';

function tabToCategories(tab: TabId): string[] {
  switch (tab) {
    case 'scene': return ['background'];
    case 'music': return ['bgm', 'vocal'];
    case 'character': return ['figure'];
  }
}

function isImageExt(ext: string): boolean {
  return ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'].some(e => ext.endsWith(e));
}

function isAudioExt(ext: string): boolean {
  return ['.mp3', '.ogg', '.wav', '.flac', '.aac'].some(e => ext.endsWith(e));
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const tabConfig: { id: TabId; label: string; icon: typeof Image }[] = [
  { id: 'scene', label: '场景', icon: Image },
  { id: 'music', label: '音乐', icon: Music },
  { id: 'character', label: '人物立绘', icon: Users },
];

export function AssetManager() {
  const navigate = useNavigate();
  const { projectId } = useParams();

  const [activeTab, setActiveTab] = useState<TabId>('scene');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<AssetInfo | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  // Real data state
  const [projectPath, setProjectPath] = useState<string>('');
  const [assets, setAssets] = useState<AssetInfo[]>([]);
  const [allAssets, setAllAssets] = useState<AssetInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  // Load project path
  useEffect(() => {
    const path = localStorage.getItem(`project-path-${projectId}`);
    if (path) {
      setProjectPath(path);
    } else {
      setLoading(false);
    }
  }, [projectId]);

  // Load assets on mount and tab change
  const loadAssetsForTab = useCallback(async (tab: TabId, path: string) => {
    setLoading(true);
    setError(null);
    try {
      const cats = tabToCategories(tab);
      const results = await Promise.all(cats.map(c => listAssets(path, c)));
      const all = results.flat();
      setAssets(all);
    } catch (e) {
      setError(String(e));
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load all assets for counts and "all folders" view
  const loadAllAssets = useCallback(async (path: string) => {
    try {
      const all = await listAllAssets(path);
      setAllAssets(all);
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    if (!projectPath) return;
    loadAssetsForTab(activeTab, projectPath);
    loadAllAssets(projectPath);
  }, [projectPath, activeTab, loadAssetsForTab, loadAllAssets]);

  const filteredAssets = assets.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Tab counts from all assets
  const tabCounts = {
    scene: allAssets.filter(a => a.category === 'background').length,
    music: allAssets.filter(a => a.category === 'bgm' || a.category === 'vocal').length,
    character: allAssets.filter(a => a.category === 'figure').length,
  };

  // --- Actions ---
  const handleImport = useCallback(async () => {
    if (!projectPath) return;
    const path = await openDialog({
      title: '选择素材文件',
      filters: [{
        name: '媒体文件',
        extensions: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'mp3', 'ogg', 'wav', 'flac', 'aac', 'mp4', 'webm'],
      }],
    });
    if (!path) return;

    setImporting(true);
    setError(null);
    try {
      const cats = tabToCategories(activeTab);
      const info = await importAsset(path, projectPath, cats[0]);
      setAssets(prev => [info, ...prev]);
      // Refresh all assets for updated counts
      loadAllAssets(projectPath);
    } catch (e) {
      setError(String(e));
    } finally {
      setImporting(false);
    }
  }, [projectPath, activeTab, loadAllAssets]);

  const handleDelete = useCallback(async () => {
    if (!selectedAsset || !projectPath) return;
    if (!confirm(`确定删除 "${selectedAsset.name}"？（不可恢复）`)) return;

    try {
      await deleteAsset(projectPath, selectedAsset.category, selectedAsset.name);
      setAssets(prev => prev.filter(a => a.path !== selectedAsset.path));
      setAllAssets(prev => prev.filter(a => a.path !== selectedAsset.path));
      setSelectedAsset(null);
    } catch (e) {
      setError(String(e));
    }
  }, [selectedAsset, projectPath]);

  const handleRename = useCallback(async () => {
    if (!selectedAsset || !projectPath) return;
    const ext = selectedAsset.extension;
    const stem = selectedAsset.name.slice(0, -(ext.length + 1));
    const newName = prompt('输入新名称:', stem);
    if (!newName || newName === stem) return;

    const fullNewName = `${newName}.${ext}`;
    try {
      const info = await renameAsset(projectPath, selectedAsset.category, selectedAsset.name, fullNewName);
      setAssets(prev => prev.map(a => a.path === selectedAsset.path ? info : a));
      setAllAssets(prev => prev.map(a => a.path === selectedAsset.path ? info : a));
      setSelectedAsset(info);
    } catch (e) {
      setError(String(e));
    }
  }, [selectedAsset, projectPath]);

  const handleDownload = useCallback(async (asset?: AssetInfo) => {
    const a = asset || selectedAsset;
    if (!a) return;
    const dest = await saveDialog({
      title: '导出素材到',
      defaultPath: a.name,
    });
    if (!dest) return;

    try {
      // For MVP: copy file contents via read/write
      const fileData = await fetch(convertFileSrc(a.path));
      const blob = await fileData.blob();
      // Create an object URL and trigger download via a temporary anchor
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = a.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(`导出失败: ${e}. 文件路径: ${a.path}`);
    }
  }, [selectedAsset]);

  const handlePlayToggle = useCallback((assetPath: string) => {
    setPlayingAudio(prev => prev === assetPath ? null : assetPath);
  }, []);

  // Thumbnail URL
  const getThumbnail = (asset: AssetInfo): string | null => {
    if (isImageExt(asset.extension)) {
      return convertFileSrc(asset.path);
    }
    return null;
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/editor/${projectId}`)}
              className="p-2 rounded-md hover:bg-secondary/50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-3xl tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              素材库
            </h1>
            {projectPath && (
              <span className="text-xs text-muted-foreground truncate max-w-xs" style={{ fontFamily: 'var(--font-mono)' }}>
                {projectPath}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => alert('AI 素材生成即将推出')}
              className="px-4 py-2 rounded-md bg-primary/10 text-primary flex items-center gap-2 hover:bg-primary/20 transition-all border border-primary/30"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI 生成</span>
            </button>
            <button
              onClick={handleImport}
              disabled={!projectPath || importing}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground flex items-center gap-2 hover:opacity-90 transition-all hover:shadow-[0_0_20px_rgba(212,165,116,0.4)] disabled:opacity-50"
            >
              {importing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>{importing ? '导入中…' : '上传素材'}</span>
            </button>
          </div>
        </div>
      </header>

      {!projectPath ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>未找到项目路径，请从编辑器重新进入素材库</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar */}
          <aside className="w-64 border-r border-border bg-card/30 flex flex-col">
            <div className="p-4 border-b border-border">
              <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
                素材类型
              </h2>
              <div className="space-y-1">
                {tabConfig.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => { setActiveTab(id); setSelectedAsset(null); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all ${
                      activeTab === id
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'hover:bg-secondary/50 text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {tabCounts[id]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4">
              <h3 className="text-sm uppercase tracking-wide text-muted-foreground mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
                快捷操作
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => alert('文件夹浏览即将推出')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary/50 transition-colors"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>所有文件夹</span>
                </button>
                <button
                  onClick={() => alert('标签管理即将推出')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary/50 transition-colors"
                >
                  <Tag className="w-4 h-4" />
                  <span>标签管理</span>
                </button>
                <button
                  onClick={() => alert('筛选器即将推出')}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary/50 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  <span>筛选器</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-border bg-card/20 flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1 max-w-xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="搜索素材名称..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-input-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-secondary/50 rounded-md p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                    }`}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mx-6 mt-2 px-3 py-2 rounded-md bg-destructive/10 border border-destructive/30 text-sm text-destructive flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
                <button onClick={() => setError(null)} className="ml-auto text-xs underline hover:no-underline">关闭</button>
              </div>
            )}

            {/* Assets Display */}
            <div className="flex-1 overflow-auto p-6">
              {loading ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                  <FolderOpen className="w-16 h-16 mb-4 opacity-50" />
                  <p className="text-lg mb-2">暂无素材</p>
                  <p className="text-sm">点击右上角"上传素材"按钮开始添加</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredAssets.map((asset) => {
                    const thumbnail = getThumbnail(asset);
                    const isSelected = selectedAsset?.path === asset.path;
                    return (
                      <div
                        key={asset.path}
                        onClick={() => setSelectedAsset(asset)}
                        className={`group relative rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02] ${
                          isSelected
                            ? 'ring-2 ring-primary shadow-[0_0_20px_rgba(212,165,116,0.3)]'
                            : 'hover:ring-1 hover:ring-border'
                        }`}
                      >
                        <div className="aspect-square bg-secondary/30 relative overflow-hidden">
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt={asset.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {isAudioExt(asset.extension) ? (
                                <Music className="w-12 h-12 text-muted-foreground" />
                              ) : (
                                <Image className="w-12 h-12 text-muted-foreground/30" />
                              )}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-3 flex gap-2">
                              {isAudioExt(asset.extension) && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handlePlayToggle(asset.path); }}
                                  className="p-2 rounded-full bg-primary/90 hover:bg-primary transition-colors"
                                >
                                  {playingAudio === asset.path ? (
                                    <Pause className="w-3 h-3 text-primary-foreground" />
                                  ) : (
                                    <Play className="w-3 h-3 text-primary-foreground" />
                                  )}
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDownload(asset); }}
                                className="p-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
                              >
                                <Download className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 bg-card border-t border-border">
                          <h3 className="text-sm font-medium truncate mb-1">{asset.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{asset.extension.toUpperCase()}</span>
                            <span>{formatSize(asset.size)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAssets.map((asset) => {
                    const thumbnail = getThumbnail(asset);
                    const isSelected = selectedAsset?.path === asset.path;
                    return (
                      <div
                        key={asset.path}
                        onClick={() => setSelectedAsset(asset)}
                        className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-primary/10 ring-1 ring-primary'
                            : 'bg-card/50 hover:bg-card'
                        }`}
                      >
                        <div className="w-16 h-16 rounded overflow-hidden bg-secondary/30 flex-shrink-0">
                          {thumbnail ? (
                            <img src={thumbnail} alt={asset.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              {isAudioExt(asset.extension) ? (
                                <Music className="w-6 h-6 text-muted-foreground" />
                              ) : (
                                <Image className="w-6 h-6 text-muted-foreground/30" />
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{asset.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {asset.category} · {asset.extension.toUpperCase()} · {formatSize(asset.size)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{asset.extension.toUpperCase()}</span>
                          {isAudioExt(asset.extension) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handlePlayToggle(asset.path); }}
                              className="p-2 rounded-full hover:bg-secondary transition-colors"
                            >
                              {playingAudio === asset.path ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </main>

          {/* Right Sidebar - Details */}
          <aside className="w-80 border-l border-border bg-card/30 overflow-auto">
            {selectedAsset ? (
              <div className="p-6">
                <div className="mb-6">
                  <div className="aspect-video rounded-lg overflow-hidden bg-secondary/30 mb-4">
                    {getThumbnail(selectedAsset) ? (
                      <img
                        src={getThumbnail(selectedAsset)!}
                        alt={selectedAsset.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {isAudioExt(selectedAsset.extension) ? (
                          <Music className="w-16 h-16 text-muted-foreground" />
                        ) : (
                          <Image className="w-16 h-16 text-muted-foreground/30" />
                        )}
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                    {selectedAsset.name}
                  </h2>
                  <p className="text-xs text-muted-foreground truncate" style={{ fontFamily: 'var(--font-mono)' }}>
                    {selectedAsset.path}
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-xs uppercase tracking-wide text-muted-foreground block mb-2">
                      文件信息
                    </label>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">类型</span>
                        <span>{selectedAsset.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">格式</span>
                        <span>{selectedAsset.extension.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">大小</span>
                        <span>{formatSize(selectedAsset.size)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tags placeholder */}
                  <div>
                    <label className="text-xs uppercase tracking-wide text-muted-foreground block mb-2">
                      标签
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => alert('标签管理即将推出')}
                        className="px-3 py-1 rounded-full bg-secondary hover:bg-secondary/70 text-sm border border-border transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        添加标签
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={handleRename}
                    className="w-full px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    重命名
                  </button>
                  <button
                    onClick={handleDownload}
                    className="w-full px-4 py-2 rounded-md bg-secondary hover:bg-secondary/70 transition-colors flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    复制路径
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2 rounded-md bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除素材
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                <Image className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-sm">选择一个素材查看详情</p>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
