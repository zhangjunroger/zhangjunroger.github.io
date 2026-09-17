import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, QrCode, MessageSquare, BarChart3, Timer as TimerIcon, Home,
  History, Users2, Wifi, Signal, ChevronRight, GraduationCap,
} from 'lucide-react';
import { AttendancePanel, QuizPanel, PollPanel, DanmakuPanel, RatingPanel } from '@/components/classroom/SessionPanels';
import { TimerTool, GroupingTool, HistoryPanel } from '@/components/classroom/Tools';
import { IS_STATIC_MODE } from '@/lib/env';
import type { ClassSession } from '@shared/types.js';

type ModuleKey = 'attendance' | 'quiz' | 'poll' | 'danmaku' | 'rating' | 'timer' | 'grouping' | 'history';

const MODULES: { key: ModuleKey; label: string; desc: string; icon: typeof QrCode; accent: string; tag: string }[] = [
  { key: 'attendance', label: '智能签到', desc: '扫码签到 · 缺席名单 · 词云', icon: QrCode, accent: '#22d3ee', tag: '每课必用' },
  { key: 'quiz', label: '课堂答题', desc: '扫码作答 · 实时统计 · 词云', icon: MessageSquare, accent: '#fbbf24', tag: '每课必用' },
  { key: 'poll', label: '投票表决', desc: '全班意见 · 实时比例', icon: BarChart3, accent: '#60a5fa', tag: '互动' },
  { key: 'danmaku', label: '弹幕提问墙', desc: '扫码提问 · 大屏弹幕', icon: Wifi, accent: '#a78bfa', tag: '互动' },
  { key: 'rating', label: '难度反馈', desc: '下课评价 · 难度直方图', icon: Signal, accent: '#34d399', tag: '每课必用' },
  { key: 'timer', label: '课堂计时器', desc: '讨论/练习倒计时', icon: TimerIcon, accent: '#22d3ee', tag: '工具' },
  { key: 'grouping', label: '随机分组', desc: '名单洗牌 · 均分小组', icon: Users2, accent: '#a78bfa', tag: '工具' },
  { key: 'history', label: '历史与导出', desc: '往期数据 · CSV导出', icon: History, accent: '#94a3b8', tag: '数据' },
];

