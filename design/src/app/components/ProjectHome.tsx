import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Plus,
  Search,
  Grid3x3,
  List as ListIcon,
  Folder,
  Clock,
  Star,
  Trash2,
  Edit,
  ExternalLink,
  BookOpen,
  Layout,
  Sparkles,
  X,
  Loader2,
  Users,
  MapPin,
  GitBranch,
  FolderOpen,
} from 'lucide-react';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { initProject, openProject, type ProjectInfo } from '../lib/webgal-ipc';

export interface Project {
  id: string;
  name: string;
  description: string;
  lastModified: string;
  path: string;              // disk path to project root
  thumbnail?: string;
  isFavorite: boolean;
  sceneCount: number;
}

const STORAGE_KEY = 'webgal-projects';

function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistProjects(projects: Project[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function ProjectHome() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState<Project[]>(loadProjects);

  // Create modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [selectedDir, setSelectedDir] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Persist whenever projects change
  useEffect(() => {
    persistProjects(projects);
  }, [projects]);

  // Also store per-project path for StoryEditor to pick up
  useEffect(() => {
    for (const p of projects) {
      localStorage.setItem(`project-path-${p.id}`, p.path);
    }
  }, [projects]);

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ---------------------------------------------------------------------------
  // Pick base directory for new project
  // ---------------------------------------------------------------------------
  const handlePickDir = useCallback(async () => {
    const dir = await openDialog({
      title: '选择项目存放位置',
      directory: true,
    });
    if (dir) setSelectedDir(dir);
  }, []);

  // ---------------------------------------------------------------------------
  // Create project — calls backend init_project
  // ---------------------------------------------------------------------------
  const handleCreateProject = useCallback(async () => {
    const name = projectName.trim();
    if (!name || !selectedDir) return;

    setIsCreating(true);
    setCreateError('');

    try {
      const info: ProjectInfo = await initProject(selectedDir, name);
      const newProject: Project = {
        id: Date.now().toString(),
        name: info.config.Game_name || name,
        description: projectDesc.trim() || `WebGAL 项目 — ${name}`,
        lastModified: new Date().toLocaleString(),
        path: info.path,
        isFavorite: false,
        sceneCount: info.scenes.length,
      };

      setProjects(prev => [newProject, ...prev]);
      setIsModalOpen(false);
      navigate(`/editor/${newProject.id}`);
    } catch (e) {
      setCreateError(String(e));
    } finally {
      setIsCreating(false);
    }
  }, [projectName, projectDesc, selectedDir, navigate]);

  // ---------------------------------------------------------------------------
  // Open existing project folder
  // ---------------------------------------------------------------------------
  const handleOpenProject = useCallback(async () => {
    const dir = await openDialog({
      title: '打开 WebGAL 项目文件夹',
      directory: true,
    });
    if (!dir) return;

    try {
      const info: ProjectInfo = await openProject(dir);
      // Check if already in list
      const existing = projects.find(p => p.path === dir);
      if (existing) {
        navigate(`/editor/${existing.id}`);
        return;
      }

      const newProject: Project = {
        id: Date.now().toString(),
        name: info.config.Game_name || dir.split('/').pop() || '未命名项目',
        description: `${info.scenes.length} 个场景`,
        lastModified: new Date().toLocaleString(),
        path: dir,
        isFavorite: false,
        sceneCount: info.scenes.length,
      };

      setProjects(prev => [newProject, ...prev]);
      navigate(`/editor/${newProject.id}`);
    } catch (e) {
      alert(`无法打开项目: ${e}`);
    }
  }, [projects, navigate]);

  // ---------------------------------------------------------------------------
  // Project actions
  // ---------------------------------------------------------------------------
  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjects(prev => prev.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
  };

  const deleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('从列表中移除此项目？（不会删除磁盘上的文件）')) {
      setProjects(prev => prev.filter(p => p.id !== id));
      localStorage.removeItem(`project-path-${id}`);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="h-full flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="px-8 py-6 flex items-center justify-between max-w-[1600px] mx-auto w-full">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-xl bg-primary/20 text-primary border border-primary/30">
              <Layout className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-medium tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                创作中心
              </h1>
              <p className="text-sm text-muted-foreground mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
                管理你的所有故事织卷
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-80 hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="搜索项目..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-secondary/30 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <button
              onClick={handleOpenProject}
              className="px-5 py-2.5 rounded-lg bg-secondary hover:bg-secondary/70 transition-colors flex items-center gap-2 font-medium border border-border"
            >
              <FolderOpen className="w-5 h-5" />
              <span>打开项目</span>
            </button>
            <button
              onClick={() => {
                setIsModalOpen(true);
                setProjectName('');
                setProjectDesc('');
                setSelectedDir(null);
                setCreateError('');
              }}
              className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground flex items-center gap-2 hover:opacity-90 transition-all hover:shadow-[0_0_20px_rgba(212,165,116,0.4)] font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>创建新项目</span>
            </button>
          </div>
        </div>
      </header>

      {/* Create Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-lg bg-card border border-primary/20 rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.4)] overflow-hidden relative">
            <button
              onClick={() => !isCreating && setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-secondary/50 transition-colors text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 rounded-2xl bg-primary/20 text-primary">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-medium" style={{ fontFamily: 'var(--font-display)' }}>
                    创建新项目
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    将创建标准 WebGAL 项目目录结构
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Project name */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2 font-bold">
                    项目名称
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full px-4 py-3 bg-secondary/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="例: 我的故事"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2 font-bold">
                    简介（可选）
                  </label>
                  <textarea
                    value={projectDesc}
                    onChange={(e) => setProjectDesc(e.target.value)}
                    className="w-full h-20 px-4 py-3 bg-secondary/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
                    placeholder="简单描述你的故事..."
                  />
                </div>

                {/* Directory picker */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2 font-bold">
                    存放位置
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1 px-4 py-3 bg-secondary/30 border border-border rounded-xl text-sm truncate" style={{ fontFamily: 'var(--font-mono)' }}>
                      {selectedDir || '请选择文件夹...'}
                    </div>
                    <button
                      onClick={handlePickDir}
                      className="px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/70 transition-colors border border-border"
                    >
                      <FolderOpen className="w-4 h-4" />
                    </button>
                  </div>
                  {selectedDir && (
                    <p className="text-xs text-muted-foreground mt-2" style={{ fontFamily: 'var(--font-mono)' }}>
                      将创建: {selectedDir}/{projectName || '...'}/game/
                    </p>
                  )}
                </div>

                {/* Directory structure preview */}
                <div className="p-4 rounded-xl bg-secondary/20 border border-border/50">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2 font-bold">
                    目录结构预览
                  </div>
                  <pre className="text-xs text-muted-foreground leading-relaxed" style={{ fontFamily: 'var(--font-mono)' }}>
{`game/
├── scene/        场景脚本 (.txt)
├── background/   背景图片
├── figure/       角色立绘
├── bgm/          背景音乐
├── vocal/        语音文件
├── video/        视频文件
├── animation/    动画描述
├── tex/          特效纹理
└── config.txt    游戏配置`}
                  </pre>
                </div>

                {createError && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {createError}
                  </div>
                )}

                <button
                  onClick={handleCreateProject}
                  disabled={!projectName.trim() || !selectedDir || isCreating}
                  className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 disabled:grayscale"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      创建中...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      创建项目
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <div className="max-w-[1600px] mx-auto p-8 flex gap-8">
          {/* Left Sidebar */}
          <aside className="w-64 flex-shrink-0 hidden lg:flex flex-col gap-8">
            <nav className="space-y-1">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 text-primary border border-primary/20 transition-all">
                <Folder className="w-5 h-5" />
                <span className="font-medium">全部项目</span>
                <span className="ml-auto text-xs opacity-60">{projects.length}</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all">
                <Star className="w-5 h-5" />
                <span className="font-medium">我的收藏</span>
                <span className="ml-auto text-xs opacity-60">{projects.filter(p => p.isFavorite).length}</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all">
                <Clock className="w-5 h-5" />
                <span className="font-medium">最近编辑</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all">
                <Trash2 className="w-5 h-5" />
                <span className="font-medium">回收站</span>
              </button>
            </nav>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/10">
              <h3 className="text-sm font-medium text-primary mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                使用技巧
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                点击"创建新项目"选择存放位置，将自动生成 WebGAL 标准目录结构。也可以点击"打开项目"导入已有的 WebGAL 项目。
              </p>
            </div>
          </aside>

          {/* Project List */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-medium flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
                项目列表
                <span className="text-sm font-normal text-muted-foreground ml-2">({filteredProjects.length})</span>
              </h2>

              <div className="flex items-center gap-2 bg-secondary/50 rounded-lg p-1 border border-border">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'grid' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-secondary text-muted-foreground'
                  }`}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === 'list' ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-secondary text-muted-foreground'
                  }`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {filteredProjects.length === 0 ? (
              <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground bg-card/20 rounded-3xl border-2 border-dashed border-border/50">
                <div className="p-4 rounded-full bg-secondary/50 mb-4">
                  <Folder className="w-12 h-12 opacity-30" />
                </div>
                {searchQuery ? (
                  <>
                    <p className="text-lg">没有找到相关项目</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-4 text-primary hover:underline text-sm"
                    >
                      清除搜索内容
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-lg mb-2">还没有项目</p>
                    <p className="text-sm text-muted-foreground/60 mb-6">创建新项目或打开已有的 WebGAL 项目开始</p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleOpenProject}
                        className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/70 transition-colors flex items-center gap-2 text-sm border border-border"
                      >
                        <FolderOpen className="w-4 h-4" />
                        打开项目
                      </button>
                      <button
                        onClick={() => {
                          setIsModalOpen(true);
                          setProjectName('');
                          setProjectDesc('');
                          setSelectedDir(null);
                          setCreateError('');
                        }}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all flex items-center gap-2 text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        创建新项目
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => navigate(`/editor/${project.id}`)}
                    className="group bg-card border border-border rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(0,0,0,0.2)] hover:border-primary/30"
                  >
                    <div className="aspect-[16/9] bg-secondary/30 relative overflow-hidden">
                      {project.thumbnail ? (
                        <img
                          src={project.thumbnail}
                          alt={project.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/50 to-card">
                          <BookOpen className="w-16 h-16 text-muted-foreground opacity-20" />
                        </div>
                      )}

                      <div className="absolute top-3 right-3 flex gap-2 translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                        <button
                          onClick={(e) => toggleFavorite(project.id, e)}
                          className={`p-2 rounded-full backdrop-blur-md transition-colors ${
                            project.isFavorite ? 'bg-primary text-primary-foreground' : 'bg-black/40 text-white hover:bg-black/60'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${project.isFavorite ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => deleteProject(project.id, e)}
                          className="p-2 rounded-full bg-black/40 text-white hover:bg-destructive transition-colors backdrop-blur-md"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                        <div className="flex gap-3">
                          <div className="px-2 py-1 rounded bg-white/10 backdrop-blur-sm border border-white/10 text-[10px] text-white flex items-center gap-1">
                            <Layout className="w-3 h-3" />
                            {project.sceneCount} 场景
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-xl font-medium group-hover:text-primary transition-colors truncate pr-4">
                          {project.name}
                        </h3>
                        <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                        {project.description}
                      </p>
                      <div className="text-[10px] text-muted-foreground truncate mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
                        {project.path}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/50 pt-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {project.lastModified}
                        </div>
                        <span className="uppercase tracking-wider font-bold text-primary/60">
                          编辑
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => navigate(`/editor/${project.id}`)}
                    className="group flex items-center gap-6 p-4 bg-card border border-border rounded-2xl cursor-pointer transition-all hover:bg-secondary/20 hover:border-primary/30"
                  >
                    <div className="w-32 h-20 rounded-lg overflow-hidden bg-secondary/30 flex-shrink-0">
                      {project.thumbnail ? (
                        <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-muted-foreground opacity-20" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-medium group-hover:text-primary transition-colors truncate">
                          {project.name}
                        </h3>
                        {project.isFavorite && <Star className="w-4 h-4 text-primary fill-current" />}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{project.description}</p>
                      <p className="text-[10px] text-muted-foreground/60 truncate mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
                        {project.path}
                      </p>
                    </div>

                    <div className="flex items-center gap-8 text-sm text-muted-foreground px-4">
                      <div className="hidden sm:block">
                        <div className="text-xs uppercase tracking-wider opacity-50 mb-1">场景</div>
                        <div className="text-foreground font-mono">{project.sceneCount}</div>
                      </div>
                      <div className="hidden lg:block w-40">
                        <div className="text-xs uppercase tracking-wider opacity-50 mb-1">最后修改</div>
                        <div className="text-foreground text-xs">{project.lastModified}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                      <button
                        onClick={(e) => toggleFavorite(project.id, e)}
                        className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Star className={`w-4 h-4 ${project.isFavorite ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => deleteProject(project.id, e)}
                        className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
