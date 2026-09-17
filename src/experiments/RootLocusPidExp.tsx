import { useEffect, useMemo, useRef, useState } from 'react';
import {
  plotAxes, pxX, pxY, drawPolyline, drawDot, drawDashedLine, drawLabel,
  drawChip, drawPoleZero, panelTitle, fillUnderCurve, COLORS,
} from '@/experiments/drawKit';
import { useSimLoop } from '@/experiments/useSimLoop';
import { SliderControl, MetricGrid, PlayBar, CalcProcess, SimPanel, SaveRecordButton } from '@/components/labs/LabUI';
import type { CalcStep } from '@/components/labs/LabUI';
import { rootLocus, tfNormalize, tfStep, polyRoots, polyAdd, pidSim, zieglerNichols } from '@/utils/labsim';

// ================================================================
// 实验六：根轨迹（数值求解特征方程 + K 增益自动扫掠动画）
// ================================================================
export function RootLocusExp() {
  const [preset, setPreset] = useState<'p2' | 'p3' | 'pz'>('p2');
  const [p1, setP1] = useState(0);     // 极点（原点积分）
  const [p2, setP2] = useState(-2);
  const [p3, setP3] = useState(-4);
  const [z1, setZ1] = useState(-3);
  const [K, setK] = useState(3);
  const [autoSweep, setAutoSweep] = useState(true);

  const tf = useMemo(() => {
    if (preset === 'p2') return tfNormalize({ num: [1], den: [1, -(p1 + p2), p1 * p2] });
    if (preset === 'p3') return tfNormalize({ num: [1], den: [1, -(p1 + p2 + p3), p1 * p2 + p1 * p3 + p2 * p3, -p1 * p2 * p3] });
    return tfNormalize({ num: [1, -z1], den: [1, -(p1 + p2), p1 * p2] });
  }, [preset, p1, p2, p3, z1]);

  const rl = useMemo(() => rootLocus(tf, preset === 'p3' ? 60 : 30, 220), [tf, preset]);

  // K 自动扫掠
  const Kmax = preset === 'p3' ? 60 : 30;
  const sweepRef = useRef({ last: 0 });
  useEffect(() => {
    if (!autoSweep) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      sweepRef.current.last = now;
      setK(prev => {
        const next = prev + dt * 6;
        return next > Kmax ? 0.05 : next;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [autoSweep, Kmax]);

  // 当前 K 下的闭环极点与阶跃响应
  const closed = useMemo(() => {
    const denCl = polyAdd(tf.den, tf.num.map(v => v * K));
    const poles = polyRoots(denCl);
    const step = tfStep({ num: tf.num, den: denCl }, 10, 500);
    const stable = poles.every(p => p.re < -1e-6);
    return { poles, step, stable };
  }, [tf, K]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 880, H = 600;

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = W * dpr; c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // ---------- 左：根轨迹 s 平面 ----------
    const pw = 500, ph = H - 40;
    const padL = 34, padT = 24;
    const cx = padL + pw / 2 + 30, cy = padT + ph / 2;
    const sc = 34; // 每单位像素

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(10, 10, pw + 30, H - 20, 12);
    ctx.fillStyle = 'rgba(2,6,23,0.45)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(148,163,184,0.2)';
    ctx.stroke();
    ctx.restore();
    panelTitle(ctx, W, '① 根轨迹（K: 0→∞ 闭环极点的运动轨迹）');

    // 坐标轴与网格
    ctx.strokeStyle = 'rgba(148,163,184,0.07)';
    for (let i = -8; i <= 8; i++) {
      const x = cx + i * sc;
      ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + ph - 10); ctx.stroke();
      const y = cy - i * sc;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + pw - 20, y); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(226,232,240,0.45)';
    ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(padL, cy); ctx.lineTo(padL + pw - 20, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, padT); ctx.lineTo(cx, padT + ph - 10); ctx.stroke();
    drawLabel(ctx, padL + pw - 28, cy - 10, 'jω', COLORS.slate, 11);
    drawLabel(ctx, cx + 6, padT + 4, 'σ', COLORS.slate, 11);
    // 稳定区
    ctx.fillStyle = 'rgba(52,211,153,0.06)';
    ctx.fillRect(padL, padT, cx - padL, ph - 10);

    // 开环零极点
    const den = tf.den;
    const num = tf.num;
    const openPoles = polyRoots(den);
    const openZeros = polyRoots(num.filter(v => Math.abs(v) > 1e-12));
    openPoles.forEach(p => {
      if (Math.abs(p.re) > 12 || Math.abs(p.im) > 8) return;
      drawPoleZero(ctx, cx + p.re * sc, cy - p.im * sc, 'pole', COLORS.rose, 8);
    });
    openZeros.forEach(z => {
      if (Math.abs(z.re) > 12 || Math.abs(z.im) > 8) return;
      drawPoleZero(ctx, cx + z.re * sc, cy - z.im * sc, 'zero', COLORS.green, 8);
    });

    // 渐近线
    if (rl.asymptoteAngles.length && rl.asymptoteAngles[0] < 180) {
      ctx.save();
      ctx.setLineDash([4, 5]);
      ctx.strokeStyle = 'rgba(167,139,250,0.3)';
      rl.asymptoteAngles.forEach(ang => {
        const rad = (ang * Math.PI) / 180;
        const len = 10;
        ctx.beginPath();
        ctx.moveTo(cx + rl.centroid * sc, cy);
        ctx.lineTo(cx + (rl.centroid + len * Math.cos(rad)) * sc, cy - len * Math.sin(rad) * sc);
        ctx.stroke();
      });
      ctx.restore();
    }

    // 根轨迹分支（渐变色）
    const branchColors = [COLORS.cyan, COLORS.violet, COLORS.blue, COLORS.amber];
    rl.branches.forEach((branch, b) => {
      ctx.save();
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < branch.length; i++) {
        const p = branch[i];
        if (Math.abs(p.re) > 13 || Math.abs(p.im) > 8.5) { started = false; continue; }
        const X = cx + p.re * sc, Y = cy - p.im * sc;
        if (!started) { ctx.moveTo(X, Y); started = true; }
        else ctx.lineTo(X, Y);
      }
      ctx.strokeStyle = branchColors[b % branchColors.length] + '99';
      ctx.lineWidth = 2.6;
      ctx.shadowColor = branchColors[b % branchColors.length];
      ctx.shadowBlur = 4;
      ctx.stroke();
      ctx.restore();
    });

    // 分离点
    rl.breakaway.forEach(bx => {
      if (Math.abs(bx) > 12) return;
      drawDot(ctx, cx + bx * sc, cy, 4, COLORS.amber, false);
      drawLabel(ctx, cx + bx * sc, cy + 18, `分离点 ${bx.toFixed(2)}`, COLORS.amber, 9, 'mono', 'center');
    });

    // 当前 K 的闭环极点（运动光点）
    closed.poles.forEach((p, i) => {
      if (Math.abs(p.re) > 13 || Math.abs(p.im) > 8.5) return;
      const X = cx + p.re * sc, Y = cy - p.im * sc;
      const col = p.re < 0 ? COLORS.green : COLORS.orange;
      drawDot(ctx, X, Y, 7, col);
      drawDot(ctx, X, Y, 3, '#0f172a', false);
      if (i === 0) drawChip(ctx, X + 10, Y - 10, `s = ${p.re.toFixed(2)}${p.im >= 0 ? '+' : ''}${p.im.toFixed(2)}j`, 'rgba(15,23,42,0.9)', col, 10);
    });

    // ---------- 右：当前 K 的闭环阶跃响应 ----------
    const off = pw + 52;
    ctx.save();
    ctx.translate(off, 0);
    const reg = plotAxes(ctx, W - off, H, {
      xMin: 0, xMax: 10, yMin: -0.2, yMax: 2.0,
      xTicks: 5, yTicks: 4, xLabel: '时间 t (s)', yLabel: 'h(t)',
      bgColor: 'rgba(2,6,23,0.4)',
    });
    drawDashedLine(ctx, reg.padL, pxY(reg, 1), reg.padL + reg.plotW, pxY(reg, 1), 'rgba(148,163,184,0.45)');
    // 响应（按当前时间裁剪，形成动画感）
    const N = closed.step.t.length;
    const upto = Math.max(2, Math.floor((K / Kmax) * N));
    void upto;
    fillUnderCurve(ctx, reg, closed.step.t, closed.step.y, closed.stable ? COLORS.cyan : COLORS.orange, N);
    drawPolyline(ctx, reg, closed.step.t, closed.step.y, closed.stable ? COLORS.cyan : COLORS.orange, 2.4);
    drawChip(ctx, reg.padL + 8, reg.padT + 12, `K = ${K.toFixed(1)}`, 'rgba(251,191,36,0.12)', COLORS.amber, 11);
    drawChip(ctx, reg.padL + 8, reg.padT + 32, closed.stable ? `闭环稳定 ✓` : '闭环不稳定 ✗', closed.stable ? 'rgba(52,211,153,0.12)' : 'rgba(251,113,133,0.12)', closed.stable ? COLORS.green : COLORS.rose, 11);
    if (!closed.stable) {
      drawChip(ctx, reg.padL + 8, reg.padT + 52, '极点进入右半平面', 'rgba(251,113,133,0.12)', COLORS.rose, 10);
    }
    ctx.restore();
  }, [K, tf, rl, closed, W, H]);

  const steps: CalcStep[] = useMemo(() => {
    const n = tf.den.length - 1;
    const m = tf.num.filter(v => Math.abs(v) > 1e-12).length - 1;
    const nmm = n - m;
    return [
      { title: '开环传递函数', formula: `G(s) = ${preset === 'pz' ? `(s+${-z1})` : '1'} / ${preset === 'p3' ? `[(s−${p1})(s−${p2})(s−${p3})]` : `[(s−${p1})(s−${p2})]`}`, substitution: `n = ${n} 个极点, m = ${m} 个零点` },
      { title: '闭环特征方程', formula: '1 + K·G(s) = 0', substitution: `K = ${K.toFixed(2)}`, note: '根轨迹即 K 从 0→∞ 时该方程全部根的轨迹' },
      { title: '渐近线（n−m 条）', formula: `σa = (Σp − Σz)/(n−m) = ${rl.centroid.toFixed(2)},  夹角 = (2k+1)×180°/(n−m)`, substitution: rl.asymptoteAngles.slice(0, 2).map(a => `${a.toFixed(0)}°`).join(' / '), note: `${nmm} 条渐近线，交点在实轴 ${rl.centroid.toFixed(2)} 处` },
      { title: '分离点（dK/ds = 0 的实根）', formula: rl.breakaway.length ? `s = ${rl.breakaway.map(b => b.toFixed(2)).join(', ')}` : '本系统无实轴分离点', note: '分离点处闭环出现重根，响应由过阻尼转为欠阻尼' },
      { title: `K = ${K.toFixed(1)} 时的闭环极点`, formula: closed.poles.map(p => `${p.re.toFixed(3)} ${p.im >= 0 ? '+' : '−'} ${Math.abs(p.im).toFixed(3)}j`).join(' ,  '), result: closed.stable ? '全部位于左半平面 → 稳定 ✓' : '存在右半平面极点 → 不稳定 ✗', active: true },
    ];
  }, [tf, preset, p1, p2, p3, z1, K, rl, closed]);

  return (
    <div className="space-y-5">
      <SimPanel>
        <canvas ref={canvasRef} className="w-full h-auto rounded-xl" style={{ aspectRatio: `${W}/${H}` }} />
        <div className="mt-3">
          <PlayBar
            playing={autoSweep} onToggle={() => setAutoSweep(!autoSweep)}
            onReplay={() => setK(0.05)} speed={1} onSpeed={() => {}}
            t={K} duration={Kmax}
          />
        </div>
      </SimPanel>

      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500" /> 系统结构
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {([['p2', '二阶系统'], ['p3', '三阶系统'], ['pz', '带零点']] as const).map(([k, label]) => (
                <button key={k} onClick={() => setPreset(k)}
                  className={`py-2 rounded-xl text-xs font-medium border transition ${
                    preset === k ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300' : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-slate-200'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
            <SliderControl label="极点 p₁" value={p1} min={-4} max={0} step={0.1} onChange={setP1} format={v => v.toFixed(1)} />
            <SliderControl label="极点 p₂" value={p2} min={-6} max={-0.1} step={0.1} onChange={setP2} format={v => v.toFixed(1)} />
            {preset === 'p3' && <SliderControl label="极点 p₃" value={p3} min={-8} max={-0.1} step={0.1} onChange={setP3} format={v => v.toFixed(1)} />}
            {preset === 'pz' && <SliderControl label="零点 z₁" value={z1} min={-6} max={-0.1} step={0.1} onChange={setZ1} format={v => v.toFixed(1)} />}
            <SliderControl label="开环增益 K（可自动扫掠）" value={K} min={0.05} max={Kmax} step={0.1} onChange={v => { setAutoSweep(false); setK(v); }} />
          </div>
          <MetricGrid items={[
            { k: '当前 K', v: K.toFixed(1), tone: 'amber' },
            { k: '闭环极点数', v: String(closed.poles.length), tone: 'cyan' },
            { k: '渐近线夹角', v: rl.asymptoteAngles.slice(0, 2).map(a => `${a.toFixed(0)}°`).join(' '), tone: 'violet' },
            { k: '闭环稳定性', v: closed.stable ? '稳定 ✓' : '不稳定 ✗', tone: closed.stable ? 'green' : 'rose' },
          ]} />
          <SaveRecordButton
            simulationId="lab-root-locus"
            params={{ p1, p2, p3: preset === 'p3' ? p3 : 0, z1: preset === 'pz' ? z1 : 0, K }}
            metrics={{ K: K.toFixed(1), 稳定性: closed.stable ? '稳定' : '不稳定', 分离点: rl.breakaway.length ? rl.breakaway.map(b => b.toFixed(2)).join(',') : '无' }}
          />
        </div>
        <div className="lg:col-span-8">
          <CalcProcess steps={steps} />
        </div>
      </div>
    </div>
  );
}

// ================================================================
// 实验七：PID 控制器整定仿真（Z-N 自动整定 + 扰动 + 饱和）
// ================================================================

const PID_PLANTS = {
  motor: { label: '直流电机位置 1/[s(s+1)]', num: [1], den: [1, 1, 0], tEnd: 12 },
  temp: { label: '温度对象 1/[(s+1)(0.4s+1)]', num: [1], den: [0.4, 1.4, 1], tEnd: 12 },
  slow: { label: '大惯性对象 1/[(s+1)²(0.2s+1)]', num: [1], den: [0.2, 1.4, 2, 1], tEnd: 18 },
} as const;

export function PidExp() {
  const [plantKey, setPlantKey] = useState<keyof typeof PID_PLANTS>('motor');
  const [Kp, setKp] = useState(2);
  const [Ki, setKi] = useState(1);
  const [Kd, setKd] = useState(0.4);
  const [distOn, setDistOn] = useState(true);
  const [znMsg, setZnMsg] = useState<string | null>(null);

  const plant = PID_PLANTS[plantKey];
  const tf = useMemo(() => tfNormalize({ num: [...plant.num], den: [...plant.den] }), [plant]);

  const result = useMemo(() => pidSim(tf, {
    Kp, Ki, Kd,
    tEnd: plant.tEnd,
    umin: -8, umax: 8,
    distAt: distOn ? plant.tEnd * 0.55 : undefined,
    distValue: 0.5,
  }), [tf, Kp, Ki, Kd, plant.tEnd, distOn]);

  // 性能指标
  const perf = useMemo(() => {
    const { t, y, e } = result;
    const finalV = y[y.length - 1];
    let peak = -Infinity, tp = 0;
    for (let i = 0; i < y.length; i++) if (y[i] > peak) { peak = y[i]; tp = t[i]; }
    const os = Math.max(0, (peak / Math.max(finalV, 1e-9) - 1)) * 100;
    let ts = NaN;
    for (let i = y.length - 1; i >= 0; i--) {
      if (Math.abs(y[i] - finalV) > 0.02 * Math.max(1, Math.abs(finalV))) { ts = t[i]; break; }
    }
    const ess = Math.abs(e[e.length - 1]);
    return { os, ts, ess, finalV, peak, tp };
  }, [result]);

  const duration = plant.tEnd;
  const loop = useSimLoop({ duration });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 880, H = 640;

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = W * dpr; c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const { t, r, y, u, e, pTerm, iTerm, dTerm } = result;
    const upto = Math.max(2, Math.floor((loop.t / duration) * t.length));

    // ---- 面板1: 输出跟踪 ----
    const h1 = 250;
    const reg1 = plotAxes(ctx, W, h1, {
      xMin: 0, xMax: duration, yMin: -0.1, yMax: Math.max(1.4, perf.peak * 1.15),
      xTicks: 0, yTicks: 4, yLabel: '输出 y / 设定 r',
      bgColor: 'rgba(2,6,23,0.4)',
    });
    drawPolyline(ctx, reg1, t.slice(0, upto), r.slice(0, upto), 'rgba(148,163,184,0.6)', 1.6, undefined, [5, 4]);
    fillUnderCurve(ctx, reg1, t, y, COLORS.cyan, upto);
    drawPolyline(ctx, reg1, t.slice(0, upto), y.slice(0, upto), COLORS.cyan, 2.4);
    // 扰动时刻
    if (distOn) {
      const dx = pxX(reg1, plant.tEnd * 0.55);
      drawDashedLine(ctx, dx, reg1.padT, dx, reg1.padT + reg1.plotH, 'rgba(251,113,133,0.5)');
      drawChip(ctx, Math.min(dx + 5, W - 100), reg1.padT + 10, '⚡ 加入负载扰动', 'rgba(251,113,133,0.12)', COLORS.rose, 10);
    }
    drawChip(ctx, W - 150, 24, `超调 ${perf.os.toFixed(1)}%`, 'rgba(251,191,36,0.1)', COLORS.amber, 11);

    // ---- 面板2: 控制量 u（含 P/I/D 堆叠柱示意） ----
    const y2 = h1 + 6;
    const h2 = 180;
    ctx.save();
    ctx.translate(0, y2);
    const reg2 = plotAxes(ctx, W, h2, {
      xMin: 0, xMax: duration, yMin: -8.5, yMax: 8.5,
      xTicks: 0, yTicks: 4, yLabel: '控制量 u',
      bgColor: 'rgba(2,6,23,0.4)',
    });
    // P/I/D 分量（细线）
    drawPolyline(ctx, reg2, t.slice(0, upto), pTerm.slice(0, upto), 'rgba(96,165,250,0.5)', 1.2);
    drawPolyline(ctx, reg2, t.slice(0, upto), iTerm.slice(0, upto), 'rgba(52,211,153,0.5)', 1.2);
    drawPolyline(ctx, reg2, t.slice(0, upto), dTerm.slice(0, upto), 'rgba(167,139,250,0.5)', 1.2);
    drawPolyline(ctx, reg2, t.slice(0, upto), u.slice(0, upto), COLORS.amber, 2.2);
    // 饱和界
    drawDashedLine(ctx, reg2.padL, pxY(reg2, 8), reg2.padL + reg2.plotW, pxY(reg2, 8), 'rgba(251,113,133,0.35)', [3, 4]);
    drawDashedLine(ctx, reg2.padL, pxY(reg2, -8), reg2.padL + reg2.plotW, pxY(reg2, -8), 'rgba(251,113,133,0.35)', [3, 4]);
    drawLabel(ctx, W - 24, pxY(reg2, 8) - 8, '执行器饱和 ±8', COLORS.rose, 9, 'sans', 'right');
    // 图例
    drawChip(ctx, reg2.padL + 8, reg2.padT + 10, 'u 总输出', 'rgba(251,191,36,0.1)', COLORS.amber, 10);
    drawChip(ctx, reg2.padL + 86, reg2.padT + 10, 'P', 'rgba(96,165,250,0.1)', COLORS.blue, 10);
    drawChip(ctx, reg2.padL + 116, reg2.padT + 10, 'I', 'rgba(52,211,153,0.1)', COLORS.green, 10);
    drawChip(ctx, reg2.padL + 142, reg2.padT + 10, 'D', 'rgba(167,139,250,0.1)', COLORS.violet, 10);
    ctx.restore();

    // ---- 面板3: 误差 e（y 轴随数据自适应，避免截断） ----
    const y3 = y2 + h2 + 6;
    const h3 = H - y3 - 14;
    ctx.save();
    ctx.translate(0, y3);
    let eMin = 0, eMax = 0;
    for (const v of e) { if (v < eMin) eMin = v; if (v > eMax) eMax = v; }
    const pad3 = Math.max(0.12, (eMax - eMin) * 0.12);
    const reg3 = plotAxes(ctx, W, h3, {
      xMin: 0, xMax: duration, yMin: eMin - pad3, yMax: eMax + pad3,
      xTicks: 6, yTicks: 4, xLabel: '时间 t (s)', yLabel: '误差 e = r − y',
      bgColor: 'rgba(2,6,23,0.4)',
    });
    drawPolyline(ctx, reg3, t.slice(0, upto), e.slice(0, upto), COLORS.rose, 2);
    // 当前光标
    const idxNow = Math.min(upto, t.length - 1);
    const xNow = pxX(reg1, t[idxNow]);
    [reg1, reg2, reg3].forEach(reg => {
      ctx.save();
      ctx.translate(0, reg === reg1 ? 0 : reg === reg2 ? -y2 : -y3);
      void reg;
      ctx.restore();
    });
    // 三条面板的光标竖线
    const drawCursor = (baseY: number, reg: ReturnType<typeof plotAxes>) => {
      ctx.save();
      ctx.translate(0, -baseY);
      drawDashedLine(ctx, xNow, reg.padT, xNow, reg.padT + reg.plotH, 'rgba(226,232,240,0.35)', [3, 3], 1);
      ctx.restore();
    };
    drawCursor(0, reg1);
    ctx.restore();

    // P/I/D 实时贡献柱
    const bx = W - 128, by = h1 - 88;
    const items: [string, number, string][] = [
      ['P', pTerm[idxNow] ?? 0, COLORS.blue],
      ['I', iTerm[idxNow] ?? 0, COLORS.green],
      ['D', dTerm[idxNow] ?? 0, COLORS.violet],
    ];
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(bx, by, 116, 76, 10);
    ctx.fillStyle = 'rgba(2,6,23,0.8)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(148,163,184,0.2)';
    ctx.stroke();
    items.forEach(([label, v, color], i) => {
      const cxp = bx + 24 + i * 30;
      const scaleV = Math.max(-1, Math.min(1, v / 8));
      const hgt = scaleV * 26;
      ctx.fillStyle = color;
      if (hgt >= 0) ctx.fillRect(cxp - 5, by + 40 - hgt, 10, Math.max(1.5, hgt));
      else ctx.fillRect(cxp - 5, by + 40, 10, Math.max(1.5, -hgt));
      drawLabel(ctx, cxp, by + 62, label, color, 9, 'sans', 'center');
    });
    drawLabel(ctx, bx + 58, by + 12, 'PID 实时分量', 'rgba(226,232,240,0.8)', 9, 'sans', 'center');
    ctx.restore();
  }, [loop.t, loop.cycle, result, perf, distOn, plant.tEnd, duration, W, H]);

  const applyZN = () => {
    const zn = zieglerNichols(tf);
    if (!zn) {
      setZnMsg('该对象无法用 Z-N 法整定（无 −180° 穿越点）');
      return;
    }
    setKp(0.6 * zn.Ku);
    setKi(1.2 * zn.Ku / zn.Tu);
    setKd(0.075 * zn.Ku * zn.Tu);
    setZnMsg(`已应用: Ku=${zn.Ku.toFixed(2)}, Tu=${zn.Tu.toFixed(2)}s → Kp=${(0.6 * zn.Ku).toFixed(2)}, Ki=${(1.2 * zn.Ku / zn.Tu).toFixed(2)}, Kd=${(0.075 * zn.Ku * zn.Tu).toFixed(2)}`);
    setTimeout(() => setZnMsg(null), 5000);
  };

  const steps: CalcStep[] = useMemo(() => {
    const idx = Math.min(result.t.length - 1, Math.floor((loop.t / duration) * result.t.length));
    const eNow = result.e[idx] ?? 0;
    const uNow = result.u[idx] ?? 0;
    return [
      { title: 'PID 控制律（时域形式）', formula: 'u(t) = Kp·e(t) + Ki·∫e(τ)dτ + Kd·de/dt', substitution: `Kp=${Kp.toFixed(2)}, Ki=${Ki.toFixed(2)}, Kd=${Kd.toFixed(2)}` },
      { title: `当前时刻 t=${result.t[idx]?.toFixed(2)}s`, formula: `e = r − y = ${eNow.toFixed(4)}`, note: 'e 为设定值与输出之差' },
      { title: '比例项 P（对当前误差立即反应）', formula: `Kp·e = ${Kp.toFixed(2)} × ${eNow.toFixed(3)} = ${(Kp * eNow).toFixed(3)}`, note: 'Kp 大 → 响应快但易振荡' },
      { title: '积分项 I（消除稳态误差）', formula: `Ki·∫e·dτ = ${Ki.toFixed(2)} × 累积面积`, note: '误差不为零时积分持续累积，直到 e=0' },
      { title: '微分项 D（预测误差变化，抑制超调）', formula: `Kd·(−dy/dt)（微分先行，对输出微分）`, substitution: `Kd = ${Kd.toFixed(2)}`, note: '输出变化越快，制动力越强' },
      { title: '合成控制量（含执行器饱和 ±8）', formula: `u = P + I + D`, substitution: `u = ${uNow.toFixed(3)}`, result: Math.abs(uNow) >= 7.99 ? '⚠ 已饱和，抗积分饱和逻辑介入' : '线性区', active: true },
    ];
  }, [result, loop.t, duration, Kp, Ki, Kd]);

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
              <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500" /> PID 整定台
            </div>
            <div>
              <div className="text-xs text-slate-300 font-medium mb-2">被控对象</div>
              <div className="space-y-1.5">
                {(Object.keys(PID_PLANTS) as (keyof typeof PID_PLANTS)[]).map(k => (
                  <button key={k} onClick={() => setPlantKey(k)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-medium border text-left transition ${
                      plantKey === k ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300' : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-slate-200'
                    }`}>
                    {PID_PLANTS[k].label}
                  </button>
                ))}
              </div>
            </div>
            <SliderControl label="比例系数 Kp" value={Kp} min={0} max={12} step={0.1} onChange={setKp} accent="#60a5fa" />
            <SliderControl label="积分系数 Ki" value={Ki} min={0} max={8} step={0.05} onChange={setKi} accent="#34d399" />
            <SliderControl label="微分系数 Kd" value={Kd} min={0} max={4} step={0.05} onChange={setKd} accent="#a78bfa" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">t=55% 时加入负载扰动</span>
              <button onClick={() => setDistOn(!distOn)}
                className={`w-11 h-6 rounded-full transition relative ${distOn ? 'bg-rose-500/70' : 'bg-slate-700'}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${distOn ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
            <button onClick={applyZN} className="w-full btn-secondary !py-2.5 text-sm">
              ⚡ Ziegler-Nichols 自动整定
            </button>
            {znMsg && (
              <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2 leading-relaxed">
                {znMsg}
              </div>
            )}
          </div>
          <MetricGrid items={[
            { k: '超调量 σ%', v: `${perf.os.toFixed(1)}%`, tone: 'amber' },
            { k: '调节时间 ts (2%)', v: isFinite(perf.ts) ? `${perf.ts.toFixed(2)}s` : '未收敛', tone: 'green' },
            { k: '稳态误差 |ess|', v: perf.ess.toFixed(4), tone: Ki > 0 ? 'green' : 'rose' },
            { k: '峰值', v: perf.peak.toFixed(3), tone: 'cyan' },
          ]} />
          <SaveRecordButton
            simulationId="lab-pid"
            params={{ Kp, Ki, Kd }}
            metrics={{ 超调量: `${perf.os.toFixed(1)}%`, 稳态误差: perf.ess.toFixed(4), 对象: plant.label }}
          />
        </div>
        <div className="lg:col-span-8 space-y-4">
          <CalcProcess steps={steps} title="PID 计算流程 · 逐项拆解" />
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4 text-[13px] leading-relaxed text-slate-300 space-y-2">
            <p className="font-semibold text-white">Ziegler–Nichols 临界比例度法</p>
            <p>
              先用纯比例控制逐渐增大 Kp 直到系统等幅振荡，记下临界增益 Ku 和振荡周期 Tu，再按
              <span className="font-mono text-cyan-300"> Kp=0.6Ku、Ti=0.5Tu、Td=0.125Tu</span> 计算 PID 参数。
              本实验自动搜索 −180° 相角穿越点求得 Ku = 1/|G(jωg)|、Tu = 2π/ωg。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
