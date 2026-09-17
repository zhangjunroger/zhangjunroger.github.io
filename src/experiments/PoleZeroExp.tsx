import { useEffect, useMemo, useRef, useState } from 'react';
import { useSimLoop } from '@/experiments/useSimLoop';
import {
  plotAxes, pxX, pxY, drawPolyline, drawDot, drawDashedLine, drawLabel,
  drawChip, drawPoleZero, panelTitle, COLORS,
} from '@/experiments/drawKit';
import { SliderControl, MetricGrid, PlayBar, CalcProcess, SimPanel, SaveRecordButton, TheoryCard } from '@/components/labs/LabUI';
import type { CalcStep } from '@/components/labs/LabUI';

// ================================================================
// 实验三：极点位置与响应形态探索器（可拖拽共轭极点）
// ================================================================
export function PoleZeroExp() {
  // 共轭极对: s = σ ± jωd
  const [sigma, setSigma] = useState(-0.8);   // 实部
  const [omegad, setOmegad] = useState(2.4);  // 虚部
  const duration = 10;
  const loop = useSimLoop({ duration });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 880, H = 520;
  const dragRef = useRef<null | { which: 1 | 2 }>(null);

  // 由极点计算系统 G(s) = ωn²/(s² − 2σs + σ²+ωd²) 的阶跃响应（单位增益稳态=1）
  const sim = useMemo(() => {
    const wn2 = sigma * sigma + omegad * omegad;
    const wn = Math.sqrt(wn2);
    const zeta = Math.abs(omegad) < 1e-6 ? 1 : -sigma / wn;
    const N = 800;
    const ts: number[] = [], ys: number[] = [];
    const wd = omegad;
    const alpha = -sigma; // 衰减系数
    const phi = zeta < 1 ? Math.acos(Math.min(1, Math.max(-1, zeta))) : 0;
    for (let i = 0; i <= N; i++) {
      const t = (duration * i) / N;
      ts.push(t);
      let y: number;
      if (wd > 1e-6) {
        // 标准式: 1 − e^{σt}·(ωn/ωd)·sin(ωd t + φ)
        y = 1 - Math.exp(sigma * t) * (wn / Math.max(wd, 1e-9)) * Math.sin(wd * t + phi);
      } else {
        y = 1 - Math.exp(sigma * t) * (1 + alpha * t);
      }
      ys.push(y);
    }
    return { ts, ys, wn, zeta: Math.min(1, zeta) };
  }, [sigma, omegad, duration]);

  // 画布坐标换算
  const plane = useMemo(() => ({
    cx: 250, cy: H / 2 - 10,
    sx: 34, sy: 30,   // 每单位实部/虚部的像素
  }), []);

  const toRe = (x: number) => (x - plane.cx) / plane.sx;
  const toIm = (y: number) => (plane.cy - y) / plane.sy;

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = W * dpr; c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // ---------- 左侧：s 平面 ----------
    const pl = plane;
    // 面板背景
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(14, 14, 472, H - 28, 12);
    ctx.fillStyle = 'rgba(2,6,23,0.45)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(148,163,184,0.2)';
    ctx.stroke();
    ctx.restore();
    panelTitle(ctx, W, '① s 平面（拖动 × 改变极点位置）');

    // 网格
    ctx.save();
    ctx.beginPath();
    ctx.rect(20, 40, 460, H - 60);
    ctx.clip();
    ctx.strokeStyle = 'rgba(148,163,184,0.07)';
    for (let i = -6; i <= 6; i++) {
      const x = pl.cx + i * pl.sx;
      ctx.beginPath(); ctx.moveTo(x, 40); ctx.lineTo(x, H - 20); ctx.stroke();
      const y = pl.cy - i * pl.sy;
      ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(480, y); ctx.stroke();
    }
    // 等ζ射线（阻尼角）
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(251,191,36,0.25)';
    for (const z of [0.3, 0.5, 0.707, 0.9]) {
      const ang = Math.acos(z);
      ctx.beginPath();
      ctx.moveTo(pl.cx, pl.cy);
      ctx.lineTo(pl.cx - 8 * pl.sx * Math.sin(ang) / Math.max(0.2, z) * 0.6, pl.cy - 8 * pl.sy * Math.cos(ang) * 0.6 * 0);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // 实轴虚轴
    ctx.strokeStyle = 'rgba(226,232,240,0.45)';
    ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(20, pl.cy); ctx.lineTo(480, pl.cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pl.cx, 40); ctx.lineTo(pl.cx, H - 20); ctx.stroke();
    // 稳定区标注
    ctx.fillStyle = 'rgba(52,211,153,0.07)';
    ctx.fillRect(20, 40, pl.cx - 20, H - 60);
    drawLabel(ctx, 34, 52, '稳定区 (σ<0)', 'rgba(52,211,153,0.75)', 11, 'sans');
    drawLabel(ctx, 466, 52, '不稳定区 (σ>0)', 'rgba(251,113,133,0.75)', 11, 'sans', 'right');
    drawLabel(ctx, 474, pl.cy - 10, 'jω', COLORS.slate, 11, 'mono', 'right');
    drawLabel(ctx, pl.cx + 6, H - 26, 'σ', COLORS.slate, 11, 'mono');
    // 等ωn圆
    ctx.strokeStyle = 'rgba(167,139,250,0.2)';
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.arc(pl.cx, pl.cy, sim.wn * pl.sx * 0.86, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // 极点（共轭对，可拖拽）
    const p1x = pl.cx + sigma * pl.sx, p1y = pl.cy - omegad * pl.sy;
    const p2x = p1x, p2y = pl.cy + omegad * pl.sy;
    const stable = sigma < 0;
    const poleColor = stable ? COLORS.rose : COLORS.orange;
    drawPoleZero(ctx, p1x, p1y, 'pole', poleColor, 9, true);
    if (omegad > 0.05) drawPoleZero(ctx, p2x, p2y, 'pole', poleColor, 9, true);
    drawChip(ctx, p1x + 14, p1y - 4, `${sigma.toFixed(2)} ± j${omegad.toFixed(2)}`, 'rgba(15,23,42,0.9)', poleColor, 11);

    // ---------- 右侧：对应时域响应 ----------
    const off = 500;
    ctx.save();
    ctx.translate(off, 0);
    const reg = plotAxes(ctx, W - off, H, {
      xMin: 0, xMax: duration, yMin: -0.4, yMax: 2.1,
      xTicks: 5, yTicks: 4, xLabel: '时间 t (s)', yLabel: 'h(t)',
      bgColor: 'rgba(2,6,23,0.4)',
    });
    // 衰减包络
    if (Math.abs(omegad) > 1e-6 && sigma < 0) {
      const envUp = sim.ts.map(t => 1 + Math.exp(sigma * t) * (sim.wn / Math.max(omegad, 1e-9)));
      const envDn = sim.ts.map(t => 1 - Math.exp(sigma * t) * (sim.wn / Math.max(omegad, 1e-9)));
      drawPolyline(ctx, reg, sim.ts, envUp, 'rgba(251,191,36,0.35)', 1.2, undefined, [4, 4]);
      drawPolyline(ctx, reg, sim.ts, envDn, 'rgba(251,191,36,0.35)', 1.2, undefined, [4, 4]);
    }
    drawDashedLine(ctx, reg.padL, pxY(reg, 1), reg.padL + reg.plotW, pxY(reg, 1), 'rgba(148,163,184,0.45)');
    // 采样绘制到当前 t
    const ts = sim.ts, ys = sim.ys;
    let lo = 0, hi = ts.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ts[m] <= loop.t) lo = m; else hi = m; }
    const drawn = lo;
    drawPolyline(ctx, reg, ts, ys, COLORS.cyan, 2.4, drawn + 1);
    // 光点
    const f = (loop.t - ts[lo]) / (ts[hi] - ts[lo]);
    const curY = ys[lo] + f * (ys[hi] - ys[lo]);
    drawDot(ctx, pxX(reg, loop.t), pxY(reg, curY), 5.5, COLORS.cyan);
    // 模式说明
    const mode = sigma >= 0
      ? (omegad > 0.05 ? 'σ>0：发散振荡（不稳定）' : 'σ>0：单调发散（不稳定）')
      : omegad > 0.05 ? 'σ<0, ωd≠0：衰减振荡' : 'σ<0, ωd=0：无振荡衰减';
    drawChip(ctx, reg.padL + 8, reg.padT + 14, mode, 'rgba(15,23,42,0.85)', stable ? COLORS.cyan : COLORS.orange, 11);
    ctx.restore();
  }, [loop.t, loop.cycle, sigma, omegad, sim, plane, W, H]);

  // 拖拽交互
  const onPointer = (e: React.PointerEvent<HTMLCanvasElement>, isDown: boolean, isMove: boolean) => {
    const c = canvasRef.current;
    if (!c) return;
    const rect = c.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    const y = ((e.clientY - rect.top) / rect.height) * H;
    const pl = plane;
    const p1x = pl.cx + sigma * pl.sx, p1y = pl.cy - omegad * pl.sy;
    if (isDown) {
      const d1 = Math.hypot(x - p1x, y - p1y);
      const d2 = Math.hypot(x - p1x, y - (pl.cy + omegad * pl.sy));
      if (d1 < 22) dragRef.current = { which: 1 };
      else if (d2 < 22 && omegad > 0.05) dragRef.current = { which: 2 };
      else return;
      c.setPointerCapture(e.pointerId);
    }
    if ((isMove || isDown) && dragRef.current) {
      const re = Math.max(-6, Math.min(1.5, toRe(x)));
      const im = Math.max(0, Math.abs(toIm(y)));
      setSigma(Math.round(re * 20) / 20);
      setOmegad(Math.round(im * 20) / 20);
    }
  };

  const steps: CalcStep[] = useMemo(() => {
    const wn = sim.wn;
    return [
      { title: '闭环极点位置（拖动左侧 × 即时改变）', formula: `s₁,₂ = ${sigma.toFixed(2)} ± j${omegad.toFixed(2)}`, note: '极点实部 σ 决定衰减快慢，虚部 ωd 决定振荡频率' },
      { title: '对应自然频率与阻尼比', formula: 'ωn = √(σ²+ωd²),  ζ = −σ/ωn', substitution: `ωn = √(${(sigma * sigma).toFixed(2)}+${(omegad * omegad).toFixed(2)}) = ${wn.toFixed(3)}, ζ = ${sim.zeta.toFixed(3)}` },
      { title: '时域响应通式', formula: 'h(t) = 1 − (ωn/ωd)·e^(σt)·sin(ωd·t + β)', substitution: `e^(σ·t) = e^(${sigma.toFixed(2)}·t)`, note: 'σ<0 时 e^(σt)→0 收敛；σ>0 发散' },
      { title: '结论', formula: sigma >= 0 ? '极点在右半平面 → 系统不稳定' : '极点在左半平面 → 系统稳定', note: '离虚轴越远（|σ|越大）衰减越快；ωd/|σ| 越大振荡越强' },
    ];
  }, [sigma, omegad, sim]);

  return (
    <div className="space-y-5">
      <SimPanel>
        <canvas
          ref={canvasRef}
          className="w-full h-auto rounded-xl touch-none cursor-crosshair"
          style={{ aspectRatio: `${W}/${H}` }}
          onPointerDown={(e) => onPointer(e, true, false)}
          onPointerMove={(e) => onPointer(e, false, true)}
          onPointerUp={() => { dragRef.current = null; }}
        />
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
              <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500" /> 极点位置
            </div>
            <SliderControl label="实部 σ（衰减系数）" value={sigma} min={-6} max={1.5} step={0.05} onChange={setSigma} />
            <SliderControl label="虚部 ωd（振荡频率）" value={omegad} min={0} max={5} step={0.05} unit="rad/s" onChange={setOmegad} />
            <div className="text-[11px] leading-relaxed text-slate-500 rounded-xl bg-slate-900/60 border border-white/5 p-3">
              直接在左侧 s 平面上<span className="text-cyan-300">按住 × 拖动</span>，观察极点穿越虚轴瞬间响应从衰减变为发散。
            </div>
          </div>
          <MetricGrid items={[
            { k: '自然频率 ωn', v: sim.wn.toFixed(3), tone: 'cyan' },
            { k: '阻尼比 ζ', v: sim.zeta.toFixed(3), tone: 'violet' },
            { k: '衰减系数 |σ|', v: Math.abs(sigma).toFixed(2), tone: 'amber' },
            { k: '稳定性', v: sigma < 0 ? '稳定 ✓' : '不稳定 ✗', tone: sigma < 0 ? 'green' : 'rose' },
          ]} />
          <SaveRecordButton
            simulationId="lab-pole-zero"
            params={{ sigma, omegad }}
            metrics={{ 极点: `${sigma.toFixed(2)}±${omegad.toFixed(2)}j`, 稳定性: sigma < 0 ? '稳定' : '不稳定' }}
          />
        </div>
        <div className="lg:col-span-8 space-y-4">
          <CalcProcess steps={steps} />
          <TheoryCard title="为什么极点决定一切？" defaultOpen={false}>
            <p>
              系统的零输入响应由各极点项 <code className="text-cyan-300">e^(sᵢt)</code> 线性组合构成。
              极点实部 σ 是指数的衰减率：σ &lt; 0 时随时间衰减到 0（稳定），σ &gt; 0 时无限增长（不稳定）。
              虚部 ωd 是振荡角频率：ωd 越大振荡越快。极限情况 ωd = 0 时响应单调无振荡。
            </p>
            <p>
              因此设计控制器本质上就是<span className="text-amber-300">把闭环极点配置到 s 左半平面的合适位置</span>——
              这正是根轨迹法与状态反馈极点配置的核心思想。
            </p>
          </TheoryCard>
        </div>
      </div>
    </div>
  );
}
