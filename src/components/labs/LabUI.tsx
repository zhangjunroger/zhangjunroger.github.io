import { useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Gauge, Sigma, ChevronDown as Chevron } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ============ 参数滑块 ============
export function SliderControl(p: {
  label: string; value: number; min: number; max: number; step: number;
  unit?: string; onChange: (v: number) => void; accent?: string;
  format?: (v: number) => string;
}) {
  const pct = ((p.value - p.min) / (p.max - p.min)) * 100;
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-slate-300 font-medium">{p.label}</span>
        <span className="font-mono px-2 py-0.5 rounded-md bg-slate-800/80 text-cyan-300 text-[11px] tabular-nums">
          {p.format ? p.format(p.value) : p.value.toFixed(Math.max(0, -Math.floor(Math.log10(p.step))))}{p.unit ? ` ${p.unit}` : ''}
        </span>
      </div>
      <div className="relative">
        <input
          type="range" min={p.min} max={p.max} step={p.step} value={p.value}
          onChange={(e) => p.onChange(parseFloat(e.target.value))}
          className="lab-slider w-full"
          style={{ ['--accent' as never]: p.accent ?? '#22d3ee', ['--pct' as never]: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ============ 关键指标网格 ============
export function MetricGrid(p: { items: { k: string; v: string; tone?: 'cyan' | 'amber' | 'green' | 'rose' | 'violet' | 'plain' }[]; cols?: number }) {
  const toneCls: Record<string, string> = {
    cyan: 'text-cyan-300', amber: 'text-amber-300', green: 'text-emerald-300',
    rose: 'text-rose-300', violet: 'text-violet-300', plain: 'text-white',
  };
  return (
    <div className="grid gap-2.5" style={{ gridTemplateColumns: `repeat(${p.cols ?? 2}, minmax(0,1fr))` }}>
      {p.items.map(it => (
        <div key={it.k} className="rounded-xl bg-slate-900/70 border border-white/5 px-3 py-2">
          <div className="text-[10px] text-slate-500 tracking-wide mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis">{it.k}</div>
          <div className={`font-mono text-sm tabular-nums ${toneCls[it.tone ?? 'plain']}`}>{it.v}</div>
        </div>
      ))}
    </div>
  );
}

// ============ 播放控制条 ============
export function PlayBar(p: {
  playing: boolean; onToggle: () => void; onReplay: () => void;
  speed: number; onSpeed: (v: number) => void; t: number; duration: number;
}) {
  const speeds = [0.25, 0.5, 1, 2];
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={p.onToggle}
        className="w-9 h-9 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 flex items-center justify-center transition"
        title={p.playing ? '暂停' : '播放'}
      >
        {p.playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
      </button>
      <button
        onClick={p.onReplay}
        className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 flex items-center justify-center transition"
        title="重新演示"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-[80px] h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-400 transition-[width] duration-75"
          style={{ width: `${Math.min(100, (p.t / p.duration) * 100)}%` }}
        />
      </div>
      <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
        <Gauge className="w-3.5 h-3.5" />
        {speeds.map(s => (
          <button
            key={s}
            onClick={() => p.onSpeed(s)}
            className={`px-1.5 py-0.5 rounded-md transition ${
              Math.abs(p.speed - s) < 0.01
                ? 'bg-cyan-500/20 text-cyan-300'
                : 'hover:bg-white/5 hover:text-slate-200'
            }`}
          >
            {s}×
          </button>
        ))}
      </div>
    </div>
  );
}

// ============ 计算流程面板（算法步骤逐步展开） ============
export interface CalcStep {
  title: string;
  formula?: string;      // 公式(纯文本/LaTeX样式)
  substitution?: string; // 代入数值
  result?: string;       // 结果
  note?: string;
  active?: boolean;      // 当前高亮
}

export function CalcProcess(p: { steps: CalcStep[]; title?: string }) {
  return (
    <div className="rounded-2xl border border-violet-500/20 bg-violet-500/[0.04] p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
          <Sigma className="w-3.5 h-3.5 text-violet-300" />
        </div>
        <span className="text-xs font-bold tracking-wider text-violet-300 uppercase">
          {p.title ?? '计算流程 · 逐步拆解'}
        </span>
      </div>
      <ol className="space-y-2.5">
        {p.steps.map((s, i) => (
          <li
            key={i}
            className={`rounded-xl px-3.5 py-2.5 border transition-all duration-300 ${
              s.active
                ? 'bg-violet-500/10 border-violet-500/40 shadow-[0_0_18px_rgba(167,139,250,0.15)]'
                : 'bg-slate-900/50 border-white/5'
            }`}
          >
            <div className="flex items-baseline gap-2.5">
              <span className={`font-mono text-[10px] w-4 flex-shrink-0 ${s.active ? 'text-violet-300' : 'text-slate-600'}`}>
                {String(i + 1).padStart(2, '0')}
              </span>
                <div className="min-w-0 flex-1">
                <div className={`text-xs font-medium ${s.active ? 'text-violet-200' : 'text-slate-400'}`}>{s.title}</div>
                {s.formula && <div className="mt-1 font-mono text-[12.5px] text-cyan-200/90 leading-relaxed break-words">{s.formula}</div>}
                {s.substitution && (
                  <div className="mt-0.5 font-mono text-[12px] text-amber-200/80 break-words">= {s.substitution}</div>
                )}
                {s.result && (
                  <div className="mt-0.5 font-mono text-[13px] text-emerald-300 font-semibold">= {s.result}</div>
                )}
                {s.note && <div className="mt-1 text-[11px] text-slate-500 leading-snug">{s.note}</div>}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ============ 理论知识卡片 ============
export function TheoryCard(p: { title: string; icon?: LucideIcon; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(p.defaultOpen ?? true);
  const Icon = p.icon;
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.03] transition"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-white">
          {Icon && <Icon className="w-4 h-4 text-cyan-400" />}
          {p.title}
        </span>
        <Chevron className={`w-4 h-4 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 text-[13px] leading-relaxed text-slate-300 space-y-2 border-t border-white/5">
          {p.children}
        </div>
      )}
    </div>
  );
}

// ============ 思考题 ============
export function ThinkQuestions(p: { questions: string[] }) {
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
      <div className="text-xs font-bold tracking-wider text-amber-300 uppercase mb-2.5">💡 实验思考题</div>
      <ul className="space-y-2">
        {p.questions.map((q, i) => (
          <li key={i} className="flex gap-2.5 text-[13px] text-slate-300 leading-relaxed">
            <span className="font-mono text-amber-400/80 text-xs mt-0.5 flex-shrink-0">Q{i + 1}</span>
            <span>{q}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============ 实验画布容器 ============
export function SimPanel(p: { children: React.ReactNode; title?: string; right?: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl bg-slate-900/60 border border-white/5 p-3 ${p.className ?? ''}`}>
      {(p.title || p.right) && (
        <div className="flex items-center justify-between px-1.5 pb-2">
          <span className="text-xs text-slate-400 font-medium">{p.title}</span>
          {p.right}
        </div>
      )}
      {p.children}
    </div>
  );
}

// ============ 保存实验记录按钮 ============
export function SaveRecordButton(p: {
  simulationId: string;
  params: Record<string, number>;
  metrics: Record<string, string | number>;
  notes?: string;
}) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2500);
    return () => clearTimeout(t);
  }, [msg]);

  const save = async () => {
    const authRaw = localStorage.getItem('zdkzy.auth.v1');
    if (!authRaw) {
      setMsg({ ok: false, text: '请先在首页登录后再保存实验记录' });
      return;
    }
    setSaving(true);
    try {
      const { simApi } = await import('@/lib/api.js');
      await simApi.create({
        simulationId: p.simulationId,
        params: p.params,
        metrics: p.metrics,
        notes: p.notes ?? `${new Date().toLocaleString('zh-CN')} 实验平台保存`,
      });
      setMsg({ ok: true, text: '实验记录已保存 ✔' });
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || '保存失败' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {msg && (
        <span className={`text-xs font-medium ${msg.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
          {msg.text}
        </span>
      )}
      <button
        onClick={save}
        disabled={saving}
        className="btn-primary !py-2 !px-4 text-sm disabled:opacity-60"
      >
        {saving ? '保存中…' : '保存实验记录'}
      </button>
    </div>
  );
}
