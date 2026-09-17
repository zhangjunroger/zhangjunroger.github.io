import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Activity, CheckCircle2, Send, Loader2, AlertCircle, Keyboard, User,
  RefreshCw, Clock, MessageSquare, XCircle,
} from 'lucide-react';
import { classroomApi } from '@/lib/api.js';
import { IS_STATIC_MODE } from '@/lib/env';
import type { ClassSession } from '@shared/types.js';

// 学生身份缓存（本机免重复输入）
const IDENTITY_KEY = 'zdkzy.join.identity.v1';
function loadIdentity(): { name: string; studentId: string; className: string } {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* noop */ }
  return { name: '', studentId: '', className: '' };
}
function saveIdentity(id: { name: string; studentId: string; className: string }) {
  try { localStorage.setItem(IDENTITY_KEY, JSON.stringify(id)); } catch { /* noop */ }
}

export default function JoinPage() {
  const { code: codeParam } = useParams();
  const [search] = useSearchParams();
  const [code, setCode] = useState((codeParam || search.get('c') || '').toUpperCase());
  const [session, setSession] = useState<ClassSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [identity, setIdentity] = useState(loadIdentity);
  const [joined, setJoined] = useState(false);

  const fetchSession = async (c: string) => {
    if (!c.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      const s = await classroomApi.joinInfo(c.trim().toUpperCase());
      setSession(s);
      setJoined(false);
    } catch (e: any) {
      setSession(null);
      setErr(e?.message || '加入失败');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (code) fetchSession(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============ 手动输入加入码 ============
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-5 relative overflow-hidden">
        <div className="absolute top-0 left-1/3 w-72 h-72 rounded-full bg-cyan-600/20 blur-[110px]" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-violet-600/15 blur-[110px]" />
        <div className="w-full max-w-sm relative">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 mx-auto flex items-center justify-center shadow-glow-cyan mb-4">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-serif font-bold text-2xl text-white">课堂互动加入</h1>
            <p className="text-xs text-slate-400 mt-2">《自动控制原理》智慧课堂 · 输入教师大屏上的 6 位加入码</p>
          </div>
          <div className="glass-card rounded-3xl p-6 space-y-4">
            {IS_STATIC_MODE && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 px-3.5 py-3 text-xs leading-relaxed text-amber-200">
                当前访问的是课程静态演示站点，未连接课堂服务器——扫码互动功能仅在教师机运行后端后可用。
              </div>
            )}
            <div>
              <label className="text-xs text-slate-400 block mb-2">加入码</label>
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="如 AB12CD"
                maxLength={6}
                className="input-field !py-4 text-center !text-2xl font-mono font-bold tracking-[0.5em] placeholder:tracking-normal placeholder:text-base placeholder:font-normal"
              />
            </div>
            {err && (
              <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/25 rounded-xl px-3 py-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {err}
              </div>
            )}
            <button
              onClick={() => fetchSession(code)}
              disabled={loading || !code.trim()}
              className="w-full btn-primary disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Keyboard className="w-4 h-4" />}
              进入互动
            </button>
          </div>
          <p className="text-center text-[11px] text-slate-600 mt-6">沈阳工业大学人工智能学院 · 自动控制原理智慧课程</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-72 h-72 rounded-full bg-cyan-600/15 blur-[110px] pointer-events-none" />
      {/* 头部 */}
      <header className="border-b border-white/5 bg-slate-950/70 backdrop-blur-xl px-5 py-4">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-white truncate">{session.title}</div>
            <div className="text-[11px] text-slate-500">
              {sessionTypeLabel(session.type)} · {session.teacherName || '智慧课堂'}
            </div>
          </div>
          {session.expiresAt && (
            <span className="flex items-center gap-1 text-[11px] font-mono text-amber-300 flex-shrink-0">
              <Clock className="w-3 h-3" />
              {Math.max(0, Math.ceil((session.expiresAt - Date.now()) / 60000))}分
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-md w-full mx-auto px-5 py-6 relative">
        {!joined ? (
          <JoinForms
            session={session}
            identity={identity}
            onIdentity={id => { setIdentity(id); saveIdentity(id); }}
            onJoined={() => setJoined(true)}
          />
        ) : (
          <SuccessCard session={session} onBack={() => { setJoined(false); fetchSession(code); }} />
        )}
      </main>

      <footer className="text-center text-[11px] text-slate-600 py-4">
        沈阳工业大学人工智能学院 · 自动控制原理智慧课程
      </footer>
    </div>
  );
}

function sessionTypeLabel(t: string) {
  return t === 'attendance' ? '签到' : t === 'quiz' ? '课堂答题' : t === 'poll' ? '投票' : t === 'danmaku' ? '弹幕提问' : '难度反馈';
}

// ============ 身份信息卡 ============
function IdentityForm(p: {
  identity: { name: string; studentId: string; className: string };
  onIdentity: (id: { name: string; studentId: string; className: string }) => void;
  needStudentId: boolean;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-slate-400 block mb-1.5">姓名 *</label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            className="input-field !pl-10"
            placeholder="你的姓名"
            value={p.identity.name}
            onChange={e => p.onIdentity({ ...p.identity, name: e.target.value })}
          />
        </div>
      </div>
      {p.needStudentId && (
        <>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">学号（用于签到去重与缺席对比）</label>
            <input
              className="input-field font-mono"
              placeholder="如 20240101"
              value={p.identity.studentId}
              onChange={e => p.onIdentity({ ...p.identity, studentId: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">班级（可选）</label>
            <input
              className="input-field"
              placeholder="如 自动化2401"
              value={p.identity.className}
              onChange={e => p.onIdentity({ ...p.identity, className: e.target.value })}
            />
          </div>
        </>
      )}
    </div>
  );
}

// ============ 各类型互动表单 ============
function JoinForms(p: {
  session: ClassSession;
  identity: { name: string; studentId: string; className: string };
  onIdentity: (id: { name: string; studentId: string; className: string }) => void;
  onJoined: () => void;
}) {
  const s = p.session;
  const [payload, setPayload] = useState('');
  const [multi, setMulti] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ correct?: boolean; correctAnswer?: string | string[] | null } | null>(null);

  const canSubmit = p.identity.name.trim().length > 0 && (s.type === 'attendance' ? true : payload.trim().length > 0 || multi.length > 0);

  // 会话类型 → 事件类型
  const eventTypeOf = (t: string) =>
    t === 'attendance' ? 'checkin' : t === 'quiz' ? 'answer' : t === 'poll' ? 'vote' : t === 'danmaku' ? 'danmaku' : 'rating';

  const submit = async (val?: string) => {
    if (!canSubmit && val === undefined) return;
    setSubmitting(true);
    setErr(null);
    try {
      const r = await classroomApi.joinEvent(s.code, {
        type: eventTypeOf(s.type),
        name: p.identity.name.trim(),
        studentId: p.identity.studentId.trim() || undefined,
        className: p.identity.className.trim() || undefined,
        payload: val !== undefined ? val : (multi.length ? multi.join('') : payload.trim()),
      });
      setResult(r);
      p.onJoined();
    } catch (e: any) {
      setErr(e?.message || '提交失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const q = s.config?.question;

  return (
    <div className="space-y-4">
      {/* 身份卡 */}
      <div className="glass-card rounded-3xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-slate-300 font-medium">我的信息（自动记住，下次免填）</span>
        </div>
        <IdentityForm identity={p.identity} onIdentity={p.onIdentity} needStudentId={s.type === 'attendance'} />
      </div>

      {/* 签到 */}
      {s.type === 'attendance' && (
        <button onClick={() => submit('签到')} disabled={!canSubmit || submitting} className="w-full btn-primary !py-4 text-base disabled:opacity-60">
          {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
          立即签到
        </button>
      )}

      {/* 答题 */}
      {s.type === 'quiz' && q && (
        <div className="glass-card rounded-3xl p-5 space-y-4">
          <p className="text-[15px] text-white leading-relaxed font-medium">{q.content}</p>
          {q.type === 'short' ? (
            <textarea
              className="input-field min-h-[100px]"
              placeholder="在这里输入你的答案…"
              value={payload}
              onChange={e => setPayload(e.target.value)}
            />
          ) : (
            <div className="space-y-2.5">
              {q.options.map(o => {
                const selected = q.type === 'multiple' ? multi.includes(o.key) : payload === o.key;
                return (
                  <button
                    key={o.key}
                    onClick={() => {
                      if (q.type === 'multiple') {
                        setMulti(m => m.includes(o.key) ? m.filter(x => x !== o.key) : [...m, o.key]);
                      } else {
                        setPayload(o.key);
                        setTimeout(() => submit(o.key), 150);
                      }
                    }}
                    className={`w-full flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition ${
                      selected
                        ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-200'
                        : 'bg-white/[0.03] border-white/10 text-slate-200 active:bg-white/10'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-xl border font-mono text-sm flex items-center justify-center flex-shrink-0 ${
                      selected ? 'bg-cyan-500/30 border-cyan-400 text-white' : 'bg-white/5 border-white/15 text-slate-400'
                    }`}>
                      {o.key}
                    </span>
                    <span className="text-sm">{o.content}</span>
                  </button>
                );
              })}
              {q.type === 'multiple' && (
                <button onClick={() => submit(multi.join(''))} disabled={!multi.length || submitting} className="w-full btn-primary !py-3.5 disabled:opacity-60">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} 提交答案
                </button>
              )}
            </div>
          )}
          {q.type === 'short' && (
            <button onClick={() => submit()} disabled={!canSubmit || submitting} className="w-full btn-primary !py-3.5 disabled:opacity-60">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} 提交答案
            </button>
          )}
        </div>
      )}

      {/* 投票 */}
      {s.type === 'poll' && (
        <div className="glass-card rounded-3xl p-5 space-y-2.5">
          <p className="text-[15px] text-white font-medium mb-2">{s.title}</p>
          {(s.config?.options ?? []).map((o, i) => (
            <button
              key={i}
              onClick={() => submit(String(i))}
              disabled={submitting}
              className="w-full flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-left active:bg-white/10 transition"
            >
              <span className="w-8 h-8 rounded-xl bg-white/5 border border-white/15 text-slate-400 font-mono text-sm flex items-center justify-center flex-shrink-0">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-sm text-slate-200">{o}</span>
            </button>
          ))}
        </div>
      )}

      {/* 弹幕 */}
      {s.type === 'danmaku' && (
        <div className="glass-card rounded-3xl p-5 space-y-3">
          <p className="text-xs text-slate-400">你的提问会实时滚动显示在教室大屏上</p>
          <textarea
            className="input-field min-h-[90px]"
            placeholder="输入问题或想法，例如：为什么相角裕度越大越好？"
            value={payload}
            onChange={e => setPayload(e.target.value)}
            maxLength={200}
          />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-600">{payload.length}/200</span>
            <button onClick={() => { submit(); setPayload(''); }} disabled={!payload.trim() || submitting} className="btn-primary !py-2.5 !px-5 text-sm disabled:opacity-60">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} 发送弹幕
            </button>
          </div>
        </div>
      )}

      {/* 评价 */}
      {s.type === 'rating' && (
        <div className="glass-card rounded-3xl p-5 space-y-2.5">
          <p className="text-[15px] text-white font-medium mb-1">本节课你感觉难度如何？</p>
          {['😵 很吃力', '🤔 有点难', '🙂 刚刚好', '😄 偏简单', '🚀 太简单'].map((label, i) => (
            <button
              key={i}
              onClick={() => submit(String(i + 1))}
              disabled={submitting}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-left text-sm text-slate-200 active:bg-white/10 transition"
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {err && (
        <div className="flex items-center gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/25 rounded-xl px-3 py-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {err}
        </div>
      )}
    </div>
  );
}

// ============ 提交成功卡片 ============
function SuccessCard(p: { session: ClassSession; onBack: () => void }) {
  const typeLabel = sessionTypeLabel(p.session.type);
  return (
    <div className="flex flex-col items-center text-center pt-10 animate-[fadeIn_.35s_ease]">
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-emerald-500/25 blur-2xl" />
        <div className="relative w-24 h-24 rounded-full bg-emerald-500/15 border-2 border-emerald-400/60 flex items-center justify-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-400" />
        </div>
      </div>
      <h2 className="font-serif font-bold text-2xl text-white mb-2">
        {p.session.type === 'attendance' ? '签到成功！' : '提交成功！'}
      </h2>
      <p className="text-sm text-slate-400 leading-relaxed max-w-[260px]">
        你已完成「{p.session.title}」的{typeLabel}，{p.session.type === 'attendance' ? '教师端已实时收到' : '结果已同步到教室大屏'}。
      </p>
      <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 px-5 py-3">
        <div className="text-[11px] text-slate-500">当前时间</div>
        <div className="font-mono text-lg text-cyan-300">{new Date().toLocaleTimeString('zh-CN')}</div>
      </div>
      <button onClick={p.onBack} className="mt-8 btn-secondary !py-2.5 text-sm">
        <RefreshCw className="w-4 h-4" /> 再次{p.session.type === 'danmaku' ? '发弹幕' : '参与'}
      </button>
    </div>
  );
}
