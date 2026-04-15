import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
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
} from 'lucide-react';

export interface Asset {
  id: string;
  type: 'scene' | 'music' | 'character';
  name: string;
  thumbnail?: string;
  url?: string;
  tags: string[];
  description: string;
  created: Date;
  size?: string;
  duration?: string;
  dimensions?: string;
}

export function AssetManager() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState<'scene' | 'music' | 'character'>('scene');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  // Mock data
  const [assets] = useState<Asset[]>([
    {
      id: '1',
      type: 'scene',
      name: '教室场景',
      thumbnail: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400',
      tags: ['学校', '日常'],
      description: '明亮的教室，阳光从窗户洒进来',
      created: new Date('2026-04-10'),
      dimensions: '1920x1080',
    },
    {
      id: '2',
      type: 'scene',
      name: '星空背景',
      thumbnail: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400',
      tags: ['夜晚', '浪漫'],
      description: '璀璨星空下的宁静夜晚',
      created: new Date('2026-04-12'),
      dimensions: '1920x1080',
    },
    {
      id: '3',
      type: 'scene',
      name: '咖啡厅内景',
      thumbnail: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
      tags: ['室内', '温馨'],
      description: '温暖的咖啡厅氛围',
      created: new Date('2026-04-13'),
      dimensions: '1920x1080',
    },
    {
      id: '4',
      type: 'music',
      name: '开场主题曲',
      tags: ['背景音乐', '欢快'],
      description: '游戏开场时播放的主题音乐',
      created: new Date('2026-04-08'),
      duration: '2:34',
      size: '3.2 MB',
    },
    {
      id: '5',
      type: 'music',
      name: '伤感旋律',
      tags: ['背景音乐', '伤感'],
      description: '适合悲伤剧情的背景音乐',
      created: new Date('2026-04-09'),
      duration: '3:15',
      size: '4.1 MB',
    },
    {
      id: '6',
      type: 'character',
      name: '女主角-微笑',
      thumbnail: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
      tags: ['女主角', '开心'],
      description: '女主角的微笑表情立绘',
      created: new Date('2026-04-11'),
      dimensions: '1024x1024',
    },
    {
      id: '7',
      type: 'character',
      name: '女主角-生气',
      thumbnail: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
      tags: ['女主角', '生气'],
      description: '女主角的生气表情立绘',
      created: new Date('2026-04-11'),
      dimensions: '1024x1024',
    },
    {
      id: '8',
      type: 'character',
      name: '配角-惊讶',
      thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      tags: ['配角', '惊讶'],
      description: '配角的惊讶表情',
      created: new Date('2026-04-14'),
      dimensions: '1024x1024',
    },
  ]);

  const filteredAssets = assets.filter(
    (asset) =>
      asset.type === activeTab &&
      (asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const tabConfig = [
    { id: 'scene' as const, label: '场景', icon: Image },
    { id: 'music' as const, label: '音乐', icon: Music },
    { id: 'character' as const, label: '人物立绘', icon: Users },
  ];

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
            <div className="h-6 w-px bg-border" />
            <span className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
              {projectId === '1' ? '苍穹之下的誓言' : projectId === '2' ? '雨夜侦探' : projectId === '3' ? '夏日回忆' : '新项目'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-md bg-primary/10 text-primary flex items-center gap-2 hover:bg-primary/20 transition-all border border-primary/30">
              <Sparkles className="w-4 h-4" />
              <span>AI 生成</span>
            </button>
            <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground flex items-center gap-2 hover:opacity-90 transition-all hover:shadow-[0_0_20px_rgba(212,165,116,0.4)]">
              <Upload className="w-4 h-4" />
              <span>上传素材</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Categories */}
        <aside className="w-64 border-r border-border bg-card/30 flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="text-sm uppercase tracking-wide text-muted-foreground mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
              素材类型
            </h2>
            <div className="space-y-1">
              {tabConfig.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all ${
                    activeTab === id
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'hover:bg-secondary/50 text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {assets.filter((a) => a.type === id).length}
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
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary/50 transition-colors">
                <FolderOpen className="w-4 h-4" />
                <span>所有文件夹</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary/50 transition-colors">
                <Tag className="w-4 h-4" />
                <span>标签管理</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary/50 transition-colors">
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
                  placeholder="搜索素材名称或标签..."
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

          {/* Assets Display */}
          <div className="flex-1 overflow-auto p-6">
            {filteredAssets.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <FolderOpen className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-lg mb-2">暂无素材</p>
                <p className="text-sm">点击右上角"上传素材"按钮开始添加</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredAssets.map((asset) => (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`group relative rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-[1.02] ${
                      selectedAsset?.id === asset.id
                        ? 'ring-2 ring-primary shadow-[0_0_20px_rgba(212,165,116,0.3)]'
                        : 'hover:ring-1 hover:ring-border'
                    }`}
                  >
                    <div className="aspect-square bg-secondary/30 relative overflow-hidden">
                      {asset.thumbnail ? (
                        <img
                          src={asset.thumbnail}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-12 h-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-0 left-0 right-0 p-3 flex gap-2">
                          {asset.type === 'music' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPlayingAudio(playingAudio === asset.id ? null : asset.id);
                              }}
                              className="p-2 rounded-full bg-primary/90 hover:bg-primary transition-colors"
                            >
                              {playingAudio === asset.id ? (
                                <Pause className="w-3 h-3 text-primary-foreground" />
                              ) : (
                                <Play className="w-3 h-3 text-primary-foreground" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={(e) => e.stopPropagation()}
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
                        {asset.dimensions && <span>{asset.dimensions}</span>}
                        {asset.duration && <span>{asset.duration}</span>}
                        {asset.size && <span>{asset.size}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAssets.map((asset) => (
                  <div
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-all ${
                      selectedAsset?.id === asset.id
                        ? 'bg-primary/10 ring-1 ring-primary'
                        : 'bg-card/50 hover:bg-card'
                    }`}
                  >
                    <div className="w-16 h-16 rounded overflow-hidden bg-secondary/30 flex-shrink-0">
                      {asset.thumbnail ? (
                        <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{asset.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{asset.description}</p>
                      <div className="flex gap-2 mt-1">
                        {asset.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {asset.created.toLocaleDateString('zh-CN')}
                      </span>
                      {asset.type === 'music' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPlayingAudio(playingAudio === asset.id ? null : asset.id);
                          }}
                          className="p-2 rounded-full hover:bg-secondary transition-colors"
                        >
                          {playingAudio === asset.id ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
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
                  {selectedAsset.thumbnail ? (
                    <img
                      src={selectedAsset.thumbnail}
                      alt={selectedAsset.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <h2 className="text-xl mb-2" style={{ fontFamily: 'var(--font-display)' }}>
                  {selectedAsset.name}
                </h2>
                <p className="text-sm text-muted-foreground">{selectedAsset.description}</p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground block mb-2">
                    标签
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedAsset.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm border border-primary/20"
                      >
                        {tag}
                      </span>
                    ))}
                    <button className="px-3 py-1 rounded-full bg-secondary hover:bg-secondary/70 text-sm border border-border transition-colors flex items-center gap-1">
                      <Plus className="w-3 h-3" />
                      添加
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground block mb-2">
                    详细信息
                  </label>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">创建日期</span>
                      <span>{selectedAsset.created.toLocaleDateString('zh-CN')}</span>
                    </div>
                    {selectedAsset.dimensions && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">尺寸</span>
                        <span>{selectedAsset.dimensions}</span>
                      </div>
                    )}
                    {selectedAsset.duration && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">时长</span>
                        <span>{selectedAsset.duration}</span>
                      </div>
                    )}
                    {selectedAsset.size && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">文件大小</span>
                        <span>{selectedAsset.size}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wide text-muted-foreground block mb-2">
                    使用说明
                  </label>
                  <textarea
                    className="w-full h-24 bg-input-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    placeholder="添加使用说明或备注..."
                    defaultValue={selectedAsset.description}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <button className="w-full px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-all flex items-center justify-center gap-2">
                  <Edit3 className="w-4 h-4" />
                  编辑素材
                </button>
                <button className="w-full px-4 py-2 rounded-md bg-secondary hover:bg-secondary/70 transition-colors flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  下载素材
                </button>
                <button className="w-full px-4 py-2 rounded-md bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors flex items-center justify-center gap-2">
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
    </div>
  );
}
