import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Timer as TimerIcon, Play, Pause, RotateCcw, Users, Dices, History, Download,
  Trash2, Loader2, CheckCircle2, XCircle, Users2, Trophy,
} from 'lucide-react';
import { classroomApi } from '@/lib/api.js';
import type { ClassSession, ClassResults } from '@shared/types.js';
import WordCloud from '@/components/common/WordCloud';

function fmt(t: number) {
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ============ 全屏课堂计时器 ============
export function TimerTool() {
  const [total, setTotal] = useState(300);
  const [left, setLeft] = useState(300);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const ivRef = useRef<number>(0);

  useEffect(() => {
    if (!running) return;
    ivRef.current = window.setInterval(() => {
      setLeft(v => {
        if (v <= 1) {
          setRunning(false);
          setDone(true);
          return 0;
        }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(ivRef.current);
  }, [running]);

  const reset = (t?: number) => {
    setRunning(false);
    setDone(false);
    setLeft(t ?? total);
    if (t) setTotal(t);
  };

  const pct = total > 0 ? left / total : 0;
  const danger = left <= 30 && left > 0;

  return (
    <div className="max-w-2xl mx-auto glass-card rounded-3xl p-8 text-center">
      <h3 className="font-serif font-bold text-xl text-white mb-1 flex items-center justify-center gap-2">
        <TimerIcon className="w-5 h-5 text-cyan-400" /> 课堂计时器
      </h3>
      <p className="text-xs text-slate-400 mb-8">小组讨论 / 随堂练习倒计时，适合投屏</p>

      <div className="relative w-64 h-64 mx-auto mb-8">
        <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
          <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="10" />
          <circle
            cx="100" cy="100" r="88" fill="none"
            stroke={done ? '#34d399' : danger ? '#fb7185' : '#22d3ee'}
            strokeWidth="10" strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 88}`}
            strokeDashoffset={`${2 * Math.PI * 88 * (1 - pct)}`}
            style={{ transition: 'stroke-dashoffset 1s linear', filter: 'drop-shadow(0 0 10px currentColor)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-mono font-black text-5xl tabular-nums ${done ? 'text-emerald-300' : danger ? 'text-rose-300' : 'text-white'}`}>
            {fmt(left)}
          </span>
          {done && <span className="text-sm text-emerald-300 mt-2 font-medium">⏰ 时间到！</span>}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
        {[60, 180, 300, 600].map(t => (
          <button key={t} onClick={() => reset(t)}
            className={`px-4 py-2 rounded-xl text-xs font-medium border transition ${
              total === t ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300' : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-slate-200'
            }`}>
            {t < 60 ? `${t}秒` : `${t / 60}分钟`}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => { if (done || left === 0) reset(); else setRunning(v => !v); }}
          className="btn-primary !py-3 !px-8"
        >
          {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          {running ? '暂停' : left === 0 || done ? '重新开始' : '开始'}
        </button>
        <button onClick={() => reset()} className="btn-secondary !py-3">
          <RotateCcw className="w-4 h-4" /> 复位
        </button>
      </div>
    </div>
  );
}

// ============ 随机分组 ============
export function GroupingTool() {
  const [raw, setRaw] = useState('');
  const [groupCount, setGroupCount] = useState(4);
  const [groups, setGroups] = useState<string[][] | null>(null);
  const [shuffling, setShuffling] = useState(false);
  const ivRef = useRef<number>(0);

  const names = useMemo(() => raw.split(/[\n,，\t]+/).map(s => s.trim()).filter(Boolean), [raw]);

  const shuffle = () => {
    if (names.length === 0) return;
    setShuffling(true);
    let ticks = 0;
    const tick = () => {
      const arr = [...names];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      // 分组预览（打乱过程）
      const g: string[][] = Array.from({ length: groupCount }, () => []);
      arr.forEach((n, i) => g[i % groupCount].push(n));
      setGroups(g);
      ticks++;
      if (ticks < 14) ivRef.current = window.setTimeout(tick, 90 + ticks * 22);
      else setShuffling(false);
    };
    tick();
  };

  useEffect(() => () => clearTimeout(ivRef.current), []);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="glass-card rounded-3xl p-6 lg:p-8">
        <h3 className="font-serif font-bold text-xl text-white mb-1 flex items-center gap-2">
          <Users2 className="w-5 h-5 text-violet-400" /> 随机分组
        </h3>
        <p className="text-xs text-slate-400 mb-5">粘贴全班名单，随机均分小组（带洗牌动画，适合投屏）</p>
        <textarea
          className="input-field font-mono text-xs min-h-[100px]"
          placeholder={'每行一个名字，或用逗号分隔：\n张三\n李四\n王五…'}
          value={raw}
          onChange={e => setRaw(e.target.value)}
        />
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">组数</span>
            {[2, 3, 4, 5, 6].map(n => (
              <button key={n} onClick={() => setGroupCount(n)}
                className={`w-9 h-9 rounded-xl text-sm font-mono border transition ${
                  groupCount === n ? 'bg-violet-500/15 border-violet-500/40 text-violet-300' : 'bg-white/[0.03] border-white/10 text-slate-400'
                }`}>
                {n}
              </button>
            ))}
          </div>
          <button onClick={shuffle} disabled={shuffling || names.length === 0} className="btn-primary !py-2.5 ml-auto disabled:opacity-60">
            <Dices className={`w-4 h-4 ${shuffling ? 'animate-spin' : ''}`} /> {shuffling ? '洗牌中…' : `开始分组 (${names.length}人)`}
          </button>
        </div>
      </div>

      {groups && (
        <div className="grid sm:grid-cols-2 gap-4 animate-[fadeIn_.4s_ease]">
          {groups.map((g, i) => (
            <div key={i} className="glass-card rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/30 to-blue-500/30 border border-violet-500/30 flex items-center justify-center font-mono text-sm text-violet-300">
                  {i + 1}
                </span>
                <span className="text-sm font-semibold text-white">第 {i + 1} 组 · {g.length} 人</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {g.map(n => (
                  <span key={n} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-xs text-slate-300">{n}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============ 历史记录 ============
export function HistoryPanel({ refreshKey, onResume }: { refreshKey: number; onResume?: (type: string, sessionId: string) => void }) {
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<ClassResults | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const list = await classroomApi.listSessions();
      setSessions(list);
    } catch { /* ignore */ }
    setLoading(false);
  };
  useEffect(() => { load(); }, [refreshKey]);

  const openDetail = async (s: ClassSession) => {
    try {
      const r = await classroomApi.results(s.id);
      setDetail(r);
    } catch { /* ignore */ }
  };

  const typeLabel: Record<string, string> = {
    attendance: '签到', quiz: '答题', poll: '投票', danmaku: '弹幕', rating: '评价',
  };
  const typeColor: Record<string, string> = {
    attendance: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/25',
    quiz: 'text-amber-300 bg-amber-500/10 border-amber-500/25',
    poll: 'text-blue-300 bg-blue-500/10 border-blue-500/25',
    danmaku: 'text-violet-300 bg-violet-500/10 border-violet-500/25',
    rating: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif font-bold text-xl text-white flex items-center gap-2">
            <History className="w-5 h-5 text-slate-300" /> 课堂互动历史
          </h3>
          <span className="text-xs text-slate-500">全部数据保存在本地数据库 data/app.db</span>
        </div>
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">加载中…</div>
        ) : sessions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            暂无历史记录，去"智能签到"或"课堂答题"发起第一次互动吧
          </div>
        ) : (
          <div className="space-y-2.5">
            {sessions.map(s => (
              <div key={s.id} className="flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3 hover:bg-white/[0.06] transition group">
                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border flex-shrink-0 ${typeColor[s.type]}`}>
                  {typeLabel[s.type]}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-white truncate">{s.title}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {new Date(s.createdAt).toLocaleString('zh-CN')} · 加入码 {s.code} · {s.closed ? '已结束' : '进行中'}
                  </div>
                </div>
                {!s.closed && onResume && (
                  <button onClick={() => onResume(s.type, s.id)} className="text-xs text-emerald-400 hover:text-emerald-300 flex-shrink-0">
                    继续监控
                  </button>
                )}
                <button onClick={() => openDetail(s)} className="text-xs text-signal-400 hover:text-signal-300 flex-shrink-0">
                  查看结果
                </button>
                <button
                  onClick={async () => {
                    if (!confirm(`确定删除「${s.title}」及其全部数据？`)) return;
                    await classroomApi.deleteSession(s.id);
                    load();
                  }}
                  className="text-slate-600 hover:text-rose-300 transition flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 结果详情 */}
      {detail && (
        <div className="glass-card rounded-3xl p-6 animate-[fadeIn_.3s_ease]">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-white">{detail.session.title} · 结果</h4>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const type = detail.session.type;
                  const rows: (string | number)[][] = type === 'attendance'
                    ? [['姓名', '学号', '班级', '时间'], ...detail.events.map(e => [e.name, e.studentId || '', e.className || '', new Date(e.at).toLocaleString('zh-CN')])]
                    : [['姓名', '学号', '提交内容', '时间'], ...detail.events.map(e => [e.name, e.studentId || '', e.payload, new Date(e.at).toLocaleString('zh-CN')])];
                  const csv = '\uFEFF' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = `${detail.session.title}_${detail.session.code}.csv`;
                  a.click();
                }}
                className="text-xs text-slate-400 hover:text-signal-300 flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> 导出
              </button>
              <button onClick={() => setDetail(null)} className="text-xs text-slate-500 hover:text-white">关闭</button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <Stat label="互动类型" value={typeLabel[detail.session.type]} />
            <Stat label="事件数" value={String(detail.events.length)} />
            {detail.session.type === 'quiz' && <Stat label="正确率" value={`${detail.summary.correctRate}%`} />}
            {detail.session.type === 'rating' && <Stat label="平均分" value={String(detail.summary.avgRating)} />}
            {detail.session.type === 'attendance' && <Stat label="缺席" value={String(detail.summary.absentList.length)} />}
          </div>
          {detail.summary.wordFreq.length > 0 && (
            <WordCloud words={detail.summary.wordFreq.map(w => ({ word: w.word, count: w.count }))} height={240} />
          )}
          {detail.events.length > 0 && (
            <div className="mt-4 max-h-52 overflow-auto space-y-1.5">
              {detail.events.map(e => (
                <div key={e.id} className="flex items-center gap-2 text-xs text-slate-400 px-2 py-1.5 rounded-lg bg-white/[0.03]">
                  <span className="text-slate-200">{e.name}</span>
                  <span className="font-mono text-slate-500">{e.payload.slice(0, 40)}</span>
                  <span className="ml-auto font-mono text-slate-600">{new Date(e.at).toLocaleTimeString('zh-CN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat(p: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-900/60 border border-white/5 px-3.5 py-2.5">
      <div className="text-[10px] text-slate-500">{p.label}</div>
      <div className="font-mono text-base text-white mt-0.5">{p.value}</div>
    </div>
  );
}
