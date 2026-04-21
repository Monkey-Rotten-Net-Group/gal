import { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  Plus, 
  Search, 
  Grid3x3, 
  List as ListIcon, 
  MoreVertical, 
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
  GitBranch
} from 'lucide-react';

export interface Project {
  id: string;
  name: string;
  description: string;
  lastModified: string;
  thumbnail?: string;
  isFavorite: boolean;
  nodeCount: number;
  assetCount: number;
}

export function ProjectHome() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [outline, setOutline] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState<'input' | 'processing'>('input');
  
  // Mock data for projects
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: '苍穹之下的誓言',
      description: '一个关于星际旅行与古老传说的奇幻故事。',
      lastModified: '2026-04-14 15:30',
      thumbnail: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400',
      isFavorite: true,
      nodeCount: 42,
      assetCount: 15,
    },
    {
      id: '2',
      name: '雨夜侦探',
      description: '硬汉派侦探在霓虹闪烁的都市中追寻真相。',
      lastModified: '2026-04-12 09:15',
      thumbnail: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=400',
      isFavorite: false,
      nodeCount: 28,
      assetCount: 8,
    },
    {
      id: '3',
      name: '夏日回忆',
      description: '重返那个蝉鸣阵阵的夏天，寻找失落的记忆。',
      lastModified: '2026-04-10 18:45',
      thumbnail: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400',
      isFavorite: true,
      nodeCount: 115,
      assetCount: 34,
    }
  ]);

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateProject = () => {
    if (!outline.trim()) return;
    
    setIsGenerating(true);
    setStep('processing');
    
    // Simulate AI processing
    setTimeout(() => {
      const newId = Date.now().toString();
      const newProject: Project = {
        id: newId,
        name: outline.split('\n')[0].substring(0, 20) || '新项目',
        description: outline.substring(0, 100),
        lastModified: new Date().toLocaleString(),
        isFavorite: false,
        nodeCount: 5, // Mock generated nodes
        assetCount: 3, // Mock generated assets
      };
      setProjects([newProject, ...projects]);
      setIsGenerating(false);
      setIsModalOpen(false);
      navigate(`/editor/${newId}`);
    }, 3000);
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProjects(projects.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
  };

  const deleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个项目吗？此操作不可撤销。')) {
      setProjects(projects.filter(p => p.id !== id));
    }
  };

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
              onClick={() => {
                setIsModalOpen(true);
                setStep('input');
                setOutline('');
              }}
              className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground flex items-center gap-2 hover:opacity-90 transition-all hover:shadow-[0_0_20px_rgba(212,165,116,0.4)] font-medium"
            >
              <Plus className="w-5 h-5" />
              <span>创建新项目</span>
            </button>
          </div>
        </div>
      </header>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-card border border-primary/20 rounded-3xl shadow-[0_32px_64px_rgba(0,0,0,0.4)] overflow-hidden relative">
            <button 
              onClick={() => !isGenerating && setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-secondary/50 transition-colors text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            {step === 'input' ? (
              <div className="p-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-3 rounded-2xl bg-primary/20 text-primary">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-medium" style={{ fontFamily: 'var(--font-display)' }}>
                      智能构建新项目
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      输入你的故事大纲或灵感，AI 将为你拆解初步框架
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-3 font-bold">
                      故事大纲 / 灵感片段
                    </label>
                    <textarea
                      autoFocus
                      className="w-full h-48 bg-secondary/30 border border-border rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all placeholder:text-muted-foreground/30 leading-relaxed text-lg"
                      placeholder="在这里输入你的故事想法，例如：一个在末日废土中寻找最后一颗种子的机器人，遇到了一个能够与植物沟通的女孩..."
                      value={outline}
                      onChange={(e) => setOutline(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-secondary/20 border border-border/50 flex flex-col items-center text-center">
                      <Users className="w-5 h-5 text-primary/60 mb-2" />
                      <span className="text-[10px] uppercase tracking-tighter text-muted-foreground">提取角色</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-secondary/20 border border-border/50 flex flex-col items-center text-center">
                      <MapPin className="w-5 h-5 text-primary/60 mb-2" />
                      <span className="text-[10px] uppercase tracking-tighter text-muted-foreground">生成场景</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-secondary/20 border border-border/50 flex flex-col items-center text-center">
                      <GitBranch className="w-5 h-5 text-primary/60 mb-2" />
                      <span className="text-[10px] uppercase tracking-tighter text-muted-foreground">规划分支</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCreateProject}
                    disabled={!outline.trim()}
                    className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-lg flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50 disabled:grayscale"
                  >
                    <Sparkles className="w-5 h-5" />
                    立即开始拆解构建
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-20 flex flex-col items-center text-center">
                <div className="relative mb-10">
                  <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
                  <Loader2 className="w-16 h-16 text-primary animate-spin relative" />
                </div>
                <h3 className="text-2xl font-medium mb-4" style={{ fontFamily: 'var(--font-display)' }}>
                  正在编织你的故事卷轴...
                </h3>
                <div className="space-y-3 max-w-sm w-full">
                  <div className="h-1 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-progress" style={{ width: '60%' }} />
                  </div>
                  <div className="flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                    <span>分析大纲内容</span>
                    <span className="text-primary">处理中</span>
                  </div>
                </div>
                
                <div className="mt-12 grid grid-cols-2 gap-x-8 gap-y-4 text-left">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                    正在识别核心角色...
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                    规划场景流转...
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                    提取关键选择点...
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                    生成初步节点图...
                  </div>
                </div>
              </div>
            )}
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
                使用右侧的"创建新项目"按钮开始你的第一个故事。你可以随时通过 AI 助手来生成灵感。
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
                <p className="text-lg">没有找到相关项目</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-4 text-primary hover:underline text-sm"
                >
                  清除搜索内容
                </button>
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
                            {project.nodeCount} 节点
                          </div>
                          <div className="px-2 py-1 rounded bg-white/10 backdrop-blur-sm border border-white/10 text-[10px] text-white flex items-center gap-1">
                            <Folder className="w-3 h-3" />
                            {project.assetCount} 素材
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
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-6 h-10 leading-relaxed">
                        {project.description}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/50 pt-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          最后修改: {project.lastModified}
                        </div>
                        <button className="flex items-center gap-1 hover:text-primary transition-colors uppercase tracking-wider font-bold">
                          编辑内容
                        </button>
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
                    </div>

                    <div className="flex items-center gap-8 text-sm text-muted-foreground px-4">
                      <div className="hidden sm:block">
                        <div className="text-xs uppercase tracking-wider opacity-50 mb-1">节点</div>
                        <div className="text-foreground font-mono">{project.nodeCount}</div>
                      </div>
                      <div className="hidden sm:block">
                        <div className="text-xs uppercase tracking-wider opacity-50 mb-1">素材</div>
                        <div className="text-foreground font-mono">{project.assetCount}</div>
                      </div>
                      <div className="hidden lg:block w-40">
                        <div className="text-xs uppercase tracking-wider opacity-50 mb-1">最后修改</div>
                        <div className="text-foreground text-xs">{project.lastModified}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(project.id, e); }}
                        className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Star className={`w-4 h-4 ${project.isFavorite ? 'fill-current' : ''}`} />
                      </button>
                      <button className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                        <Edit className="w-4 h-4" />
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