export default function ClassroomPage() {
  const [active, setActive] = useState<ModuleKey>('attendance');
  const [liveSession, setLiveSession] = useState<ClassSession | null>(null);
  const [resumeSessionId, setResumeSessionId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const onSessionCreated = (s: ClassSession | null) => {
    setLiveSession(s);
    if (s === null) { setRefreshKey(k => k + 1); setResumeSessionId(null); }
  };

  const onResume = (type: string, sessionId: string) => {
    const map: Record<string, ModuleKey> = {
      attendance: 'attendance', quiz: 'quiz', poll: 'poll', danmaku: 'danmaku', rating: 'rating',
    };
    setActive(map[type] ?? 'attendance');
    setResumeSessionId(sessionId);
  };

  const mod = MODULES.find(m => m.key === active)!;
  const modAccent = mod.accent;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 relative">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="container flex items-center justify-between py-3">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-signal-400" />
            </div>
            <div className="leading-tight">
              <div className="font-serif font-bold text-white text-[15px]">自动控制原理 · 智慧课堂</div>
              <div className="text-[10px] text-slate-500 tracking-widest uppercase">Smart Classroom Console</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 mr-2">
              <GraduationCap className="w-4 h-4" /> 教师控制台
            </span>
            <Link to="/" className="btn-ghost !py-2 text-sm"><Home className="w-4 h-4" /> 首页</Link>
            <Link to="/lab" className="btn-ghost !py-2 text-sm"><Signal className="w-4 h-4" /> 实验平台</Link>
          </div>
        </div>
      </header>

      <main className="relative">
        <div className="absolute inset-0 bg-grid opacity-25 mask-fade-b pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[350px] rounded-full bg-violet-600/15 blur-[130px] pointer-events-none" />

        <div className="container relative py-8">
          {/* 标题区 */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-7">
            <div>
              <h1 className="font-serif font-black text-2xl md:text-3xl text-white flex items-center gap-3">
                <span className="w-2 h-8 rounded-full bg-gradient-to-b from-violet-400 to-cyan-400" />
                智慧课堂教学工具箱
              </h1>
              <p className="text-slate-400 text-sm mt-2">
                扫码即用、免安装：学生手机扫码签到/答题/发弹幕，全部数据实时汇总到大屏，并存入本地数据库
                <code className="ml-1 px-1.5 py-0.5 rounded bg-slate-900 border border-white/10 font-mono text-[11px] text-signal-300">data/app.db</code>
              </p>
            </div>
            {liveSession && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-emerald-300">进行中：{liveSession.title}</span>
                <code className="font-mono text-amber-300 font-bold tracking-widest ml-1">{liveSession.code}</code>
              </div>
            )}
          </div>

          {/* 静态模式提示（GitHub Pages 等纯静态部署时） */}
          {IS_STATIC_MODE && (
            <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] px-5 py-4 flex items-start gap-3">
              <span className="text-lg">ℹ️</span>
              <div className="text-xs text-slate-300 leading-relaxed">
                <span className="text-amber-300 font-semibold">当前为网页静态演示版。</span>
                扫码签到/答题等实时互动功能需要运行后端服务后使用：在教师电脑执行
                <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-900 border border-white/10 font-mono">npm start</code>
                （或部署到 Render 等云平台），随后全班手机即可通过局域网/公网扫码参与，数据将存入本地数据库。
                本页中的「课堂计时器」「随机分组」为纯前端工具，可直接使用。
              </div>
            </div>
          )}

          {/* 模块选择 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 mb-8">
            {MODULES.map(m => {
              const Icon = m.icon;
              const isActive = active === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setActive(m.key)}
                  className={`relative rounded-2xl border p-3.5 text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-white/[0.07] border-white/25 shadow-lg scale-[1.02]'
                      : 'bg-white/[0.02] border-white/8 hover:bg-white/[0.05] hover:border-white/15'
                  }`}
                  style={isActive ? { borderColor: `${m.accent}66`, boxShadow: `0 0 24px ${m.accent}22` } : undefined}
                >
                  <Icon className="w-5 h-5 mb-2" style={{ color: m.accent }} />
                  <div className="text-[13px] font-semibold text-white leading-tight">{m.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-tight">{m.desc}</div>
                  <span className="absolute top-2.5 right-2.5 text-[9px] px-1.5 py-0.5 rounded-md bg-white/5 text-slate-500 border border-white/5">
                    {m.tag}
                  </span>
                  {isActive && <ChevronRight className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5" style={{ color: m.accent }} />}
                </button>
              );
            })}
          </div>

          {/* 模块内容 */}
          <div key={active} className="animate-[fadeIn_.3s_ease]">
            {active === 'attendance' && <AttendancePanel onSessionCreated={onSessionCreated} resumeSessionId={resumeSessionId} />}
            {active === 'quiz' && <QuizPanel onSessionCreated={onSessionCreated} resumeSessionId={resumeSessionId} />}
            {active === 'poll' && <PollPanel onSessionCreated={onSessionCreated} resumeSessionId={resumeSessionId} />}
            {active === 'danmaku' && <DanmakuPanel onSessionCreated={onSessionCreated} resumeSessionId={resumeSessionId} />}
            {active === 'rating' && <RatingPanel onSessionCreated={onSessionCreated} resumeSessionId={resumeSessionId} />}
            {active === 'timer' && <TimerTool />}
            {active === 'grouping' && <GroupingTool />}
            {active === 'history' && <HistoryPanel refreshKey={refreshKey} onResume={onResume} />}
          </div>

          {/* 页脚提示 */}
          <div className="mt-10 rounded-2xl border border-white/5 bg-slate-900/40 px-5 py-4 flex items-start gap-3">
            <span className="text-lg">💡</span>
            <p className="text-xs text-slate-400 leading-relaxed">
              <span className="text-slate-200 font-medium">上课使用流程建议：</span>
              ① 开课前 2 分钟打开"智能签到"投出二维码 → ② 讲授中用"课堂答题"发起 1~2 次随练检验理解 →
              ③ 疑难处开"弹幕提问墙"收集问题 → ④ 用"随机分组"+"计时器"组织小组讨论 →
              ⑤ 下课前用"难度反馈"收集学情，数据自动入库，可在"历史与导出"中复盘。
              学生端无需安装任何 App，微信/浏览器扫码即可参与。
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
