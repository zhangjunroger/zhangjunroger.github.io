import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  QrCode, Users, CheckCircle2, XCircle, Trophy, BarChart3, Download, Square,
  Play, Clock, Dices, MessageSquare, Eye, RotateCcw, Wifi, Loader2, ClipboardPaste,
} from 'lucide-react';
import QRCodeView from '@/components/common/QRCodeView';
import WordCloud from '@/components/common/WordCloud';
import { classroomApi } from '@/lib/api.js';
import type { ClassSession, ClassSessionType, ClassResults, ClassEvent } from '@shared/types.js';

// ============ 结果轮询 Hook ============
export function useSessionResults(sessionId: string | null, intervalMs = 2000) {
  const [results, setResults] = useState<ClassResults | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    if (!sessionId) return;
    try {
      const r = await classroomApi.results(sessionId);
      setResults(r);
      setErr(null);
    } catch (e: any) {
      setErr(e?.message || '加载失败');
    }
  }, [sessionId]);
  useEffect(() => {
    if (!sessionId) { setResults(null); return; }
    refresh();
    const t = setInterval(refresh, intervalMs);
    return () => clearInterval(t);
  }, [sessionId, intervalMs, refresh]);
  return { results, err, refresh };
}

// ============ CSV 导出 ============
function exportCsv(filename: string, rows: (string | number)[][]) {
  const BOM = '\uFEFF';
  const csv = BOM + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ============ 会话创建表单 ============
function CreateCard(p: {
  icon: React.ReactNode; title: string; desc: string;
  accent: string; onCreate: (payload: any) => Promise<void>; submitting: boolean;
  extraFields?: React.ReactNode;
  durationMin: number; setDurationMin: (v: number) => void;
  rosterRaw: string; setRosterRaw: (v: string) => void;
  showRoster: boolean;
  titleVal: string; setTitleVal: (v: string) => void;
}) {
  const [advanced, setAdvanced] = useState(false);
  return (
    <div className="max-w-xl mx-auto glass-card rounded-3xl p-6 lg:p-8">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `${p.accent}1a` }}>
          {p.icon}
        </div>
        <div>
          <h3 className="font-serif font-bold text-xl text-white">{p.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{p.desc}</p>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1.5">活动标题</label>
          <input
            className="input-field"
            placeholder={`例如：${p.titleVal}`}
            value={p.titleVal}
            onChange={e => p.setTitleVal(e.target.value)}
          />
        </div>
        {p.extraFields}
        <div className="flex items-center justify-between rounded-2xl bg-slate-900/60 border border-white/5 px-4 py-3">
          <span className="text-xs text-slate-300 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-500" />限时</span>
          <div className="flex items-center gap-1">
            {[0, 5, 10, 30].map(m => (
              <button key={m} onClick={() => p.setDurationMin(m)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition ${
                  p.durationMin === m ? 'bg-signal-500/20 text-signal-300' : 'text-slate-500 hover:text-slate-300'
                }`}>
                {m === 0 ? '不限' : `${m}分`}
              </button>
            ))}
          </div>
        </div>
        {p.showRoster && (
          <div>
            <button
              onClick={() => setAdvanced(v => !v)}
              className="text-xs text-slate-400 hover:text-signal-300 flex items-center gap-1 transition"
            >
              <Users className="w-3.5 h-3.5" /> 花名册（可选，粘贴后可对比缺勤名单）
              <span className="text-[10px]">{advanced ? '▲ 收起' : '▼ 展开'}</span>
            </button>
            {advanced && (
              <textarea
                className="input-field mt-2 font-mono text-xs min-h-[110px]"
                placeholder={'每行一位学生：姓名,学号,班级\n例如：\n张三,20240101,自动化2401\n李四,20240102,自动化2401'}
                value={p.rosterRaw}
                onChange={e => p.setRosterRaw(e.target.value)}
              />
            )}
          </div>
        )}
        <button
          onClick={() => p.onCreate({})}
          disabled={p.submitting}
          className="w-full btn-primary disabled:opacity-60"
        >
          {p.submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
          生成二维码，开始互动
        </button>
      </div>
    </div>
  );
}

// ============ 会话进行中头部（二维码 + 统计） ============
export function SessionHeader(p: {
  session: ClassSession;
  results: ClassResults | null;
  statMain: { label: string; value: string; tone: string };
  statSub?: { label: string; value: string }[];
  onEnd: () => void;
  ending: boolean;
}) {
  const s = p.session;
  const remainMin = s.expiresAt ? Math.max(0, Math.ceil((s.expiresAt - Date.now()) / 60000)) : null;
  return (
    <div className="grid lg:grid-cols-12 gap-5 mb-6">
      <div className="lg:col-span-4 glass-card rounded-3xl p-6 flex flex-col items-center text-center">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-300 font-medium">互动进行中</span>
          {remainMin !== null && (
            <span className="text-[11px] font-mono text-slate-500">剩余 {remainMin} 分钟</span>
          )}
        </div>
        <QRCodeView path={`/join?c=${s.code}`} size={176} caption="学生手机扫码参与" />
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-slate-400">或输入加入码</span>
          <code className="text-lg font-mono font-bold tracking-[0.3em] text-amber-300 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-1">
            {s.code}
          </code>
        </div>
        <button
          onClick={p.onEnd}
          disabled={p.ending}
          className="mt-5 w-full btn-ghost !border !border-rose-500/30 !text-rose-300 hover:!bg-rose-500/10 text-sm disabled:opacity-60"
        >
          <Square className="w-3.5 h-3.5" /> 结束本次互动
        </button>
      </div>
      <div className="lg:col-span-8 glass-card rounded-3xl p-6">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="font-serif font-bold text-xl text-white">{s.title}</h3>
            <div className="text-xs text-slate-500 mt-1">
              {[s.courseName, s.className, s.teacherName].filter(Boolean).join(' · ') || '智慧课堂互动'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black font-mono" style={{ color: p.statMain.tone }}>{p.statMain.value}</div>
            <div className="text-[11px] text-slate-500">{p.statMain.label}</div>
          </div>
        </div>
        {p.statSub && p.statSub.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {p.statSub.map(x => (
              <div key={x.label} className="rounded-xl bg-slate-900/60 border border-white/5 px-3.5 py-2.5">
                <div className="text-[10px] text-slate-500">{x.label}</div>
                <div className="font-mono text-base text-white mt-0.5">{x.value}</div>
              </div>
            ))}
          </div>
        )}
        {p.results && p.results.events.length > 0 && (
          <div className="mt-4 max-h-32 overflow-auto scrollbar-hidden">
            <div className="flex flex-wrap gap-1.5">
              {p.results.events.slice(-24).reverse().map(ev => (
                <span key={ev.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-[11px] text-slate-300 animate-[fadeIn_.3s_ease]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  {ev.name}
                  {ev.studentId && <span className="font-mono text-slate-500">{ev.studentId}</span>}
                  <span className="text-slate-600">{fmtTime(ev.at)}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ 智能签到 ============
export function AttendancePanel({ onSessionCreated, resumeSessionId }: { onSessionCreated: (s: ClassSession | null) => void; resumeSessionId?: string | null }) {
  const [title, setTitle] = useState('');
  const [durationMin, setDurationMin] = useState(10);
  const [rosterRaw, setRosterRaw] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(resumeSessionId ?? null);
  const { results } = useSessionResults(sessionId);
  const [ending, setEnding] = useState(false);

  // 摇号
  const [rolling, setRolling] = useState(false);
  const [rollName, setRollName] = useState<string | null>(null);
  const rollTimer = useRef<number>(0);

  const start = async () => {
    setSubmitting(true);
    try {
      const s = await classroomApi.createSession({
        type: 'attendance',
        title: title.trim() || `课堂签到 · ${new Date().toLocaleDateString('zh-CN')}`,
        durationMin,
        rosterRaw,
      });
      onSessionCreated(s);
      setSessionId(s.id);
    } catch (e: any) {
      alert(e?.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;
    setEnding(true);
    try {
      await classroomApi.closeSession(sessionId);
      onSessionCreated(null as never);
    } finally {
      setEnding(false);
    }
  };

  const startRoll = () => {
    if (!results || results.events.length === 0) return;
    const names = results.events.filter(e => e.type === 'checkin').map(e => e.name);
    setRolling(true);
    let speed = 60;
    const tick = () => {
      setRollName(names[Math.floor(Math.random() * names.length)]);
      speed *= 1.18;
      if (speed < 900) {
        rollTimer.current = window.setTimeout(tick, speed);
      } else {
        setRolling(false);
      }
    };
    tick();
  };

  useEffect(() => () => clearTimeout(rollTimer.current), []);

  if (!sessionId) {
    return (
      <CreateCard
        icon={<QrCode className="w-6 h-6 text-cyan-300" />}
        title="智能签到点名"
        desc="生成二维码，学生扫码签到；实时统计到课率、缺席名单与词云"
        accent="#22d3ee"
        onCreate={start}
        submitting={submitting}
        durationMin={durationMin} setDurationMin={setDurationMin}
        rosterRaw={rosterRaw} setRosterRaw={setRosterRaw}
        showRoster
        titleVal={`签到 · ${new Date().toLocaleDateString('zh-CN')}`}
        setTitleVal={setTitle}
      />
    );
  }

  const evs = results?.events.filter(e => e.type === 'checkin') ?? [];
  const absent = results?.summary.absentList ?? [];
  const unreg = results?.summary.unregistered ?? 0;
  const rosterCount = results?.session.roster.length ?? 0;

  return (
    <div className="animate-[fadeIn_.3s_ease]">
      <SessionHeader
        session={results?.session ?? ({ id: sessionId, code: '……', type: 'attendance', title: '签到', createdAt: 0, closed: false, roster: [], config: {} } as ClassSession)}
        results={results}
        statMain={{ label: '已签到人数', value: String(evs.length), tone: '#34d399' }}
        statSub={[
          { label: '应到（花名册）', value: rosterCount ? String(rosterCount) : '未导入' },
          { label: '缺席', value: rosterCount ? String(absent.length) : '—' },
          { label: '到课率', value: rosterCount ? `${rosterCount ? Math.round((evs.length / rosterCount) * 100) : 0}%` : '—' },
          { label: '非花名册签到', value: String(unreg) },
        ]}
        onEnd={endSession}
        ending={ending}
      />

      <div className="grid lg:grid-cols-3 gap-5">
        {/* 实时签到名单 */}
        <div className="glass-card rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" /> 已签到（{evs.length}）
            </h4>
            <button
              onClick={() => exportCsv(`签到_${Date.now()}.csv`, [
                ['姓名', '学号', '班级', '签到时间'],
                ...evs.map(e => [e.name, e.studentId || '', e.className || '', new Date(e.at).toLocaleString('zh-CN')]),
              ])}
              className="text-xs text-slate-400 hover:text-signal-300 flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> 导出CSV
            </button>
          </div>
          {evs.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">等待学生扫码签到…</p>
          ) : (
            <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-auto">
              {evs.map((e, i) => (
                <div key={e.id} className="flex items-center gap-2 rounded-xl bg-white/5 px-2.5 py-1.5 text-xs animate-[fadeIn_.3s_ease]">
                  <span className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-500/40 to-blue-500/40 flex items-center justify-center text-[10px] text-white flex-shrink-0">
                    {e.name.slice(0, 1)}
                  </span>
                  <span className="text-slate-200 truncate">{e.name}</span>
                  {i === 0 && <span className="text-[9px] text-amber-300">NEW</span>}
                </div>
              ))}
            </div>
          )}
          {/* 摇号抽问 */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">随机抽取幸运同学</span>
              <button
                onClick={startRoll}
                disabled={rolling || evs.length === 0}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-center gap-1.5 hover:bg-amber-500/25 transition disabled:opacity-50"
              >
                <Dices className={`w-3.5 h-3.5 ${rolling ? 'animate-spin' : ''}`} /> {rolling ? '滚动中…' : '开始摇号'}
              </button>
            </div>
            <div className={`rounded-2xl border h-16 flex items-center justify-center transition-all ${
              rollName ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-900/50 border-white/5'
            }`}>
              {rollName ? (
                <span className={`font-serif font-bold text-2xl text-amber-300 ${rolling ? 'blur-[1px]' : ''}`}>{rollName}</span>
              ) : (
                <span className="text-xs text-slate-500">点击"开始摇号"随机抽取</span>
              )}
            </div>
          </div>
        </div>

        {/* 缺席名单 */}
        <div className="glass-card rounded-3xl p-5">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <XCircle className="w-4 h-4 text-rose-400" /> 缺席名单（{absent.length}）
          </h4>
          {!rosterCount ? (
            <p className="text-xs text-slate-500 leading-relaxed py-4">
              未导入花名册，无法生成缺席对比。<br />下次创建时粘贴花名册即可自动对比。
            </p>
          ) : absent.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="w-10 h-10 text-amber-400 mx-auto mb-2" />
              <p className="text-sm text-amber-300 font-medium">全员到齐！</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-72 overflow-auto">
              {absent.map(a => (
                <span key={a.studentId + a.name} className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  {a.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 签到词云 */}
        <div className="glass-card rounded-3xl p-5">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <Wifi className="w-4 h-4 text-violet-400" /> 签到词云
          </h4>
          <WordCloud
            words={evs.map(e => ({ word: e.name, count: 1 }))}
            height={280}
            emptyText="等待学生扫码签到…"
          />
          <p className="text-[11px] text-slate-500 mt-2 text-center">姓名字号随机分布，先签到的同学更靠中心</p>
        </div>
      </div>
    </div>
  );
}

// ============ 课堂答题 ============
export function QuizPanel({ onSessionCreated, resumeSessionId }: { onSessionCreated: (s: ClassSession | null) => void; resumeSessionId?: string | null }) {
  const [title, setTitle] = useState('');
  const [durationMin, setDurationMin] = useState(5);
  const [rosterRaw, setRosterRaw] = useState('');
  const [content, setContent] = useState('');
  const [qtype, setQtype] = useState<'choice' | 'truefalse' | 'short'>('choice');
  const [options, setOptions] = useState(['', '', '', '']);
  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(resumeSessionId ?? null);
  const { results } = useSessionResults(sessionId);
  const [ending, setEnding] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const optKeys = ['A', 'B', 'C', 'D'];
  const activeOpts = qtype === 'truefalse' ? ['A', 'B'] : optKeys;

  const start = async () => {
    setSubmitting(true);
    try {
      const s = await classroomApi.createSession({
        type: 'quiz',
        title: title.trim() || '课堂随练',
        durationMin,
        rosterRaw,
        question: {
          content: content.trim(),
          type: qtype,
          options: qtype === 'short' ? [] : activeOpts.map((k, i) => ({ key: k, content: qtype === 'truefalse' ? (i === 0 ? '正确' : '错误') : options[i] })),
          answer: qtype === 'short' ? null : answer || null,
          durationSec: 0,
        },
      });
      onSessionCreated(s);
      setSessionId(s.id);
      setRevealed(false);
    } catch (e: any) {
      alert(e?.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;
    setEnding(true);
    try {
      await classroomApi.closeSession(sessionId);
      onSessionCreated(null);
    } finally {
      setEnding(false);
    }
  };

  if (!sessionId) {
    return (
      <div className="max-w-xl mx-auto glass-card rounded-3xl p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-xl text-white">课堂智能答题</h3>
            <p className="text-xs text-slate-400 mt-0.5">扫码作答 · 实时柱状图 · 正确率统计 · 短答案词云</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">活动标题</label>
            <input className="input-field" placeholder="例如：随堂练 · 稳定裕度判断" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">题目类型</label>
            <div className="grid grid-cols-3 gap-1.5">
              {([['choice', '单选题'], ['truefalse', '判断题'], ['short', '简答题(词云)']] as const).map(([k, label]) => (
                <button key={k} onClick={() => { setQtype(k); setAnswer(''); }}
                  className={`py-2 rounded-xl text-xs font-medium border transition ${
                    qtype === k ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : 'bg-white/[0.03] border-white/10 text-slate-400'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">题干</label>
            <textarea className="input-field min-h-[70px]" placeholder="输入题目内容，例如：相角裕度 γ 越大，闭环系统相对稳定性越好。对吗？" value={content} onChange={e => setContent(e.target.value)} />
          </div>
          {qtype !== 'short' && (
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">选项与正确答案</label>
              <div className="space-y-2">
                {activeOpts.map((k, i) => (
                  <div key={k} className="flex items-center gap-2">
                    <button
                      onClick={() => setAnswer(answer === k ? '' : k)}
                      className={`w-8 h-8 rounded-lg border font-mono text-xs flex-shrink-0 transition ${
                        answer === k
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/25'
                      }`}
                      title="点击标记为正确答案"
                    >
                      {k}
                    </button>
                    {qtype === 'truefalse' ? (
                      <div className="flex-1 input-field !py-2 text-sm text-slate-300">{i === 0 ? '正确' : '错误'}</div>
                    ) : (
                      <input
                        className="input-field !py-2 text-sm flex-1"
                        placeholder={`选项 ${k} 内容`}
                        value={options[i]}
                        onChange={e => setOptions(o => o.map((v, j) => j === i ? e.target.value : v))}
                      />
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5">点击左侧字母标记正确答案（正确答案不会下发到学生端）</p>
            </div>
          )}
          <div className="flex items-center justify-between rounded-2xl bg-slate-900/60 border border-white/5 px-4 py-3">
            <span className="text-xs text-slate-300 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-500" />限时</span>
            <div className="flex items-center gap-1">
              {[0, 3, 5, 10].map(m => (
                <button key={m} onClick={() => setDurationMin(m)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition ${
                    durationMin === m ? 'bg-amber-500/20 text-amber-300' : 'text-slate-500 hover:text-slate-300'
                  }`}>
                  {m === 0 ? '不限' : `${m}分`}
                </button>
              ))}
            </div>
          </div>
          <button onClick={start} disabled={submitting || !content.trim()} className="w-full btn-primary disabled:opacity-60">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            发布题目，开始答题
          </button>
        </div>
      </div>
    );
  }

  const q = results?.session.config.question;
  const answers = results?.events.filter(e => e.type === 'answer') ?? [];
  const counts = results?.summary.optionCounts ?? {};
  const totalAns = answers.length;
  const maxCount = Math.max(1, ...Object.values(counts));
  const shortWords = results?.summary.wordFreq ?? [];

  return (
    <div className="animate-[fadeIn_.3s_ease]">
      <SessionHeader
        session={results?.session ?? ({ id: sessionId, code: '……', type: 'quiz', title: '答题', createdAt: 0, closed: false, roster: [], config: {} } as ClassSession)}
        results={results}
        statMain={{ label: '已提交人数', value: String(totalAns), tone: '#fbbf24' }}
        statSub={[
          { label: '正确率', value: q?.type !== 'short' && totalAns ? `${results?.summary.correctRate ?? 0}%` : '—' },
          { label: '答对', value: q?.type !== 'short' ? String(results?.summary.correctCount ?? 0) : '—' },
          { label: '题目类型', value: q?.type === 'choice' ? '单选' : q?.type === 'truefalse' ? '判断' : '简答' },
          { label: '正确答案', value: revealed ? String(q?.answer ?? '—') : '未公布' },
        ]}
        onEnd={endSession}
        ending={ending}
      />

      <div className="grid lg:grid-cols-3 gap-5">
        {/* 实时柱状图 */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-400" /> 实时作答分布
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRevealed(v => !v)}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-1.5 hover:bg-emerald-500/20 transition"
              >
                <Eye className="w-3.5 h-3.5" /> {revealed ? '隐藏答案' : '公布答案'}
              </button>
            </div>
          </div>
          {q?.type !== 'short' ? (
            <div className="space-y-3.5">
              {(q?.options ?? []).map(o => {
                const c = counts[o.key] ?? 0;
                const isAns = revealed && (q?.answer === o.key || (Array.isArray(q?.answer) && (q?.answer as string[]).includes(o.key)));
                return (
                  <div key={o.key} className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-xl border font-mono text-sm flex items-center justify-center flex-shrink-0 ${
                      isAns ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200' : 'bg-white/5 border-white/10 text-slate-300'
                    }`}>
                      {o.key}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-300 truncate">{o.content}</span>
                        <span className="font-mono text-slate-400">{c} 人 · {totalAns ? Math.round(c / totalAns * 100) : 0}%</span>
                      </div>
                      <div className="h-4 rounded-lg bg-slate-800/70 overflow-hidden">
                        <div
                          className={`h-full rounded-lg transition-all duration-700 ${
                            isAns ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-amber-500/80 to-orange-400/80'
                          }`}
                          style={{ width: `${(c / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <WordCloud
              words={shortWords.map(w => ({ word: w.word, count: w.count }))}
              height={300}
              emptyText="等待学生提交简答题答案…"
            />
          )}
        </div>

        {/* 作答学生列表 */}
        <div className="glass-card rounded-3xl p-5">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-amber-400" /> 作答情况（{answers.length}）
          </h4>
          {answers.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">等待学生提交…</p>
          ) : (
            <div className="space-y-1.5 max-h-[340px] overflow-auto">
              {answers.map(e => {
                const correct = q?.answer != null && q.type !== 'short' &&
                  (Array.isArray(q.answer)
                    ? [...e.payload].sort().join('|') === [...q.answer].sort().join('|')
                    : e.payload === q.answer);
                return (
                  <div key={e.id} className="flex items-center gap-2.5 rounded-xl bg-white/5 px-3 py-2 text-xs animate-[fadeIn_.3s_ease]">
                    {correct === true
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      : correct === false
                        ? <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                        : <MessageSquare className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />}
                    <span className="text-slate-200">{e.name}</span>
                    <span className="ml-auto font-mono text-slate-500">
                      {q?.type === 'short' ? (e.payload.length > 14 ? e.payload.slice(0, 14) + '…' : e.payload) : e.payload}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============ 投票 ============
export function PollPanel({ onSessionCreated, resumeSessionId }: { onSessionCreated: (s: ClassSession | null) => void; resumeSessionId?: string | null }) {
  const [title, setTitle] = useState('');
  const [durationMin, setDurationMin] = useState(5);
  const [rosterRaw, setRosterRaw] = useState('');
  const [opts, setOpts] = useState(['同意', '不同意']);
  const [submitting, setSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(resumeSessionId ?? null);
  const { results } = useSessionResults(sessionId);
  const [ending, setEnding] = useState(false);

  const start = async () => {
    setSubmitting(true);
    try {
      const s = await classroomApi.createSession({
        type: 'poll',
        title: title.trim() || '课堂表决',
        durationMin,
        rosterRaw,
        options: opts.filter(o => o.trim()),
      });
      onSessionCreated(s);
      setSessionId(s.id);
    } catch (e: any) {
      alert(e?.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;
    setEnding(true);
    try { await classroomApi.closeSession(sessionId); onSessionCreated(null); } finally { setEnding(false); }
  };

  if (!sessionId) {
    return (
      <div className="max-w-xl mx-auto glass-card rounded-3xl p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-blue-300" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-xl text-white">课堂投票表决</h3>
            <p className="text-xs text-slate-400 mt-0.5">快速收集全班意见 · 实时比例条</p>
          </div>
        </div>
        <div className="space-y-4">
          <input className="input-field" placeholder="投票主题，例如：期末考试是否允许带一张A4公式纸？" value={title} onChange={e => setTitle(e.target.value)} />
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">选项（2~6 个）</label>
            <div className="space-y-2">
              {opts.map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 font-mono text-xs flex items-center justify-center flex-shrink-0">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <input
                    className="input-field !py-2 text-sm flex-1"
                    value={o}
                    onChange={e => setOpts(v => v.map((x, j) => j === i ? e.target.value : x))}
                  />
                  {opts.length > 2 && (
                    <button onClick={() => setOpts(v => v.filter((_, j) => j !== i))} className="text-slate-500 hover:text-rose-300 text-lg leading-none">×</button>
                  )}
                </div>
              ))}
            </div>
            {opts.length < 6 && (
              <button onClick={() => setOpts(v => [...v, ''])} className="mt-2 text-xs text-signal-400 hover:text-signal-300">+ 添加选项</button>
            )}
          </div>
          <button onClick={start} disabled={submitting} className="w-full btn-primary disabled:opacity-60">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />} 发起投票
          </button>
        </div>
      </div>
    );
  }

  const votes = results?.summary.voteCounts ?? [];
  const total = votes.reduce((a, b) => a + b, 0);
  const maxV = Math.max(1, ...votes);
  const options = results?.session.config.options ?? [];

  return (
    <div className="animate-[fadeIn_.3s_ease]">
      <SessionHeader
        session={results?.session ?? ({ id: sessionId, code: '……', type: 'poll', title: '投票', createdAt: 0, closed: false, roster: [], config: {} } as ClassSession)}
        results={results}
        statMain={{ label: '参与投票', value: String(total), tone: '#60a5fa' }}
        onEnd={endSession}
        ending={ending}
      />
      <div className="glass-card rounded-3xl p-6 lg:p-8">
        <h4 className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-400" /> 实时票数
        </h4>
        <div className="space-y-5">
          {options.map((o, i) => (
            <div key={i}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-slate-200"><span className="font-mono text-slate-500 mr-2">{String.fromCharCode(65 + i)}</span>{o}</span>
                <span className="font-mono text-blue-300">{votes[i] ?? 0} 票 · {total ? Math.round((votes[i] ?? 0) / total * 100) : 0}%</span>
              </div>
              <div className="h-6 rounded-xl bg-slate-800/70 overflow-hidden">
                <div
                  className="h-full rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700 flex items-center justify-end pr-2"
                  style={{ width: `${((votes[i] ?? 0) / maxV) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ 弹幕提问墙 ============
export function DanmakuPanel({ onSessionCreated, resumeSessionId }: { onSessionCreated: (s: ClassSession | null) => void; resumeSessionId?: string | null }) {
  const [title, setTitle] = useState('');
  const [durationMin, setDurationMin] = useState(0);
  const [rosterRaw, setRosterRaw] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(resumeSessionId ?? null);
  const { results } = useSessionResults(sessionId, 1500);
  const [ending, setEnding] = useState(false);
  const [projector, setProjector] = useState(false);
  const [msgs, setMsgs] = useState<{ id: string; text: string; name: string; row: number; dur: number }[]>([]);
  const shownRef = useRef<Set<string>>(new Set());

  const start = async () => {
    setSubmitting(true);
    try {
      const s = await classroomApi.createSession({
        type: 'danmaku',
        title: title.trim() || '课堂提问弹幕墙',
        durationMin,
        rosterRaw,
      });
      onSessionCreated(s);
      setSessionId(s.id);
      shownRef.current.clear();
      setMsgs([]);
    } catch (e: any) {
      alert(e?.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;
    setEnding(true);
    try { await classroomApi.closeSession(sessionId); onSessionCreated(null); } finally { setEnding(false); }
  };

  // 新弹幕检测 → 投放
  useEffect(() => {
    if (!results) return;
    const danmaku = results.events.filter(e => e.type === 'danmaku');
    for (const d of danmaku) {
      if (!shownRef.current.has(d.id)) {
        shownRef.current.add(d.id);
        const item = { id: d.id, text: d.payload, name: d.name, row: Math.floor(Math.random() * 5), dur: 8 + Math.random() * 4 };
        setMsgs(m => [...m.slice(-14), item]);
      }
    }
  }, [results]);

  if (!sessionId) {
    return (
      <div className="max-w-xl mx-auto glass-card rounded-3xl p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/15 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-violet-300" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-xl text-white">弹幕提问墙</h3>
            <p className="text-xs text-slate-400 mt-0.5">学生扫码发弹幕提问，大屏滚动展示 + 词云归纳</p>
          </div>
        </div>
        <div className="space-y-4">
          <input className="input-field" placeholder="活动标题，例如：第三章 答疑弹幕" value={title} onChange={e => setTitle(e.target.value)} />
          <button onClick={start} disabled={submitting} className="w-full btn-primary disabled:opacity-60">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />} 开启弹幕墙
          </button>
        </div>
      </div>
    );
  }

  const danmaku = results?.events.filter(e => e.type === 'danmaku') ?? [];
  const words = results?.summary.wordFreq ?? [];

  return (
    <div className="animate-[fadeIn_.3s_ease]">
      <SessionHeader
        session={results?.session ?? ({ id: sessionId, code: '……', type: 'danmaku', title: '弹幕', createdAt: 0, closed: false, roster: [], config: {} } as ClassSession)}
        results={results}
        statMain={{ label: '弹幕/提问数', value: String(danmaku.length), tone: '#a78bfa' }}
        onEnd={endSession}
        ending={ending}
      />
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="glass-card rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-violet-400" /> 弹幕流（{danmaku.length}）
            </h4>
            <button onClick={() => setProjector(true)} className="px-3 py-1.5 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-medium flex items-center gap-1.5 hover:bg-violet-500/25 transition">
              <Eye className="w-3.5 h-3.5" /> 投屏模式
            </button>
          </div>
          {danmaku.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-10">等待学生发送弹幕…</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-auto">
              {[...danmaku].reverse().map(d => (
                <div key={d.id} className="rounded-xl bg-white/5 border border-white/5 px-4 py-2.5 animate-[fadeIn_.3s_ease]">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-violet-300 font-medium">{d.name}</span>
                    <span className="text-[10px] text-slate-600 font-mono">{fmtTime(d.at)}</span>
                  </div>
                  <p className="text-sm text-slate-200">{d.payload}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="glass-card rounded-3xl p-5">
          <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
            <Wifi className="w-4 h-4 text-violet-400" /> 提问关键词词云
          </h4>
          <WordCloud words={words.map(w => ({ word: w.word, count: w.count }))} height={330} emptyText="等待学生提问…" />
        </div>
      </div>

      {/* 投屏模式 */}
      {projector && (
        <div className="fixed inset-0 z-[200] bg-slate-950" onClick={() => setProjector(false)}>
          <div className="absolute top-6 left-0 right-0 text-center">
            <span className="text-slate-500 text-sm">{results?.session.title} · 扫码参与 · 按 ESC 或点击任意处退出</span>
          </div>
          {msgs.map(m => (
            <div
              key={m.id}
              className="danmaku-item absolute whitespace-nowrap text-2xl font-semibold text-white"
              style={{
                top: `${12 + m.row * 17}%`,
                animationDuration: `${m.dur}s`,
                textShadow: '0 0 18px rgba(139,92,246,0.5)',
              }}
            >
              <span className="text-violet-300 text-base mr-3">{m.name}</span>
              {m.text}
            </div>
          ))}
          <div className="absolute bottom-8 left-0 right-0 flex justify-center">
            <QRCodeView path={`/join?c=${results?.session.code ?? ''}`} size={140} caption="扫码发弹幕" />
          </div>
        </div>
      )}
    </div>
  );
}

// ============ 课堂评价 ============
export function RatingPanel({ onSessionCreated, resumeSessionId }: { onSessionCreated: (s: ClassSession | null) => void; resumeSessionId?: string | null }) {
  const [title, setTitle] = useState('');
  const [durationMin, setDurationMin] = useState(3);
  const [rosterRaw, setRosterRaw] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(resumeSessionId ?? null);
  const { results } = useSessionResults(sessionId);
  const [ending, setEnding] = useState(false);

  const labels = ['😵 很吃力', '🤔 有点难', '🙂 刚刚好', '😄 偏简单', '🚀 太简单'];

  const start = async () => {
    setSubmitting(true);
    try {
      const s = await classroomApi.createSession({
        type: 'rating',
        title: title.trim() || '课堂难度反馈',
        durationMin,
        rosterRaw,
        ratingLabels: labels,
      });
      onSessionCreated(s);
      setSessionId(s.id);
    } catch (e: any) {
      alert(e?.message || '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  const endSession = async () => {
    if (!sessionId) return;
    setEnding(true);
    try { await classroomApi.closeSession(sessionId); onSessionCreated(null); } finally { setEnding(false); }
  };

  if (!sessionId) {
    return (
      <div className="max-w-xl mx-auto glass-card rounded-3xl p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-xl text-white">课堂难度反馈</h3>
            <p className="text-xs text-slate-400 mt-0.5">下课前三分钟，扫码一键评价本节课难度，数据沉淀到本地库</p>
          </div>
        </div>
        <div className="space-y-4">
          <input className="input-field" placeholder="活动标题，例如：第5章 频域分析 难度反馈" value={title} onChange={e => setTitle(e.target.value)} />
          <button onClick={start} disabled={submitting} className="w-full btn-primary disabled:opacity-60">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />} 开启反馈收集
          </button>
        </div>
      </div>
    );
  }

  const ratings = results?.events.filter(e => e.type === 'rating') ?? [];
  const dist = [1, 2, 3, 4, 5].map(v => ratings.filter(r => parseInt(r.payload) === v).length);
  const avg = results?.summary.avgRating ?? 0;
  const maxD = Math.max(1, ...dist);

  return (
    <div className="animate-[fadeIn_.3s_ease]">
      <SessionHeader
        session={results?.session ?? ({ id: sessionId, code: '……', type: 'rating', title: '评价', createdAt: 0, closed: false, roster: [], config: {} } as ClassSession)}
        results={results}
        statMain={{ label: '平均难度分', value: avg ? avg.toFixed(2) : '—', tone: '#34d399' }}
        statSub={[{ label: '已评价人数', value: String(ratings.length) }]}
        onEnd={endSession}
        ending={ending}
      />
      <div className="glass-card rounded-3xl p-6 lg:p-8">
        <h4 className="text-sm font-semibold text-white mb-6 flex items-center gap-2">难度分布实时直方图</h4>
        <div className="grid grid-cols-5 gap-3 items-end h-56">
          {labels.map((label, i) => (
            <div key={i} className="flex flex-col items-center gap-2 h-full justify-end">
              <span className="font-mono text-sm text-emerald-300">{dist[i]}</span>
              <div
                className="w-full rounded-t-2xl bg-gradient-to-t from-emerald-600/60 to-emerald-400 transition-all duration-700"
                style={{ height: `${(dist[i] / maxD) * 80}%`, minHeight: 6 }}
              />
              <span className="text-[11px] text-slate-400 text-center leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
