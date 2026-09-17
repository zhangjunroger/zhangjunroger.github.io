import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SectionTitle from '@/components/common/SectionTitle';
import ScrollReveal from '@/components/common/ScrollReveal';
import WaveCanvas from './WaveCanvas';
import { mockSimulations } from '@/data/mockSimulations';
import { useLearningStore } from '@/store/useLearningStore';
import type { Simulation } from '@/types';
import type { SimRecord } from '@shared/types.js';
import { simApi } from '@/lib/api.js';
import { overshoot, settlingTime, risingTime } from '@/utils/controlMath';
import {
  FlaskConical, Play, X, SlidersHorizontal, Activity,
  Maximize2, RotateCcw, ChevronRight, BookOpen, Save, Download, History, CheckCircle2, Loader2, AlertCircle
} from 'lucide-react';

const EXP_LINK: Record<string, string> = { step: 'second-order', bode: 'bode', rootlocus: 'root-locus' };

export default function SimCardGrid() {
  const navigate = useNavigate();
  const [active, setActive] = useState<Simulation | null>(null);
  const simParams = useLearningStore((s) => s.currentSimParams);
  const setParam = useLearningStore((s) => s.setSimParam);
  const isLoggedIn = useLearningStore((s) => s.auth.isLoggedIn);

  const [records, setRecords] = useState<SimRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await simApi.list(active.id);
        if (!cancelled) setRecords(list || []);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [active?.id, isLoggedIn]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const saveCurrent = async () => {
    if (!active) return;
    if (!isLoggedIn) {
      setToast({ type: 'err', msg: '请先登录后再保存实验记录' });
      return;
    }
    setSaving(true);
    try {
      const params = Object.fromEntries(
        active.parameters.map(p => [p.key, simParams[p.key] ?? p.default])
      );
      const metrics: Record<string, string | number> = {};
      if (active.type === 'step') {
        const { wn = 2, zeta = 0.45 } = params;
        metrics['超调量σ%'] = overshoot(zeta).toFixed(2) + '%';
        metrics['调节时间ts'] = settlingTime(wn, zeta).toFixed(2) + 's';
        metrics['上升时间tr'] = risingTime(wn, zeta).toFixed(2) + 's';
        metrics['峰值时间tp'] = (Math.PI / (wn * Math.sqrt(1 - Math.min(0.999, zeta) ** 2))).toFixed(2) + 's';
      } else if (active.type === 'bode') {
        metrics['K'] = params.K ?? 10;
        metrics['T1'] = params.T1 ?? 0.5;
        metrics['T2'] = params.T2 ?? 0.1;
        metrics['低频段斜率'] = '-20 dB/dec';
      } else if (active.type === 'rootlocus') {
        metrics['极点p1'] = params.p1;
        metrics['极点p2'] = params.p2;
        metrics['零点z1'] = params.z1;
      }
      const rec = await simApi.create({
        simulationId: active.id,
        params: params as any,
        metrics: metrics as any,
        notes: new Date().toLocaleString('zh-CN') + ' 通过实验台保存',
      });
      setRecords((prev) => [rec, ...prev].slice(0, 50));
      setToast({ type: 'ok', msg: '实验记录已保存到云端 ✔' });
    } catch (err: any) {
      setToast({ type: 'err', msg: err?.message || '保存失败，请稍后重试' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="simulation" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="container relative">
        <ScrollReveal>
          <SectionTitle
            eyebrow="Interactive Lab"
            title="交互式仿真实验 · 把抽象理论玩起来"
            subtitle="不需要安装 MATLAB，打开浏览器就能做实验。拖动滑块，观察参数变化对系统响应的影响 — 这是理解控制理论最直观的方式"
            icon={<FlaskConical className="w-3.5 h-3.5" />}
          />
        </ScrollReveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mockSimulations.map((sim, i) => (
            <ScrollReveal key={sim.id} delay={i * 90}>
              <div className="group h-full glass-card glass-card-hover rounded-3xl overflow-hidden relative">
                <div className="aspect-[16/10] bg-gradient-to-br from-slate-900 via-slate-800/80 to-slate-900 relative overflow-hidden border-b border-white/5">
                  <div className="absolute inset-0 p-4">
                    <WaveCanvas
                      type={sim.type}
                      params={Object.fromEntries(
                        sim.parameters.map(p => [p.key, simParams[p.key] ?? p.default])
                      )}
                      width={560}
                      height={320}
                    />
                  </div>
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="tag-pill bg-slate-950/80 backdrop-blur-sm text-signal-300 border border-signal-500/30">
                      <Activity className="w-3 h-3 mr-1" /> 实时计算
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(`/lab/${EXP_LINK[sim.type] ?? ''}`)}
                    className="absolute inset-0 flex items-center justify-center bg-slate-950/0 group-hover:bg-slate-950/60 transition-colors"
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-signal-500 to-brand-600 text-white font-semibold shadow-glow-cyan translate-y-2 group-hover:translate-y-0">
                      <Play className="w-4 h-4 fill-current" /> 打开完整实验
                    </span>
                  </button>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-serif font-bold text-lg text-white">{sim.title}</h3>
                    <button className="w-9 h-9 rounded-xl bg-white/5 hover:bg-signal-500/15 text-slate-400 hover:text-signal-300 flex items-center justify-center transition">
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed mb-5 line-clamp-3">
                    {sim.description}
                  </p>
                  <div className="space-y-2.5 mb-5">
                    {sim.parameters.map((p) => {
                      const v = simParams[p.key] ?? p.default;
                      return (
                        <div key={p.key}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-400">{p.label}</span>
                            <span className="font-mono text-signal-300">{v.toFixed(p.step < 0.1 ? 2 : 1)}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-signal-400"
                              style={{ width: `${((v - p.min) / (p.max - p.min)) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <BookOpen className="w-3.5 h-3.5" />
                        配套 {sim.parameters.length + 2} 个视频讲解
                      </div>
                      {records.length > 0 && (
                        <span className="tag-pill bg-signal-500/10 text-signal-300 border-signal-500/20 text-[10px]">
                          <History className="w-3 h-3 mr-1" /> {records.length} 条历史
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/lab/${EXP_LINK[sim.type] ?? ''}`)}
                      className="text-sm font-semibold text-signal-400 hover:text-signal-300 inline-flex items-center gap-1"
                    >
                      进入实验 <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={400}>
          <div className="mt-14 glass-card rounded-3xl p-7 lg:p-8 flex flex-col md:flex-row md:items-center gap-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-500/10 via-transparent to-signal-500/10 pointer-events-none" />
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-signal-500 to-brand-600 flex items-center justify-center shadow-glow-cyan">
                <FlaskConical className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex-1 relative min-w-0">
              <h4 className="font-serif font-bold text-xl text-white mb-1">10 个完整交互实验 · 动画演示 + 逐步计算流程</h4>
              <p className="text-slate-400">
                一阶/二阶系统、极点配置、伯德图、奈奎斯特、根轨迹、PID 整定、稳态误差、非线性相平面、采样控制 ——
                每个实验都带有机构动画与算法计算流程拆解，实验报告数据可保存到本地数据库。
              </p>
            </div>
            <div className="relative">
              <a href="/lab" className="btn-primary whitespace-nowrap">
                进入实验平台
                <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {active && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in" onClick={() => setActive(null)}>
          {toast && (
            <div
              className={`fixed top-20 left-1/2 -translate-x-1/2 z-[120] px-5 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center gap-2.5 text-sm font-medium animate-[fadeIn_.2s_ease] ${
                toast.type === 'ok'
                  ? 'bg-emerald-500/90 border-emerald-400/40 text-white shadow-emerald-500/20'
                  : 'bg-rose-500/90 border-rose-400/40 text-white shadow-rose-500/20'
              }`}
            >
              {toast.type === 'ok'
                ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              {toast.msg}
            </div>
          )}
          <div
            className="w-full max-w-6xl max-h-[92vh] overflow-auto glass-card rounded-3xl border border-signal-500/30 shadow-glow"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-signal-500 to-brand-600 flex items-center justify-center">
                  <SlidersHorizontal className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-serif font-bold text-lg text-white">{active.title}</div>
                  <div className="text-xs text-slate-400">交互式仿真实验台 · 参数实时调整，波形即时重绘</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    active.parameters.forEach(p => setParam(p.key, p.default));
                  }}
                  className="btn-ghost !py-2 text-sm"
                >
                  <RotateCcw className="w-4 h-4" /> 复位
                </button>
                <button onClick={() => setActive(null)} className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 lg:p-8 grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <div className="rounded-2xl bg-slate-900/60 p-4 border border-white/5 mb-4">
                  <WaveCanvas
                    type={active.type}
                    params={Object.fromEntries(
                      active.parameters.map(p => [p.key, simParams[p.key] ?? p.default])
                    )}
                    width={860}
                    height={480}
                  />
                </div>
                <div className="p-4 rounded-2xl bg-signal-500/5 border border-signal-500/20">
                  <div className="text-xs uppercase tracking-wider text-signal-300 font-semibold mb-2">💡 实验思考题</div>
                  <ul className="space-y-1.5 text-sm text-slate-300 list-disc list-inside">
                    {active.type === 'step' && [
                      '观察ζ=0 (无阻尼) 时，响应曲线呈现什么特性？为什么实际系统不允许？',
                      '保持ωn不变，ζ从0.1增加到1.0，超调量和调节时间如何变化？',
                      '为什么工业系统常取 ζ=0.4~0.7 的欠阻尼状态？',
                    ]}
                    {active.type === 'bode' && [
                      '低频段幅值的斜率由什么决定？它和系统稳态误差有什么关系？',
                      '穿越频率附近的斜率为什么建议不陡于 -40dB/dec？',
                      '相角裕度 γ 和幅值裕度 h 各自如何从伯德图读取？',
                    ]}
                    {active.type === 'rootlocus' && [
                      '根轨迹的起点和终点分别对应系统的什么参数？',
                      '分离点与会合点处特征方程的根有什么特点？',
                      '为什么增加靠近原点的零点会改善系统的动态性能？',
                    ]}
                  </ul>
                </div>
              </div>
              <div className="lg:col-span-4 space-y-5">
                <div className="glass-card rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <SlidersHorizontal className="w-4 h-4 text-signal-400" />
                    <span className="text-sm font-semibold text-white">参数调节</span>
                  </div>
                  <div className="space-y-5">
                    {active.parameters.map((p) => {
                      const v = simParams[p.key] ?? p.default;
                      return (
                        <div key={p.key}>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-slate-300 font-medium">{p.label}</span>
                            <span className="font-mono px-2 py-0.5 rounded-lg bg-slate-800 text-signal-300 text-xs">
                              {v.toFixed(p.step < 0.1 ? 2 : 2)}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={p.min}
                            max={p.max}
                            step={p.step}
                            value={v}
                            onChange={(e) => setParam(p.key, parseFloat(e.target.value))}
                            className="w-full h-2 rounded-full appearance-none bg-slate-800 cursor-pointer accent-signal-400"
                          />
                          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                            <span>{p.min}</span>
                            <span>{((p.min + p.max) / 2).toFixed(p.step < 0.1 ? 2 : 0)}</span>
                            <span>{p.max}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-5">
                  <div className="text-sm font-semibold text-white mb-3">📈 关键指标</div>
                  <div className="grid grid-cols-2 gap-3">
                    {(() => {
                      let metrics: { k: string; v: string }[] = [];
                      if (active.type === 'step') {
                        const { wn = 2, zeta = 0.45 } = simParams;
                        metrics = [
                          { k: '超调量 σ%', v: overshoot(zeta).toFixed(2) + '%' },
                          { k: '调节时间 ts', v: settlingTime(wn, zeta).toFixed(2) + 's' },
                          { k: '上升时间 tr', v: risingTime(wn, zeta).toFixed(2) + 's' },
                          { k: '峰值时间 tp', v: (Math.PI / (wn * Math.sqrt(1 - Math.min(0.999, zeta) ** 2))).toFixed(2) + 's' },
                        ];
                      } else if (active.type === 'bode') {
                        metrics = [
                          { k: '比例系数 K', v: (simParams.K ?? 10).toFixed(1) },
                          { k: '低频段斜率', v: '-20 dB/dec' },
                          { k: '中频段斜率', v: '-40 dB/dec' },
                          { k: '系统型别 ν', v: 'I 型' },
                        ];
                      } else if (active.type === 'rootlocus') {
                        metrics = [
                          { k: '开环极点', v: `${simParams.p1}, ${simParams.p2}` },
                          { k: '开环零点', v: String(simParams.z1) },
                          { k: '分支数 n-m', v: '1' },
                          { k: '渐近线数', v: '1 条' },
                        ];
                      }
                      return metrics.map((it) => (
                        <div key={it.k} className="rounded-xl bg-slate-900/60 p-3">
                          <div className="text-[10px] uppercase text-slate-500 tracking-wide mb-0.5">{it.k}</div>
                          <div className="font-mono text-sm text-white">{it.v}</div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={saveCurrent}
                    disabled={saving}
                    className="w-full btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> 保存中...</>
                    ) : (
                      <><Save className="w-4 h-4" /> 保存本次实验记录</>
                    )}
                  </button>
                  <button
                    onClick={() => setShowHistory((v) => !v)}
                    className="w-full btn-secondary flex items-center justify-center gap-2"
                  >
                    <History className="w-4 h-4" />
                    历史记录 {records.length ? `(${records.length})` : ''}
                  </button>
                </div>

                {showHistory && (
                  <div className="glass-card rounded-2xl p-4 max-h-64 overflow-auto animate-[fadeIn_.2s_ease]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-semibold text-white">📒 我的实验历史</div>
                      <button onClick={() => setShowHistory(false)} className="text-xs text-slate-400 hover:text-white">收起</button>
                    </div>
                    {records.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-500">
                        暂无历史记录，点击上方"保存"记录你的实验数据
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {records.map((r) => {
                          const time = new Date((r as any).createdAt || (r as any).updatedAt || Date.now()).toLocaleString('zh-CN');
                          const keys = Object.keys(r.metrics || {}).slice(0, 3);
                          return (
                            <li
                              key={r.id || String(Math.random())}
                              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div className="text-[11px] text-slate-400 font-mono">{time}</div>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {keys.map((k) => (
                                  <span
                                    key={k}
                                    className="px-2 py-0.5 rounded-lg bg-slate-900/70 text-[10px] text-slate-300 font-mono"
                                  >
                                    {k}: <span className="text-signal-300">{String(r.metrics![k])}</span>
                                  </span>
                                ))}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
