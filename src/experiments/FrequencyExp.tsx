import { useEffect, useMemo, useRef, useState } from 'react';
import {
  plotAxes, pxX, pxY, drawPolyline, drawDot, drawDashedLine, drawLabel,
  drawChip, panelTitle, COLORS,
} from '@/experiments/drawKit';
import { useSimLoop } from '@/experiments/useSimLoop';
import { SliderControl, MetricGrid, PlayBar, CalcProcess, SimPanel, SaveRecordButton } from '@/components/labs/LabUI';
import type { CalcStep } from '@/components/labs/LabUI';
import { tfNormalize, tfEval, polyRoots, C, cabs, bodeData, bodeAsymptote, stabilityMargins } from '@/utils/labsim';

// ================================================================
// 实验四：伯德图频域分析（渐近线 + 裕度 + 扫频动画）
// 系统: G(s) = K·(1+Tz·s) / ( s^ν · (1+T1·s) · (1+T2·s) )
// ================================================================
export function BodeExp() {
  const [K, setK] = useState(10);
  const [nu, setNu] = useState(1);          // 型别（积分环节数）
  const [T1, setT1] = useState(0.5);
  const [T2, setT2] = useState(0.1);
  const [useZero, setUseZero] = useState(false);
  const [Tz, setTz] = useState(0.5);
  const [wSweep, setWSweep] = useState(1);  // 当前扫频角频率（rad/s）

  const tf = useMemo(() => {
    let num: number[] = useZero ? [K * Tz, K] : [K];
    let den: number[] = useZero ? [T1 * T2, T1 + T2, 1] : [T1 * T2, T1 + T2, 1];
    // 乘 s^ν
    for (let i = 0; i < nu; i++) den.push(0);
    num = [0, ...num]; // 对齐次数（den 比 num 多 ν 阶 + 一阶两项）
    const t = tfNormalize({ num, den });
    return t;
  }, [K, nu, T1, T2, useZero, Tz]);

  const data = useMemo(() => bodeData(tf, 0.01, 100, 600), [tf]);
  const margins = useMemo(() => stabilityMargins(tf), [tf]);

  const duration = 14;
  // 扫频循环驱动 wSweep（对数域往复）
  const [sweepOn, setSweepOn] = useState(true);
  const sweepRef = useRef({ w: 0.1, dir: 1, last: 0 });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!sweepOn) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const s = sweepRef.current;
      s.w *= Math.pow(10, s.dir * dt * 0.55);
      if (s.w > 60) { s.w = 60; s.dir = -1; }
      if (s.w < 0.05) { s.w = 0.05; s.dir = 1; }
      setWSweep(s.w);
      setTick(t => t + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [sweepOn]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 880, H = 620;

  useEffect(() => {
    void tick;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = W * dpr; c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const wMin = 0.01, wMax = 100;
    const lx = (w: number) => Math.log10(w);
    const pxOfW = (reg: ReturnType<typeof plotAxes>, w: number) =>
      reg.padL + ((lx(w) - lx(wMin)) / (lx(wMax) - lx(wMin))) * reg.plotW;

    const { ws, mags, phases } = data;
    const asym = bodeAsymptote(K, nu, [T1, T2], useZero ? [Tz] : [], null, ws);

    // ---------- 幅频特性 ----------
    const hMag = Math.floor(H * 0.46);
    const regM = plotAxes(ctx, W, hMag, {
      xMin: lx(wMin), xMax: lx(wMax), yMin: -60, yMax: 80,
      xTicks: 7, yTicks: 5, xLabel: '', yLabel: '|G(jω)| (dB)',
      xTickFmt: v => `10^${v.toFixed(0)}`,
      bgColor: 'rgba(2,6,23,0.4)',
    });
    // 频率刻度显示实际值
    [0.01, 0.1, 1, 10, 100].forEach(fw => {
      const x = pxOfW(regM, fw);
      drawLabel(ctx, x, regM.padT + regM.plotH + 10, String(fw), 'rgba(148,163,184,0.9)', 9, 'mono', 'center');
    });
    drawPolyline(ctx, regM, ws.map(lx), asym, 'rgba(251,191,36,0.55)', 1.6, undefined, [6, 4]);
    drawPolyline(ctx, regM, ws.map(lx), mags, COLORS.cyan, 2.2);
    drawLabel(ctx, W - 60, 22, '— 精确曲线  -- 渐近线', 'rgba(148,163,184,0.8)', 10, 'sans');
    // 0dB 线
    drawDashedLine(ctx, regM.padL, pxY(regM, 0), regM.padL + regM.plotW, pxY(regM, 0), 'rgba(52,211,153,0.35)');
    // 剪切频率
    if (isFinite(margins.wc)) {
      const x = pxOfW(regM, margins.wc);
      drawDashedLine(ctx, x, regM.padT, x, regM.padT + regM.plotH, 'rgba(52,211,153,0.5)');
      drawChip(ctx, Math.min(x + 5, W - 90), regM.padT + 12, `ωc=${margins.wc.toFixed(2)} rad/s`, 'rgba(52,211,153,0.12)', COLORS.green, 10);
    }

    // ---------- 相频特性 ----------
    const offY = hMag + 8;
    const hPh = H - offY - 8;
    ctx.save();
    ctx.translate(0, offY);
    const regP = plotAxes(ctx, W, hPh, {
      xMin: lx(wMin), xMax: lx(wMax), yMin: -270, yMax: 0,
      xTicks: 7, yTicks: 4, xLabel: '频率 ω (rad/s，对数)', yLabel: '∠G(jω) (°)',
      xTickFmt: v => `10^${v.toFixed(0)}`,
      bgColor: 'rgba(2,6,23,0.4)',
    });
    [0.01, 0.1, 1, 10, 100].forEach(fw => {
      const x = pxOfW(regP, fw);
      drawLabel(ctx, x, regP.padT + regP.plotH + 10, String(fw), 'rgba(148,163,184,0.9)', 9, 'mono', 'center');
    });
    drawPolyline(ctx, regP, ws.map(lx), phases, COLORS.violet, 2.2);
    // -180° 线与穿越频率
    drawDashedLine(ctx, regP.padL, pxY(regP, -180), regP.padL + regP.plotW, pxY(regP, -180), 'rgba(251,113,133,0.4)');
    if (isFinite(margins.wg)) {
      const x = pxOfW(regP, margins.wg);
      drawDashedLine(ctx, x, regP.padT, x, regP.padT + regP.plotH, 'rgba(251,113,133,0.5)');
      drawChip(ctx, Math.min(x + 5, W - 96), regP.padT + 12, `ωg=${margins.wg.toFixed(2)}`, 'rgba(251,113,133,0.12)', COLORS.rose, 10);
    }
    // 扫频光点
    const g = tfEval(tf, C(0, wSweep));
    const magNow = 20 * Math.log10(Math.max(cabs(g), 1e-10));
    const phNow = Math.atan2(g.im, g.re) * 180 / Math.PI;
    drawDot(ctx, pxOfW(regM, wSweep), pxY(regM, Math.max(-60, Math.min(80, magNow))), 6, COLORS.amber);
    drawDot(ctx, pxOfW(regP, wSweep), pxY(regP, Math.max(-270, Math.min(0, phNow))), 6, COLORS.amber);
    ctx.restore();

    // 当前读数
    drawChip(ctx, 16, H - 14, `ω=${wSweep.toFixed(2)} rad/s  |G|=${magNow.toFixed(1)} dB  ∠G=${phNow.toFixed(1)}°`, 'rgba(251,191,36,0.1)', COLORS.amber, 11);
    void pxX; void pxY;
  }, [tick, data, tf, K, nu, T1, T2, useZero, Tz, wSweep, margins, W, H]);

  // 各环节贡献（计算流程）
  const factorSteps: CalcStep[] = useMemo(() => {
    const w = wSweep;
    const steps: CalcStep[] = [
      { title: '开环频率特性（各环节连乘）', formula: useZero
        ? `G(jω) = K·(1+jωTz) / [ (jω)^ν · (1+jωT₁)(1+jωT₂) ]`
        : `G(jω) = K / [ (jω)^ν · (1+jωT₁)(1+jωT₂) ]`, substitution: `K=${K}, ν=${nu}, T₁=${T1}, T₂=${T2}${useZero ? `, Tz=${Tz}` : ''}` },
      { title: `① 比例环节 K → 幅值 ${(20 * Math.log10(K)).toFixed(1)} dB，相角 0°` },
    ];
    if (nu >= 1) steps.push({ title: `② 积分环节 1/s（×${nu}）→ 幅值 −20×${nu}×lg(${w.toFixed(2)}) = ${(nu * -20 * Math.log10(w)).toFixed(1)} dB，相角 ${-90 * nu}°` });
    const ph1 = -Math.atan(w * T1) * 180 / Math.PI;
    steps.push({ title: `③ 惯性环节 1/(1+${T1}s) → 幅值 ${(-20 * Math.log10(Math.max(1, w * T1))).toFixed(1)} dB，相角 ${ph1.toFixed(1)}°` });
    const ph2 = -Math.atan(w * T2) * 180 / Math.PI;
    steps.push({ title: `④ 惯性环节 1/(1+${T2}s) → 幅值 ${(-20 * Math.log10(Math.max(1, w * T2))).toFixed(1)} dB，相角 ${ph2.toFixed(1)}°` });
    if (useZero) {
      const phz = Math.atan(w * Tz) * 180 / Math.PI;
      steps.push({ title: `⑤ 一阶微分 (1+${Tz}s) → 幅值 +${(20 * Math.log10(Math.max(1, w * Tz))).toFixed(1)} dB，相角 +${phz.toFixed(1)}°` });
    }
    const g = tfEval(tf, C(0, w));
    steps.push({
      title: '合成（幅值相加、相角相加）',
      formula: `|G| = ${(20 * Math.log10(Math.max(cabs(g), 1e-10))).toFixed(1)} dB,  ∠G = ${(Math.atan2(g.im, g.re) * 180 / Math.PI).toFixed(1)}°`,
      result: `ω = ${w.toFixed(2)} rad/s`,
    });
    return steps;
  }, [wSweep, K, nu, T1, T2, useZero, Tz, tf]);

  const metrics = [
    { k: '剪切频率 ωc', v: isFinite(margins.wc) ? `${margins.wc.toFixed(2)} rad/s` : '—', tone: 'green' as const },
    { k: '相角裕度 γ', v: isFinite(margins.gamma) ? `${margins.gamma.toFixed(1)}°` : '—', tone: margins.gamma > 45 ? 'green' as const : 'amber' as const },
    { k: '穿越频率 ωg', v: isFinite(margins.wg) ? `${margins.wg.toFixed(2)} rad/s` : '—', tone: 'cyan' as const },
    { k: '幅值裕度 h', v: isFinite(margins.gm) ? `${margins.gm.toFixed(1)} dB` : '∞', tone: 'cyan' as const },
    { k: '系统型别 ν', v: `${nu} 型`, tone: 'violet' as const },
    { k: '低频段斜率', v: `${-20 * nu} dB/dec`, tone: 'plain' as const },
    { k: '稳定性预判', v: margins.gamma > 0 && margins.gm > 0 ? '闭环稳定 ✓' : '可能不稳定 ✗', tone: margins.gamma > 0 ? 'green' as const : 'rose' as const },
    { k: '转折频率', v: `${(1 / T1).toFixed(1)} / ${(1 / T2).toFixed(1)} rad/s`, tone: 'plain' as const },
  ];

  return (
    <div className="space-y-5">
      <SimPanel>
        <canvas ref={canvasRef} className="w-full h-auto rounded-xl" style={{ aspectRatio: `${W}/${H}` }} />
        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
          <PlayBar
            playing={sweepOn} onToggle={() => setSweepOn(!sweepOn)}
            onReplay={() => { sweepRef.current = { w: 0.05, dir: 1, last: 0 }; }}
            speed={1} onSpeed={() => {}} t={0} duration={1}
          />
          <SliderControl label="扫频点 ω" value={wSweep} min={0.05} max={60} step={0.05} unit="rad/s" onChange={v => { setSweepOn(false); setWSweep(v); }} />
        </div>
      </SimPanel>

      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card rounded-2xl p-5 space-y-5">
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500" /> 系统构建
            </div>
            <SliderControl label="比例系数 K" value={K} min={0.5} max={100} step={0.5} onChange={setK} />
            <div>
              <div className="text-xs text-slate-300 font-medium mb-2">系统型别（积分环节数 ν）</div>
              <div className="grid grid-cols-3 gap-1.5">
                {[0, 1, 2].map(n => (
                  <button key={n} onClick={() => setNu(n)}
                    className={`py-2 rounded-xl text-xs font-medium border transition ${
                      nu === n ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300' : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-slate-200'
                    }`}>
                    {n} 型
                  </button>
                ))}
              </div>
            </div>
            <SliderControl label="惯性时间常数 T₁" value={T1} min={0.02} max={5} step={0.02} unit="s" onChange={setT1} />
            <SliderControl label="惯性时间常数 T₂" value={T2} min={0.02} max={2} step={0.02} unit="s" onChange={setT2} />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">添加一阶微分环节 (1+Tz·s)</span>
              <button
                onClick={() => setUseZero(!useZero)}
                className={`w-11 h-6 rounded-full transition relative ${useZero ? 'bg-cyan-500/70' : 'bg-slate-700'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${useZero ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
            {useZero && <SliderControl label="微分时间常数 Tz" value={Tz} min={0.05} max={3} step={0.05} unit="s" onChange={setTz} />}
          </div>
          <MetricGrid items={metrics} cols={2} />
          <SaveRecordButton
            simulationId="lab-bode"
            params={{ K, nu, T1, T2, Tz: useZero ? Tz : 0 }}
            metrics={{
              相角裕度: isFinite(margins.gamma) ? `${margins.gamma.toFixed(1)}°` : '—',
              幅值裕度: isFinite(margins.gm) ? `${margins.gm.toFixed(1)}dB` : '∞',
              剪切频率: isFinite(margins.wc) ? `${margins.wc.toFixed(2)}rad/s` : '—',
            }}
          />
        </div>
        <div className="lg:col-span-8 space-y-4">
          <CalcProcess steps={factorSteps} title="分环节计算流程 · 随扫频点实时更新" />
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4 text-[13px] leading-relaxed text-slate-300 space-y-2">
            <p className="font-semibold text-white">如何读取稳定裕度？</p>
            <p>
              <span className="text-emerald-300">相角裕度 γ</span>：在剪切频率 ωc（|G|=1 即 0dB）处，相角距 −180° 的余量。
              γ&gt;0 且足够大（工程上 30°~60°）闭环才稳定且阻尼合适。
            </p>
            <p>
              <span className="text-rose-300">幅值裕度 h</span>：在相角穿越频率 ωg（∠G=−180°）处，幅值距 0dB 的余量。
              h&gt;0 表示开环增益再放大 |h| dB 才会临界稳定。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// 实验五：奈奎斯特图与稳定判据
// ================================================================
export function NyquistExp() {
  const [preset, setPreset] = useState<'stable' | 'marginal' | 'unstable' | 'custom'>('stable');
  const [K, setK] = useState(4);
  const [T1, setT1] = useState(0.5);
  const [T2, setT2] = useState(0.2);
  const [T3, setT3] = useState(0.05);

  const tf = useMemo(() => {
    if (preset === 'stable') return tfNormalize({ num: [K], den: [T1 * T2 * T3, T1 * T2 + T1 * T3 + T2 * T3, T1 + T2 + T3, 1] });
    if (preset === 'marginal') return tfNormalize({ num: [4], den: [0.1, 0.7, 1, 0] });
    if (preset === 'unstable') return tfNormalize({ num: [4], den: [0.1, 0.6, -0.3, 0] });
    return tfNormalize({ num: [K], den: [T1 * T2 * T3, T1 * T2 + T1 * T3 + T2 * T3, T1 + T2 + T3, 1] });
  }, [preset, K, T1, T2, T3]);

  const data = useMemo(() => {
    const N = 900;
    const pos: { re: number; im: number }[] = [];
    const ws: number[] = [];
    const wMin = 0.02, wMax = 60;
    const ratio = Math.pow(wMax / wMin, 1 / N);
    let w = wMin;
    for (let i = 0; i <= N; i++) {
      const g = tfEval(tf, C(0, w));
      pos.push({ re: g.re, im: g.im });
      ws.push(w);
      w *= ratio;
    }
    return { pos, ws };
  }, [tf]);

  const openPoles = useMemo(() => {
    // 开环极点：den = [a3,a2,a1,a0]，a0=0 说明含积分 → 有极点在原点（虚轴上，不计入右半平面）
    const den = tf.den;
    const roots = polyRoots(den);
    const P = roots.filter(r => r.re > 1e-9).length;
    const atOrigin = roots.filter(r => Math.abs(r.re) <= 1e-9).length;
    return { P, atOrigin, roots };
  }, [tf]);

  const duration = 16;
  const loop = useSimLoop({ duration });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 880, H = 560;

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = W * dpr; c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // 奈氏曲线绘制区域（左 55%）
    const pw = 470, ph = H - 40;
    const padL = 40, padT = 26;
    const { pos, ws } = data;
    let maxAbs = 0.1;
    pos.forEach(p => { maxAbs = Math.max(maxAbs, Math.abs(p.re), Math.abs(p.im)); });
    maxAbs = Math.min(maxAbs, 12);
    const scale = Math.min(pw, ph) / (2.3 * maxAbs);
    const cx = padL + pw / 2, cy = padT + ph / 2;

    // 面板
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(10, 10, pw + 20, H - 20, 12);
    ctx.fillStyle = 'rgba(2,6,23,0.45)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(148,163,184,0.2)';
    ctx.stroke();
    ctx.restore();
    panelTitle(ctx, W, '① GH 平面奈奎斯特曲线');

    // 坐标轴
    ctx.strokeStyle = 'rgba(226,232,240,0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(18, cy); ctx.lineTo(pw + 22, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 16); ctx.lineTo(cx, H - 16); ctx.stroke();
    drawLabel(ctx, pw + 12, cy - 10, 'Re', COLORS.slate, 11);
    drawLabel(ctx, cx + 6, 22, 'jω', COLORS.slate, 11);

    // 单位圆（|G|=1 参考）
    ctx.strokeStyle = 'rgba(148,163,184,0.15)';
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.arc(cx, cy, scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // (-1, j0) 点
    const m1x = cx - scale, m1y = cy;
    drawDot(ctx, m1x, m1y, 5, COLORS.rose);
    drawLabel(ctx, m1x - 10, m1y - 12, '(−1, j0)', COLORS.rose, 11, 'mono', 'right');

    // 完整曲线（浅色）+ 已扫过部分（亮色）
    const drawnN = Math.floor((loop.t / duration) * (pos.length - 1));
    const drawPath = (n: number, color: string, width: number, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < n; i++) {
        const p = pos[i];
        if (!isFinite(p.re) || !isFinite(p.im)) { started = false; continue; }
        const clR = Math.max(-maxAbs * 1.15, Math.min(maxAbs * 1.15, p.re));
        const clI = Math.max(-maxAbs * 1.15, Math.min(maxAbs * 1.15, p.im));
        const X = cx + clR * scale, Y = cy - clI * scale;
        if (!started) { ctx.moveTo(X, Y); started = true; }
        else ctx.lineTo(X, Y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
      ctx.restore();
    };
    // 正频部分
    drawPath(pos.length, COLORS.cyanDeep, 1.4, 0.35);
    drawPath(drawnN + 1, COLORS.cyan, 2.4, 1);
    // 镜像（负频，共轭）
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    let started2 = false;
    for (let i = 0; i < pos.length; i++) {
      const p = pos[i];
      if (!isFinite(p.re) || !isFinite(p.im)) { started2 = false; continue; }
      const clR = Math.max(-maxAbs * 1.15, Math.min(maxAbs * 1.15, p.re));
      const clI = Math.max(-maxAbs * 1.15, Math.min(maxAbs * 1.15, p.im));
      const X = cx + clR * scale, Y = cy + clI * scale;
      if (!started2) { ctx.moveTo(X, Y); started2 = true; }
      else ctx.lineTo(X, Y);
    }
    ctx.strokeStyle = 'rgba(96,165,250,0.7)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.restore();

    // 扫频光点与 ω 读数
    const idx = Math.min(drawnN, pos.length - 1);
    const p = pos[idx];
    if (isFinite(p.re) && isFinite(p.im)) {
      const clR = Math.max(-maxAbs * 1.15, Math.min(maxAbs * 1.15, p.re));
      const clI = Math.max(-maxAbs * 1.15, Math.min(maxAbs * 1.15, p.im));
      drawDot(ctx, cx + clR * scale, cy - clI * scale, 6, COLORS.amber);
    }
    drawChip(ctx, 22, H - 30, `ω = ${ws[idx]?.toFixed(2) ?? '—'} rad/s   G(jω) = ${p?.re?.toFixed(3) ?? '—'} + j(${p?.im?.toFixed(3) ?? '—'})`, 'rgba(251,191,36,0.1)', COLORS.amber, 11);

    // ---------- 右侧：判据说明 ----------
    const rx = pw + 44;
    ctx.save();
    ctx.translate(rx, 0);
    ctx.beginPath();
    ctx.roundRect(0, 10, W - rx - 12, H - 20, 12);
    ctx.fillStyle = 'rgba(2,6,23,0.45)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(148,163,184,0.2)';
    ctx.stroke();
    panelTitle(ctx, W - rx, '② 奈奎斯特稳定判据');
    const Z = openPoles.P; // Z = P − 2N，正频扫N半圈（含镜像合计 N）
    const rows = [
      ['P（开环右半平面极点数）', `${openPoles.P}`],
      ['虚轴上极点（积分环节）', `${openPoles.atOrigin}`],
      ['N（曲线包围 −1 点圈数）', '扫频中动态观察 →'],
      ['Z = P − 2N（右半平面闭环极点）', '—'],
    ];
    rows.forEach(([k, v], i) => {
      drawLabel(ctx, 16, 56 + i * 30, k, 'rgba(203,213,225,0.85)', 12, 'sans');
      drawLabel(ctx, 16, 72 + i * 30, v, COLORS.amber, 12, 'mono');
    });
    drawLabel(ctx, 16, H - 60, '判据：Z = 0 ⇔ 闭环稳定', COLORS.green, 13, 'sans');
    drawLabel(ctx, 16, H - 40, '若 P=0，则曲线不包围 (−1,j0) 即稳定', 'rgba(148,163,184,0.8)', 11, 'sans');
    ctx.restore();
  }, [loop.t, loop.cycle, data, tf, openPoles, W, H, duration]);

  const verdict = useMemo(() => {
    // 简化判断：P=0 时用增益裕度判据
    const m = stabilityMargins(tf);
    const stable = openPoles.P === 0 && (isFinite(m.gm) ? m.gm > 0 : true) && m.gamma > 0;
    return { stable, gm: m.gm, gamma: m.gamma };
  }, [tf, openPoles]);

  return (
    <div className="space-y-5">
      <SimPanel>
        <canvas ref={canvasRef} className="w-full h-auto rounded-xl" style={{ aspectRatio: `${W}/${H}` }} />
        <div className="mt-3">
          <PlayBar
            playing={loop.playing} onToggle={() => loop.setPlaying(!loop.playing)}
            onReplay={loop.replay} speed={loop.speed} onSpeed={loop.setSpeed}
            t={loop.t} duration={duration}
          />
        </div>
      </SimPanel>

      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500" /> 被测系统
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {([['stable', '典型稳定'], ['marginal', '临界振荡'], ['unstable', '结构不稳定'], ['custom', '自定义参数']] as const).map(([k, label]) => (
                <button key={k} onClick={() => setPreset(k)}
                  className={`py-2 rounded-xl text-xs font-medium border transition ${
                    preset === k ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300' : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-slate-200'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
            <SliderControl label="增益 K" value={K} min={0.5} max={20} step={0.1} onChange={setK} />
            <SliderControl label="T₁" value={T1} min={0.05} max={2} step={0.05} unit="s" onChange={setT1} />
            <SliderControl label="T₂" value={T2} min={0.02} max={1} step={0.02} unit="s" onChange={setT2} />
            <SliderControl label="T₃" value={T3} min={0.01} max={0.5} step={0.01} unit="s" onChange={setT3} />
            <div className={`rounded-xl border px-3.5 py-2.5 text-sm font-semibold ${
              verdict.stable
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}>
              闭环预判：{verdict.stable ? '稳定 ✓（曲线不包围 −1 点）' : '不稳定 ✗（曲线包围了 −1 点）'}
            </div>
          </div>
          <MetricGrid items={[
            { k: '开环右半平面极点 P', v: String(openPoles.P), tone: 'cyan' },
            { k: '积分环节数', v: String(openPoles.atOrigin), tone: 'violet' },
            { k: '幅值裕度', v: isFinite(verdict.gm) ? `${verdict.gm.toFixed(1)} dB` : '∞', tone: 'green' },
            { k: '相角裕度', v: isFinite(verdict.gamma) ? `${verdict.gamma.toFixed(1)}°` : '—', tone: 'amber' },
          ]} />
          <SaveRecordButton
            simulationId="lab-nyquist"
            params={{ K, T1, T2, T3 }}
            metrics={{ 预判: verdict.stable ? '稳定' : '不稳定', 幅值裕度: isFinite(verdict.gm) ? verdict.gm.toFixed(1) : '∞' }}
          />
        </div>
        <div className="lg:col-span-8">
          <CalcProcess title="奈奎斯特判据应用流程" steps={[
            { title: '第一步：绘制开环奈氏曲线', formula: `G(jω)H(jω) = K / [s(${T1}s+1)(${T2}s+1)(${T3}s+1)]`, substitution: `ω: 0⁺ → +∞，再取共轭镜像` },
            { title: '第二步：统计开环右半平面极点数 P', formula: `解开环特征方程 → P = ${openPoles.P}`, note: openPoles.atOrigin > 0 ? `含 ${openPoles.atOrigin} 个积分环节（极点在原点，按虚轴处理）` : '无积分环节' },
            { title: '第三步：观察曲线对 (−1, j0) 点的包围圈数 N', formula: '顺时针包围为正、逆时针为负（正负频合计）', active: true },
            { title: '第四步：由 Z = P − 2N 判定闭环稳定性', formula: `Z = ${openPoles.P} − 2N`, result: verdict.stable ? 'Z = 0 → 闭环稳定 ✓' : 'Z ≠ 0 → 闭环不稳定 ✗' },
          ]} />
        </div>
      </div>
    </div>
  );
}
