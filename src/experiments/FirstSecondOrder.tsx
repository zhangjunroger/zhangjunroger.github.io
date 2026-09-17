import { useEffect, useMemo, useRef, useState } from 'react';
import { useSimLoop } from '@/experiments/useSimLoop';
import {
  plotAxes, pxX, pxY, drawPolyline, drawDot, drawDashedLine, drawLabel,
  drawChip, drawArrow, drawSpring, drawDamper, drawMass, fillUnderCurve,
  panelTitle, COLORS,
} from '@/experiments/drawKit';
import { SliderControl, MetricGrid, PlayBar, CalcProcess, SimPanel, SaveRecordButton } from '@/components/labs/LabUI';
import type { CalcStep } from '@/components/labs/LabUI';

// ================================================================
// 实验一：一阶系统时域响应（RC 电路充放电动画）
// ================================================================
export function FirstOrderExp() {
  const [K, setK] = useState(1);
  const [T, setT] = useState(0.8);
  const [input, setInput] = useState<'step' | 'ramp' | 'sine'>('step');
  const duration = Math.max(8, T * 6);
  const loop = useSimLoop({ duration });

  const sim = useMemo(() => {
    const N = 700;
    const ts: number[] = [], ys: number[] = [];
    for (let i = 0; i <= N; i++) {
      const t = (duration * i) / N;
      ts.push(t);
      if (input === 'step') ys.push(K * (1 - Math.exp(-t / T)));
      else if (input === 'ramp') ys.push(K * (t - T * (1 - Math.exp(-t / T))));
      else {
        // 一阶系统对正弦输入 A·sin(ωt) 的全响应
        const w = 1.5;
        const A = K / Math.sqrt(1 + (w * T) ** 2);
        const phi = Math.atan(w * T);
        ys.push(A * Math.sin(w * t - phi) + A * Math.sin(phi) * Math.exp(-t / T));
      }
    }
    return { ts, ys };
  }, [K, T, input, duration]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 880, H = 580;

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = W * dpr; c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // 采样当前值
    let curY = 0;
    let drawnIdx = 0;
    {
      const ts = sim.ts, ys = sim.ys;
      let lo = 0, hi = ts.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ts[m] <= loop.t) lo = m; else hi = m; }
      const f = (loop.t - ts[lo]) / (ts[hi] - ts[lo]);
      curY = ys[lo] + f * (ys[hi] - ys[lo]);
      drawnIdx = lo;
    }

    // ---------- 上半部分：RC 电路动画 ----------
    const cy = 130; // 电路中心线
    const cx0 = 120, cx1 = 720;
    // 导线
    ctx.strokeStyle = 'rgba(148,163,184,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx0, cy - 60); ctx.lineTo(cx0, cy + 60);       // 左竖线
    ctx.lineTo(cx0 + 140, cy + 60);                            // 下导线到电阻
    ctx.stroke();
    // 电阻 (锯齿)
    ctx.beginPath();
    let rx = cx0 + 140;
    ctx.moveTo(rx, cy + 60);
    for (let i = 0; i < 6; i++) {
      rx += 14;
      ctx.lineTo(rx, cy + 60 + (i % 2 === 0 ? -10 : 10));
    }
    rx += 14;
    ctx.lineTo(rx, cy + 60);
    ctx.lineTo(cx1 - 90, cy + 60);
    ctx.stroke();
    // 电容 (双横线)
    const capX = cx1 - 90;
    ctx.beginPath();
    ctx.moveTo(capX, cy + 60); ctx.lineTo(capX, cy + 14);
    ctx.moveTo(capX - 26, cy + 14); ctx.lineTo(capX + 26, cy + 14);
    ctx.moveTo(capX - 26, cy - 2); ctx.lineTo(capX + 26, cy - 2);
    ctx.moveTo(capX, cy - 2); ctx.lineTo(capX, cy - 60);
    ctx.lineTo(cx0, cy - 60);
    ctx.stroke();
    // 电源符号
    ctx.beginPath();
    ctx.moveTo(cx0 - 14, cy - 8); ctx.lineTo(cx0 + 14, cy - 8);
    ctx.moveTo(cx0 - 8, cy + 8); ctx.lineTo(cx0 + 8, cy + 8);
    ctx.stroke();
    drawLabel(ctx, cx0 - 24, cy - 8, 'R', COLORS.slate, 13, 'sans');
    drawLabel(ctx, capX + 34, cy + 6, 'C', COLORS.slate, 13, 'sans');

    // 电容器电荷填充
    const charge = input === 'step' ? Math.min(1, curY / K) : Math.abs(Math.sin(loop.t * 1.5)) * 0.9;
    const capH = 52;
    ctx.save();
    ctx.beginPath();
    ctx.rect(capX - 22, cy + 13 - capH * charge, 44, capH * charge);
    ctx.clip();
    const grad = ctx.createLinearGradient(0, cy + 13 - capH, 0, cy + 13);
    grad.addColorStop(0, COLORS.amber);
    grad.addColorStop(1, COLORS.cyanDeep);
    ctx.fillStyle = grad;
    ctx.fillRect(capX - 22, cy + 13 - capH, 44, capH);
    ctx.restore();
    ctx.strokeStyle = 'rgba(251,191,36,0.35)';
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(capX - 22, cy + 13 - capH, 44, capH);
    ctx.setLineDash([]);

    // 电子流（沿导线运动的点）
    const flowSpeed = 60 + Math.abs(curY) * 80;
    for (let i = 0; i < 14; i++) {
      const per = (loop.t * flowSpeed + i * 47) % 640;
      let px: number, py: number;
      if (per < 340) { px = cx0 + 140 + per; py = cy + 60; }
      else if (per < 440) { px = cx1 - 90; py = cy + 60 - (per - 340) * 1.2; }
      else if (per < 540) { px = cx1 - 90; py = cy - 60 + (per - 540) * 0 + (540 - per) * 1.2; }
      else { px = cx0 + (per - 540) * 0.1; py = cy - 60 + 0; px = cx1 - 90 - (per - 540) * 5.5; if (px < cx0) px = cx0; }
      drawDot(ctx, px, py, 2.6, COLORS.cyan, true);
    }

    // 电压表
    const vc = input === 'step' ? curY : curY;
    drawChip(ctx, cx0 + 190, cy - 20, `u_C = ${vc.toFixed(3)} V`, 'rgba(15,23,42,0.85)', COLORS.amber, 12);
    drawChip(ctx, cx0 + 380, cy - 20, `t = ${loop.t.toFixed(2)} s`, 'rgba(15,23,42,0.85)', COLORS.cyan, 12);
    panelTitle(ctx, W, '① 物理对象：RC 充电电路', '电容电压按指数规律逼近电源电压');

    // ---------- 下半部分：响应曲线 ----------
    const reg = plotAxes(ctx, W, 330, {
      xMin: 0, xMax: duration, yMin: -0.2, yMax: Math.max(1.4, K * 1.25),
      xTicks: 8, yTicks: 4, xLabel: '时间 t (s)',
      yLabel: input === 'step' ? '输出 y(t)' : 'y(t)',
      bgColor: 'rgba(2,6,23,0.5)',
    });
    panelTitle(ctx, W, '', '');

    const drawn = drawnIdx;
    if (input === 'step') {
      fillUnderCurve(ctx, reg, sim.ts, sim.ys, COLORS.cyan, drawn + 1);
    }
    // 输入参考线
    if (input === 'step') {
      drawDashedLine(ctx, reg.padL, pxY(reg, K), reg.padL + reg.plotW, pxY(reg, K), 'rgba(148,163,184,0.5)');
      drawLabel(ctx, reg.padL + reg.plotW - 6, pxY(reg, K) - 10, `输入 = ${K}`, COLORS.slate, 10, 'mono', 'right');
    }
    drawPolyline(ctx, reg, sim.ts, sim.ys, COLORS.cyan, 2.4, drawn + 1);
    // 时间常数标注 t=T → 63.2%
    if (input === 'step' && K > 0) {
      const yT = K * 0.632;
      const xT = Math.min(pxX(reg, T), reg.padL + reg.plotW);
      drawDashedLine(ctx, xT, pxY(reg, yT), xT, pxY(reg, 0), 'rgba(251,191,36,0.55)');
      drawDashedLine(ctx, xT, pxY(reg, yT), reg.padL, pxY(reg, yT), 'rgba(251,191,36,0.55)');
      drawChip(ctx, Math.min(xT + 8, reg.padL + reg.plotW - 110), pxY(reg, yT), `t=T: 63.2%K`, 'rgba(251,191,36,0.15)', COLORS.amber, 10);
    }
    // 运动光点
    if (drawn >= 0 && drawn < sim.ts.length) {
      drawDot(ctx, pxX(reg, sim.ts[drawn]), pxY(reg, sim.ys[drawn]), 5.5, COLORS.cyan);
    }
  }, [loop.t, loop.cycle, K, T, input, sim, duration]);


  const metrics = useMemo(() => ([
    { k: '时间常数 T', v: `${T.toFixed(2)} s`, tone: 'amber' as const },
    { k: '稳态终值', v: input === 'step' ? K.toFixed(2) : input === 'ramp' ? '∞ (斜坡)' : '±', tone: 'cyan' as const },
    { k: 't=T 时达到', v: '63.2 %', tone: 'green' as const },
    { k: 't=3T 时达到', v: '95.0 %', tone: 'green' as const },
    { k: '调节时间 (5%)', v: `${(3 * T).toFixed(2)} s`, tone: 'violet' as const },
    { k: '调节时间 (2%)', v: `${(4 * T).toFixed(2)} s`, tone: 'violet' as const },
  ]), [T, K, input]);

  const steps: CalcStep[] = useMemo(() => {
    const t = Math.min(loop.t, duration);
    const val = K * (1 - Math.exp(-t / T));
    if (input !== 'step') {
      return [
        { title: '输入类型', formula: input === 'ramp' ? 'r(t) = t · 1(t)' : 'r(t) = sin(1.5t) · 1(t)', note: '切换上方按钮可选择斜坡/正弦输入' },
        { title: '输出按线性微分方程数值求解', formula: 'T·ẏ(t) + y(t) = K·r(t)', substitution: `T = ${T.toFixed(2)} s, K = ${K.toFixed(2)}` },
      ];
    }
    return [
      { title: '一阶系统标准形式（闭环传递函数）', formula: 'Φ(s) = K / (T·s + 1)', substitution: `K = ${K.toFixed(2)}, T = ${T.toFixed(2)} s` },
      { title: '单位阶跃响应解析解（拉氏反变换）', formula: 'h(t) = K·(1 − e^(−t/T))', note: '极点 s = −1/T 决定收敛速度' },
      { title: `代入当前时刻 t = ${t.toFixed(2)} s`, formula: `h(${t.toFixed(2)}) = ${K.toFixed(2)} × (1 − e^(−${t.toFixed(2)}/${T.toFixed(2)}))`, substitution: `e^(−${(t / T).toFixed(3)}) = ${Math.exp(-t / T).toFixed(4)}`, result: `${val.toFixed(4)}` },
      { title: '验证：t = T 时输出恒为 63.2%K', formula: `h(T) = ${K.toFixed(2)} × (1 − e⁻¹)`, result: `${(K * 0.632).toFixed(3)}`, note: '时间常数 T 是一阶系统唯一特征参数' },
    ];
  }, [loop.t, K, T, input, duration]);

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
          <div className="glass-card rounded-2xl p-5 space-y-5">
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500" /> 参数调节
            </div>
            <SliderControl label="增益 K" value={K} min={0.4} max={3} step={0.05} onChange={setK} />
            <SliderControl label="时间常数 T" value={T} min={0.2} max={3} step={0.05} unit="s" onChange={setT} />
            <div>
              <div className="text-xs text-slate-300 font-medium mb-2">输入信号类型</div>
              <div className="grid grid-cols-3 gap-1.5">
                {([['step', '阶跃'], ['ramp', '斜坡'], ['sine', '正弦']] as const).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => { setInput(k); loop.replay(); }}
                    className={`py-2 rounded-xl text-xs font-medium border transition ${
                      input === k
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                        : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <MetricGrid items={metrics} />
          <SaveRecordButton
            simulationId="lab-first-order"
            params={{ K, T }}
            metrics={{ 时间常数T: `${T.toFixed(2)}s`, 终值: K.toFixed(2), 输入类型: input }}
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
// 实验二：二阶系统阶跃响应（质量-弹簧-阻尼动画）
// ================================================================
export function SecondOrderExp() {
  const [wn, setWn] = useState(2);
  const [zeta, setZeta] = useState(0.45);
  const duration = useMemo(() => {
    const ts = zeta > 0.02 ? -Math.log(0.02 * Math.sqrt(1 - Math.min(0.99, zeta) ** 2)) / (zeta * wn) : 8 / wn;
    return Math.max(8, Math.min(30, ts * 1.5));
  }, [wn, zeta]);
  const loop = useSimLoop({ duration });

  const sim = useMemo(() => {
    const N = 800;
    const ts: number[] = [], ys: number[] = [];
    const wd = wn * Math.sqrt(Math.max(0, 1 - zeta * zeta));
    const phi = Math.acos(Math.min(1, Math.max(-1, zeta)));
    for (let i = 0; i <= N; i++) {
      const t = (duration * i) / N;
      ts.push(t);
      let y: number;
      if (zeta < 1) {
        y = 1 - (Math.exp(-zeta * wn * t) / Math.sqrt(1 - zeta * zeta)) * Math.sin(wd * t + phi);
      } else if (Math.abs(zeta - 1) < 1e-9) {
        y = 1 - (1 + wn * t) * Math.exp(-wn * t);
      } else {
        const sz = Math.sqrt(zeta * zeta - 1);
        const p1 = (-zeta + sz) * wn, p2 = (-zeta - sz) * wn;
        y = 1 + (p2 / (p1 - p2)) * Math.exp(p1 * t) + (p1 / (p2 - p1)) * Math.exp(p2 * t);
      }
      ys.push(y);
    }
    return { ts, ys };
  }, [wn, zeta, duration]);

  const idxRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 880, H = 560;

  const ind = useMemo(() => {
    const os = zeta < 1 ? Math.exp((-Math.PI * zeta) / Math.sqrt(1 - zeta * zeta)) : 0;
    const tp = zeta < 1 ? Math.PI / (wn * Math.sqrt(1 - zeta * zeta)) : NaN;
    const ts02 = zeta > 0.02 ? -Math.log(0.02 * Math.sqrt(1 - Math.min(0.99, zeta) ** 2)) / (zeta * wn) : NaN;
    const beta = zeta < 1 ? Math.atan(Math.sqrt(1 - zeta * zeta) / Math.max(1e-9, zeta)) : 0;
    const wd = wn * Math.sqrt(Math.max(0, 1 - zeta * zeta));
    const tr = zeta < 1 && wd > 0 ? (Math.PI - beta) / wd : NaN;
    return { os, tp, ts02, tr, wd, pole: { re: -zeta * wn, im: wd } };
  }, [wn, zeta]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = W * dpr; c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    let curY = 0, curT = loop.t;
    {
      const ts = sim.ts, ys = sim.ys;
      let lo = 0, hi = ts.length - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ts[m] <= loop.t) lo = m; else hi = m; }
      const f = (loop.t - ts[lo]) / (ts[hi] - ts[lo]);
      idxRef.current = lo;
      curY = ys[lo] + f * (ys[hi] - ys[lo]);
      curT = loop.t;
    }

    // ---------- 左侧：质量-弹簧-阻尼机构动画 ----------
    const mx = 30, mw = 260, mh = 300;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(mx, 14, mw, mh, 12);
    ctx.fillStyle = 'rgba(2,6,23,0.45)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(148,163,184,0.2)';
    ctx.stroke();
    ctx.restore();
    drawLabel(ctx, mx + 12, 32, '质量-弹簧-阻尼系统', COLORS.slate, 12, 'sans');

    const baseY = 250;
    const wallX = mx + 24;
    const massW = 62, massH = 52;
    const restX = 130;               // 平衡位置（质量块左沿）
    const ampPx = 46;                // 最大位移像素
    const disp = Math.max(-1.6, Math.min(1.6, (curY - 1))) * ampPx; // y-1 映射为位移
    const massX = restX + disp;

    // 墙壁
    ctx.fillStyle = 'rgba(148,163,184,0.4)';
    ctx.fillRect(wallX - 8, baseY - 60, 6, 120);
    // 地面
    ctx.strokeStyle = 'rgba(148,163,184,0.3)';
    ctx.beginPath();
    ctx.moveTo(mx + 16, baseY + 34);
    ctx.lineTo(mx + mw - 16, baseY + 34);
    ctx.stroke();
    for (let i = 0; i < 9; i++) {
      const gx = mx + 20 + i * 26;
      ctx.beginPath();
      ctx.moveTo(gx, baseY + 34); ctx.lineTo(gx - 6, baseY + 41);
      ctx.stroke();
    }
    // 弹簧与阻尼器（上端固定于墙，下端接质量块顶部两侧）
    drawSpring(ctx, wallX, baseY - 84, massX + 12, COLORS.cyan, 7, 7);
    drawLabel(ctx, wallX + 26, baseY - 100, 'k·x', COLORS.cyan, 10);
    drawDamper(ctx, wallX, baseY - 46, massX + 12, COLORS.violet);
    drawLabel(ctx, wallX + 30, baseY - 30, 'c·ẋ', COLORS.violet, 10);
    // 质量块 m
    drawMass(ctx, massX, baseY - 26, massW, massH, 'rgba(59,130,246,0.75)', 'm');
    // 位移箭头
    if (Math.abs(disp) > 2) {
      drawArrow(ctx, massX + massW / 2, baseY + 2, massX + massW / 2 + disp * 0.8, baseY + 2, COLORS.amber, 2);
    }
    drawLabel(ctx, massX + massW / 2, baseY + 16, `x = ${(curY - 1 >= 0 ? '+' : '')}${(curY - 1).toFixed(2)}`, COLORS.amber, 10, 'mono', 'center');
    // 目标线
    drawDashedLine(ctx, restX, baseY - 34, restX, baseY + 30, 'rgba(226,232,240,0.35)');
    drawLabel(ctx, restX, baseY + 44, '目标位置', COLORS.slate, 9, 'sans', 'center');

    // 阻尼状态说明
    const zl = zeta < 1 ? '欠阻尼 ζ<1：振荡衰减' : Math.abs(zeta - 1) < 0.02 ? '临界阻尼 ζ=1：最快无超调' : '过阻尼 ζ>1：缓慢无超调';
    drawChip(ctx, mx + 16, 46, zl, 'rgba(34,211,238,0.1)', COLORS.cyan, 10);

    // ---------- 右侧：阶跃响应曲线 ----------
    const off = mx + mw + 14;
    ctx.save();
    ctx.translate(off, 0);
    const regR = plotAxes(ctx, W - off, H, {
      xMin: 0, xMax: duration, yMin: -0.15, yMax: 1 + Math.max(0.35, ind.os * 1.25),
      xTicks: 8, yTicks: 4, xLabel: '时间 t (s)', yLabel: 'h(t)',
      bgColor: 'rgba(2,6,23,0.4)',
    });
    const drawn = idxRef.current;
    // 包络线
    if (zeta < 1 && zeta > 0) {
      const env = sim.ts.map(t => 1 + Math.exp(-zeta * wn * t) / Math.sqrt(1 - zeta * zeta));
      const env2 = sim.ts.map(t => 1 - Math.exp(-zeta * wn * t) / Math.sqrt(1 - zeta * zeta));
      drawPolyline(ctx, regR, sim.ts, env, 'rgba(251,191,36,0.4)', 1.2, undefined, [4, 4]);
      drawPolyline(ctx, regR, sim.ts, env2, 'rgba(251,191,36,0.4)', 1.2, undefined, [4, 4]);
      drawLabel(ctx, regR.padL + regR.plotW - 8, pxY(regR, 1 + 1 / Math.sqrt(1 - zeta * zeta) * 0.9), '包络线 e^(−ζωn·t)', 'rgba(251,191,36,0.6)', 10, 'sans', 'right');
    }
    // 目标值 1
    drawDashedLine(ctx, regR.padL, pxY(regR, 1), regR.padL + regR.plotW, pxY(regR, 1), 'rgba(148,163,184,0.45)');
    // ±2% 误差带
    drawDashedLine(ctx, regR.padL, pxY(regR, 0.98), regR.padL + regR.plotW, pxY(regR, 0.98), 'rgba(52,211,153,0.3)', [3, 5]);
    drawDashedLine(ctx, regR.padL, pxY(regR, 1.02), regR.padL + regR.plotW, pxY(regR, 1.02), 'rgba(52,211,153,0.3)', [3, 5]);

    fillUnderCurve(ctx, regR, sim.ts, sim.ys, COLORS.cyan, drawn + 1);
    drawPolyline(ctx, regR, sim.ts, sim.ys, COLORS.cyan, 2.4, drawn + 1);

    // 指标标注
    if (zeta < 1 && ind.os > 0.001) {
      const peakIdx = sim.ys.findIndex(v => v >= 1 + ind.os * 0.999);
      if (peakIdx > 0) {
        const px = pxX(regR, sim.ts[peakIdx]), py = pxY(regR, sim.ys[peakIdx]);
        drawDot(ctx, px, py, 4.5, COLORS.amber);
        drawDashedLine(ctx, px, py, px, pxY(regR, 1), 'rgba(251,191,36,0.5)');
        drawChip(ctx, Math.min(px + 6, regR.padL + regR.plotW - 96), py - 8, `σ%=${(ind.os * 100).toFixed(1)}%`, 'rgba(251,191,36,0.12)', COLORS.amber, 10);
      }
    }
    if (isFinite(ind.ts02) && ind.ts02 < duration) {
      const x = pxX(regR, ind.ts02);
      drawDashedLine(ctx, x, regR.padT, x, regR.padT + regR.plotH, 'rgba(52,211,153,0.5)');
      drawChip(ctx, Math.min(x + 4, regR.padL + regR.plotW - 70), regR.padT + 16, `ts=${ind.ts02.toFixed(2)}s`, 'rgba(52,211,153,0.12)', COLORS.green, 10);
    }
    // 运动光点
    drawDot(ctx, pxX(regR, curT), pxY(regR, curY), 5.5, COLORS.cyan);
    ctx.restore();
  }, [loop.t, loop.cycle, wn, zeta, sim, ind, duration]);

  const steps: CalcStep[] = useMemo(() => {
    const t = Math.min(loop.t, duration);
    const idx = idxRef.current;
    const y = sim.ys[Math.min(idx, sim.ys.length - 1)] ?? 0;
    const steps: CalcStep[] = [
      { title: '标准二阶闭环传递函数', formula: 'Φ(s) = ωn² / (s² + 2ζωn·s + ωn²)', substitution: `ωn = ${wn.toFixed(2)} rad/s, ζ = ${zeta.toFixed(2)}` },
      { title: '闭环极点（特征根）', formula: 's₁,₂ = −ζωn ± jωn·√(1−ζ²)', substitution: `= ${ind.pole.re.toFixed(3)} ± j${ind.pole.im.toFixed(3)}`, note: zeta < 1 ? '共轭复根 → 振荡衰减' : '实根 → 无振荡' },
    ];
    if (zeta < 1) {
      steps.push(
        { title: '有阻尼振荡频率', formula: 'ωd = ωn·√(1−ζ²)', substitution: `√(1−${zeta.toFixed(2)}²) = ${Math.sqrt(1 - Math.min(1, zeta * zeta)).toFixed(4)}`, result: `${ind.wd.toFixed(3)} rad/s` },
        { title: '超调量', formula: 'σ% = e^(−πζ/√(1−ζ²)) × 100%', substitution: `e^(−π×${zeta.toFixed(2)}/${Math.sqrt(1 - Math.min(1, zeta * zeta)).toFixed(3)})`, result: `${(ind.os * 100).toFixed(2)} %` },
        { title: '峰值时间 tp / 调节时间 ts(2%)', formula: `tp = π/ωd = ${isFinite(ind.tp) ? ind.tp.toFixed(2) : '—'} s,  ts ≈ 4/(ζωn) = ${isFinite(ind.ts02) ? ind.ts02.toFixed(2) : '—'} s` },
        { title: `当前时刻 t = ${t.toFixed(2)} s 的响应`, formula: 'h(t) = 1 − e^(−ζωn·t)/√(1−ζ²) · sin(ωd·t + β)', substitution: `h(${t.toFixed(2)}) = ${y.toFixed(4)}` },
      );
    } else {
      steps.push(
        { title: `当前时刻 t = ${t.toFixed(2)} s 的响应`, formula: zeta === 1 ? 'h(t) = 1 − (1 + ωn·t)·e^(−ωn·t)' : 'h(t) = 1 + (p₂/(p₁−p₂))e^(p₁t) + (p₁/(p₂−p₁))e^(p₂t)', substitution: `h(${t.toFixed(2)}) = ${y.toFixed(4)}` },
        { title: '过阻尼/临界阻尼特性', formula: 'σ% = 0（无超调）', note: '调节时间由较慢的极点主导' },
      );
    }
    return steps;
  }, [loop.t, wn, zeta, ind, sim, duration]);

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
          <div className="glass-card rounded-2xl p-5 space-y-5">
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500" /> 参数调节
            </div>
            <SliderControl label="自然频率 ωn" value={wn} min={0.5} max={8} step={0.1} unit="rad/s" onChange={setWn} />
            <SliderControl label="阻尼比 ζ" value={zeta} min={0} max={1.5} step={0.01} onChange={setZeta}
              format={v => v.toFixed(2)} />
            <div className="text-[11px] leading-relaxed text-slate-500 rounded-xl bg-slate-900/60 border border-white/5 p-3">
              拖动 ζ 观察三种状态：<span className="text-cyan-300">ζ&lt;1 欠阻尼振荡</span>、
              <span className="text-emerald-300">ζ=1 临界阻尼</span>、
              <span className="text-violet-300">ζ&gt;1 过阻尼</span>。
              左侧机构动画中质量块的位移即响应 h(t)−1。
            </div>
          </div>
          <MetricGrid items={[
            { k: '超调量 σ%', v: `${(ind.os * 100).toFixed(1)}%`, tone: 'amber' },
            { k: '调节时间 ts (2%)', v: isFinite(ind.ts02) ? `${ind.ts02.toFixed(2)}s` : '—', tone: 'green' },
            { k: '上升时间 tr', v: isFinite(ind.tr) ? `${ind.tr.toFixed(2)}s` : '—', tone: 'cyan' },
            { k: '峰值时间 tp', v: isFinite(ind.tp) ? `${ind.tp.toFixed(2)}s` : '—', tone: 'cyan' },
            { k: '闭环极点', v: `${ind.pole.re.toFixed(2)}±${ind.pole.im.toFixed(2)}j`, tone: 'rose' },
            { k: '阻尼振荡频率 ωd', v: isFinite(ind.wd) && ind.wd > 0 ? `${ind.wd.toFixed(2)}` : '0', tone: 'violet' },
          ]} />
          <SaveRecordButton
            simulationId="lab-second-order"
            params={{ wn, zeta }}
            metrics={{ 超调量: `${(ind.os * 100).toFixed(2)}%`, 调节时间: isFinite(ind.ts02) ? `${ind.ts02.toFixed(2)}s` : '∞' }}
          />
        </div>
        <div className="lg:col-span-8">
          <CalcProcess steps={steps} />
        </div>
      </div>
    </div>
  );
}
