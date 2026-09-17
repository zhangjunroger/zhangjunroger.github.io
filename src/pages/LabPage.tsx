import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Activity, Waves, Move, LineChart, Orbit, GitBranch, SlidersHorizontal,
  Target, RefreshCw, Cpu, ArrowLeft, ArrowRight, Clock, Signal, FlaskConical,
  ChevronRight, BookOpen, ListChecks, HelpCircle, Play, Home,
} from 'lucide-react';
import { EXPERIMENTS, getExperiment } from '@/experiments/registry';

const ICONS: Record<string, typeof Activity> = {
  activity: Activity, waves: Waves, move: Move, chart: LineChart, orbit: Orbit,
  'git-branch': GitBranch, sliders: SlidersHorizontal, target: Target,
  refresh: RefreshCw, cpu: Cpu,
};

function TopBar({ title, sub }: { title: string; sub: string }) {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
      <div className="container flex items-center justify-between py-3">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-signal-400" />
          </div>
          <div className="leading-tight">
            <div className="font-serif font-bold text-white text-[15px]">自动控制原理 · 智慧课程</div>
            <div className="text-[10px] text-slate-500 tracking-widest uppercase">{sub}</div>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden md:inline text-sm text-white font-medium mr-1">{title}</span>
          <Link to="/" className="btn-ghost !py-2 text-sm"><Home className="w-4 h-4" /> 首页</Link>
          <Link to="/classroom" className="btn-ghost !py-2 text-sm"><Signal className="w-4 h-4" /> 智慧课堂</Link>
        </div>
      </div>
    </header>
  );
}

export default function LabPage() {
  const { expId } = useParams();
  const navigate = useNavigate();
  const exp = expId ? getExperiment(expId) : undefined;

  if (expId && !exp) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200">
        <TopBar title="实验平台" sub="Interactive Lab" />
        <div className="container py-24 text-center">
          <p className="text-slate-400 mb-4">未找到该实验</p>
          <Link to="/lab" className="btn-primary">返回实验列表</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 relative">
      <TopBar title={exp ? exp.title : '在线实验平台'} sub="Interactive Lab" />
      {exp ? <ExperimentDetail expId={exp.id} /> : <ExperimentHub onOpen={(id) => navigate(`/lab/${id}`)} />}
    </div>
  );
}

// ============ 实验列表 ============
function ExperimentHub({ onOpen }: { onOpen: (id: string) => void }) {
  const [filter, setFilter] = useState<string>('all');
  const chapters = useMemo(() => ['all', ...Array.from(new Set(EXPERIMENTS.map(e => e.chapter)))], []);
  const list = filter === 'all' ? EXPERIMENTS : EXPERIMENTS.filter(e => e.chapter === filter);

  return (
    <main className="relative">
      <div className="absolute inset-0 bg-grid opacity-30 mask-fade-b pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[400px] rounded-full bg-brand-600/20 blur-[130px] pointer-events-none" />
      <div className="absolute top-40 right-0 w-[400px] h-[400px] rounded-full bg-signal-600/15 blur-[130px] pointer-events-none" />

      <div className="container relative py-12 lg:py-16">
        {/* Hero */}
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 mb-5">
            <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-300">浏览器即开即用 · 无需安装 MATLAB · 数据本地保存</span>
          </div>
          <h1 className="font-serif font-black text-4xl md:text-5xl text-white leading-tight mb-4">
            在线仿真实验平台
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            10 个覆盖全书知识脉络的交互实验，每个实验都带有<span className="text-signal-300 font-medium">动画演示</span>与
            <span className="text-violet-300 font-medium">逐步计算流程</span>——
            不止看到结果，更能看清每一步算法背后的数值是怎么算出来的。
          </p>
        </div>

        {/* 章节筛选 */}
        <div className="flex items-center gap-2 flex-wrap mb-8">
          {chapters.map(c => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-4 py-2 rounded-xl text-xs font-medium border transition ${
                filter === c
                  ? 'bg-signal-500/15 border-signal-500/40 text-signal-300'
                  : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-slate-200 hover:border-white/20'
              }`}
            >
              {c === 'all' ? `全部 (${EXPERIMENTS.length})` : c}
            </button>
          ))}
        </div>

        {/* 实验卡片 */}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {list.map((exp, i) => {
            const Icon = ICONS[exp.icon] ?? Activity;
            const diffLabel = ['入门', '进阶', '挑战'][exp.difficulty - 1];
            return (
              <button
                key={exp.id}
                onClick={() => onOpen(exp.id)}
                className="group text-left glass-card glass-card-hover rounded-3xl overflow-hidden relative"
                style={{ animation: `fadeUp .5s ${i * 0.05}s ease both` }}
              >
                <div
                  className="h-2 w-full"
                  style={{ background: `linear-gradient(90deg, ${exp.accent}, transparent)` }}
                />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center border"
                      style={{ background: `${exp.accent}14`, borderColor: `${exp.accent}44` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: exp.accent }} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="tag-pill bg-white/5 border border-white/10 text-slate-400 text-[10px]">
                        <Signal className="w-3 h-3 mr-1" style={{ color: exp.accent }} />{diffLabel}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-serif font-bold text-lg text-white mb-1 group-hover:text-signal-300 transition-colors">
                    {exp.title}
                  </h3>
                  <p className="text-xs font-mono mb-3" style={{ color: `${exp.accent}cc` }}>{exp.subtitle}</p>
                  <p className="text-[13px] text-slate-400 leading-relaxed line-clamp-3 mb-4">
                    {exp.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {exp.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded-md bg-slate-800/70 text-[10px] text-slate-400 font-mono">
                        #{t}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5 text-xs">
                    <div className="flex items-center gap-3 text-slate-500">
                      <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{exp.chapter.split(' ')[0]}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{exp.duration}</span>
                    </div>
                    <span className="flex items-center gap-1 font-semibold text-signal-400 group-hover:gap-2 transition-all">
                      进入实验 <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 底部说明 */}
        <div className="mt-12 glass-card rounded-3xl p-7 flex flex-col md:flex-row md:items-center gap-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-signal-500/10 via-transparent to-violet-500/10 pointer-events-none" />
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-signal-500 to-brand-600 flex items-center justify-center shadow-glow-cyan flex-shrink-0">
            <ListChecks className="w-7 h-7 text-white" />
          </div>
          <div className="relative flex-1 min-w-0">
            <h4 className="font-serif font-bold text-lg text-white mb-1">实验报告 & 学习路径建议</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              建议按章节顺序进行：数学模型 → 时域分析 → 根轨迹 → 频域分析 → 校正设计 → 非线性/离散系统。
              每个实验完成后点击"保存实验记录"，参数与关键指标会存入本地数据库，方便撰写实验报告与复习。
            </p>
          </div>
          <Link to="/classroom" className="relative btn-primary whitespace-nowrap">
            前往智慧课堂 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}

// ============ 实验详情 ============
function ExperimentDetail({ expId }: { expId: string }) {
  const exp = getExperiment(expId)!;
  const Comp = exp.component;
  const [tab, setTab] = useState<'lab' | 'theory' | 'guide'>('lab');

  return (
    <main className="relative">
      <div className="absolute top-0 left-1/3 w-[600px] h-[300px] rounded-full opacity-30 blur-[130px] pointer-events-none"
        style={{ background: exp.accent }} />

      <div className="container relative py-8">
        {/* 面包屑 + 标题 */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
          <Link to="/lab" className="flex items-center gap-1 hover:text-signal-400 transition">
            <ArrowLeft className="w-3.5 h-3.5" /> 实验平台
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span>{exp.chapter}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-300">{exp.title}</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif font-black text-2xl md:text-3xl text-white mb-2 flex items-center gap-3">
              <span className="w-2 h-8 rounded-full" style={{ background: exp.accent }} />
              {exp.title}
            </h1>
            <p className="text-slate-400 text-sm">{exp.subtitle} · 建议时长 {exp.duration}</p>
          </div>
          <div className="flex items-center gap-1 bg-slate-900/70 border border-white/10 rounded-2xl p-1 self-start">
            {([['lab', '交互实验', Play], ['theory', '实验原理', BookOpen], ['guide', '步骤与思考', HelpCircle]] as const).map(([k, label, Icon]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition ${
                  tab === k ? 'bg-signal-500/15 text-signal-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'lab' && (
          <div className="animate-[fadeIn_.3s_ease]">
            <Comp />
          </div>
        )}

        {tab === 'theory' && (
          <div className="grid lg:grid-cols-2 gap-5 animate-[fadeIn_.3s_ease]">
            <div className="glass-card rounded-3xl p-6 lg:p-7">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${exp.accent}18` }}>
                  <BookOpen className="w-5 h-5" style={{ color: exp.accent }} />
                </div>
                <h3 className="font-serif font-bold text-lg text-white">实验原理</h3>
              </div>
              <div className="space-y-3.5">
                {exp.theory.map((t, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="font-mono text-xs mt-1 flex-shrink-0" style={{ color: exp.accent }}>{String(i + 1).padStart(2, '0')}</span>
                    <p className="text-[13.5px] leading-relaxed text-slate-300">{t}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card rounded-3xl p-6 lg:p-7">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-500/15">
                  <Target className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-serif font-bold text-lg text-white">实验目的</h3>
              </div>
              <ul className="space-y-3">
                {exp.objectives.map((o, i) => (
                  <li key={i} className="flex gap-3 text-[13.5px] text-slate-300 leading-relaxed">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    {o}
                  </li>
                ))}
              </ul>
              <div className="mt-5 rounded-2xl bg-slate-900/60 border border-white/5 p-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  <span className="text-signal-300 font-medium">学习提示：</span>
                  建议先阅读左侧原理要点，再到"交互实验"页按下方步骤操作，最后回到这里对照思考题自测。
                </p>
              </div>
            </div>
          </div>
        )}

        {tab === 'guide' && (
          <div className="grid lg:grid-cols-2 gap-5 animate-[fadeIn_.3s_ease]">
            <div className="glass-card rounded-3xl p-6 lg:p-7">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-signal-500/15">
                  <ListChecks className="w-5 h-5 text-signal-400" />
                </div>
                <h3 className="font-serif font-bold text-lg text-white">实验步骤</h3>
              </div>
              <ol className="space-y-4">
                {exp.procedure.map((s, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="w-7 h-7 rounded-full bg-gradient-to-br from-signal-500/30 to-brand-500/30 border border-signal-500/40 text-signal-300 font-mono text-xs flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-[13.5px] text-slate-300 leading-relaxed pt-1">{s}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div className="glass-card rounded-3xl p-6 lg:p-7">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-500/15">
                  <HelpCircle className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="font-serif font-bold text-lg text-white">思考题</h3>
              </div>
              <ul className="space-y-4">
                {exp.questions.map((q, i) => (
                  <li key={i} className="rounded-2xl bg-slate-900/60 border border-white/5 p-4 flex gap-3">
                    <span className="font-mono text-amber-400 text-xs mt-0.5 flex-shrink-0">Q{i + 1}</span>
                    <p className="text-[13.5px] text-slate-300 leading-relaxed">{q}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
