import { useEffect, useMemo, useRef, useState } from 'react';
import { useSimLoop } from '@/experiments/useSimLoop';
import {
  plotAxes, pxX, pxY, drawPolyline, drawDot, drawDashedLine, drawLabel,
  drawChip, panelTitle, drawPoleZero, drawArrow, COLORS,
} from '@/experiments/drawKit';
import { SliderControl, MetricGrid, PlayBar, CalcProcess, SimPanel, SaveRecordButton } from '@/components/labs/LabUI';
import type { CalcStep } from '@/components/labs/LabUI';
import { tfNormalize, tfEval, polyRoots, polyAdd, tf2ss, simulateSS, phasePlaneSim, discretizeZOH, discreteClosedLoopStep, cabs, C, type Tf, type NonlinKind } from '@/utils/labsim';

// ================================================================
// 实验八：系统型别与稳态误差（三种输入 × 三种型别 全对照）
// ================================================================
export function SteadyErrorExp() {
  const [nu, setNu] = useState(1);        // 系统型别
  const [K, setK] = useState(2);          // 开环增益
  const [input, setInput] = useState<'step' | 'ramp' | 'para'>('step');
  const duration = 14;
  const loop = useSimLoop({ duration });

  const tf = useMemo(() => {
    let den = [1, 1];       // (s+1)
    for (let i = 0; i < nu; i++) den = [...den, 0];  // 乘 s^ν
    return tfNormalize({ num: [K], den });
  }, [nu, K]);

  const sim = useMemo(() => {
    // 闭环: Φ(s) = K / [ s^ν(s+1) + K ]，用引擎状态空间仿真
    const n = tf.den.length;
    const numPad = new Array(n).fill(0);
    numPad[n - 1] = K;
    const denCl = tf.den.map((v, i) => v + numPad[i]);
    const ss = tf2ss({ num: [K], den: denCl });
    const rFn = (t: number) => input === 'step' ? 1 : input === 'ramp' ? 0.5 * t : 0.25 * t * t;
    const res = simulateSS(ss, rFn, duration, 700);
    const N = res.t.length;
    const r: number[] = [];
    for (let i = 0; i < N; i++) r.push(rFn(res.t[i]));
    return { ts: res.t, y: res.y, r };
  }, [tf, K, nu, input, duration]);

  // 误差系数与理论 ess
  const theory = useMemo(() => {
    const eps = 1e-7;
    const G0 = tfEval(tf, C(eps, 0));
    const g0 = cabs(G0);
    const Kp = nu >= 1 ? Infinity : g0;
    const Kv = nu >= 2 ? Infinity : nu === 0 ? 0 : cabs(tfEval(tf, C(eps, 0))) / 1;
    // 更精确: Kv = lim s→0 s·G(s)
    const Kv2 = nu >= 2 ? Infinity : nu === 0 ? 0 : cabs(tfEval({ num: tf.num.map(v => v * eps), den: tf.den }, C(eps, 0)));
    const Ka = nu >= 3 ? Infinity : nu <= 1 ? 0 : cabs(tfEval({ num: tf.num.map(v => v * eps * eps), den: tf.den }, C(eps, 0)));
    const essOf: Record<string, number> = {
      step: nu >= 1 ? 0 : 1 / (1 + g0),
      ramp: nu >= 2 ? 0 : nu === 0 ? Infinity : 0.5 / Kv2,
      para: nu >= 3 ? 0 : nu <= 1 ? Infinity : 0.5 / Ka,
    };
    return { Kp, Kv: Kv2, Ka, essOf };
  }, [tf, nu, K]);

  const essNow = theory.essOf[input];

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 880, H = 540;

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = W * dpr; c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const yMax = input === 'step' ? 1.6 : input === 'ramp' ? duration * 0.5 * 1.25 : 0.25 * duration * duration * 1.25;
    const reg = plotAxes(ctx, W, H, {
      xMin: 0, xMax: duration, yMin: -0.2, yMax,
      xTicks: 7, yTicks: 5, xLabel: '时间 t (s)', yLabel: input === 'step' ? 'r(t) / y(t)' : '幅值',
      bgColor: 'rgba(2,6,23,0.4)',
    });
    const { ts, r, y } = sim;
    const upto = Math.max(2, Math.floor((loop.t / duration) * ts.length));

    // 输入 r(t) 虚线
    drawPolyline(ctx, reg, ts.slice(0, upto), r.slice(0, upto), 'rgba(148,163,184,0.7)', 1.8, undefined, [6, 4]);
    // 输出 y(t)
    drawPolyline(ctx, reg, ts.slice(0, upto), y.slice(0, upto), COLORS.cyan, 2.6);
    // 误差带（r 与 y 之间的区域填充红色）
    ctx.save();
    ctx.beginPath();
    ctx.rect(reg.padL, reg.padT, reg.plotW, reg.plotH);
    ctx.clip();
    ctx.beginPath();
    for (let i = 0; i < upto; i++) {
      const X = pxX(reg, ts[i]), Y = pxY(reg, r[i]);
      if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    }
    for (let i = upto - 1; i >= 0; i--) {
      ctx.lineTo(pxX(reg, ts[i]), pxY(reg, y[i]));
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(251,113,133,0.18)';
    ctx.fill();
    ctx.restore();

    // 输入说明
    const inLabel = input === 'step' ? '阶跃输入 r(t)=1(t)' : input === 'ramp' ? '斜坡输入 r(t)=0.5t' : '抛物线输入 r(t)=0.25t²';
    drawChip(ctx, reg.padL + 10, reg.padT + 14, inLabel, 'rgba(148,163,184,0.12)', COLORS.slate, 11);
    // 稳态误差标注
    if (isFinite(essNow)) {
      const late = Math.floor(ts.length * 0.92);
      const gap = Math.abs(r[late] - y[late]);
      const yMid = (r[late] + y[late]) / 2;
      drawArrow(ctx, pxX(reg, ts[late]) + 40, pxY(reg, yMid), pxX(reg, ts[late]) + 2, pxY(reg, yMid), COLORS.rose, 1.6);
      drawChip(ctx, Math.min(pxX(reg, ts[late]) + 46, W - 130), pxY(reg, yMid), `ess ≈ ${essNow === 0 ? '0' : gap.toFixed(3)}`, 'rgba(251,113,133,0.12)', COLORS.rose, 11);
    } else {
      drawChip(ctx, W / 2 - 60, reg.padT + 40, '误差持续增大 → 系统型别不足！', 'rgba(251,113,133,0.15)', COLORS.rose, 12);
    }
    // 图例
    drawChip(ctx, W - 220, reg.padT + 14, '— 输出 y(t)', 'rgba(34,211,238,0.12)', COLORS.cyan, 11);
    drawChip(ctx, W - 130, reg.padT + 14, '--- 输入 r(t)', 'rgba(148,163,184,0.12)', COLORS.slate, 11);
  }, [loop.t, loop.cycle, sim, input, essNow, duration, W, H]);

  const fmtInf = (v: number) => !isFinite(v) ? '∞' : v.toFixed(3);

  const steps: CalcStep[] = [
    { title: '开环传递函数', formula: `G(s) = K / [ s^${nu} (s+1) ]`, substitution: `K = ${K}, ν = ${nu} → ${nu} 型系统` },
    { title: '误差传递函数', formula: 'E(s)/R(s) = 1 / (1 + G(s))' },
    { title: '稳态误差（终值定理）', formula: 'ess = lim s→0 · s·R(s) / (1 + G(s))' },
    {
      title: input === 'step' ? '阶跃输入: ess = A/(1+Kp)' : input === 'ramp' ? '斜坡输入: ess = A/Kv' : '抛物线输入: ess = A/Ka',
      formula: input === 'step'
        ? `ess = 1/(1 + ${nu >= 1 ? '∞' : K}) = ${fmtInf(theory.essOf.step)}`
        : input === 'ramp'
          ? `ess = 0.5/Kv = 0.5/${nu >= 2 ? '∞' : nu === 0 ? '0' : K} = ${fmtInf(theory.essOf.ramp)}`
          : `ess = 0.5/Ka = 0.5/${nu >= 3 ? '∞' : nu <= 1 ? '0' : K} = ${fmtInf(theory.essOf.para)}`,
      note: `Kp=${fmtInf(theory.Kp)}, Kv=${fmtInf(theory.Kv)}, Ka=${fmtInf(theory.Ka)}`,
      active: true,
    },
    { title: '规律总结', formula: '输入含有的 s^k 因子须被系统型别 ν 覆盖，否则 ess=∞', note: 'ν ≥ k 时静态误差为有限值；ν ≥ k+1 时为 0。提高型别或增益可减小误差，但会影响稳定性' },
  ];

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
              <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500" /> 系统与输入
            </div>
            <div>
              <div className="text-xs text-slate-300 font-medium mb-2">系统型别（积分环节数 ν）</div>
              <div className="grid grid-cols-3 gap-1.5">
                {[0, 1, 2].map(n => (
                  <button key={n} onClick={() => { setNu(n); loop.replay(); }}
                    className={`py-2 rounded-xl text-xs font-medium border transition ${
                      nu === n ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300' : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-slate-200'
                    }`}>
                    {n} 型
                  </button>
                ))}
              </div>
            </div>
            <SliderControl label="开环增益 K" value={K} min={0.5} max={20} step={0.1} onChange={setK} />
            <div>
              <div className="text-xs text-slate-300 font-medium mb-2">参考输入信号</div>
              <div className="grid grid-cols-3 gap-1.5">
                {([['step', '阶跃'], ['ramp', '斜坡'], ['para', '抛物线']] as const).map(([k, label]) => (
                  <button key={k} onClick={() => { setInput(k); loop.replay(); }}
                    className={`py-2 rounded-xl text-xs font-medium border transition ${
                      input === k ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-slate-200'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <MetricGrid items={[
            { k: '静态位置误差系数 Kp', v: fmtInf(theory.Kp), tone: 'cyan' },
            { k: '静态速度误差系数 Kv', v: fmtInf(theory.Kv), tone: 'cyan' },
            { k: '静态加速度误差系数 Ka', v: fmtInf(theory.Ka), tone: 'cyan' },
            { k: '当前输入的 ess', v: fmtInf(essNow), tone: essNow === 0 ? 'green' : isFinite(essNow) ? 'amber' : 'rose' },
          ]} />
          <SaveRecordButton
            simulationId="lab-steady-error"
            params={{ nu, K }}
            metrics={{ 型别: `${nu}型`, 当前ess: fmtInf(essNow) }}
          />
        </div>
        <div className="lg:col-span-8 space-y-4">
          <CalcProcess steps={steps} title="终值定理求稳态误差" />
          <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
            <p className="font-semibold text-white text-sm mb-3">典型组合 ess 速查表（A=输入系数）</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-white/10">
                  <th className="text-left py-2 font-medium">系统型别</th>
                  <th className="py-2 font-medium">阶跃 A·1(t)</th>
                  <th className="py-2 font-medium">斜坡 A·t</th>
                  <th className="py-2 font-medium">抛物线 A·t²/2</th>
                </tr>
              </thead>
              <tbody className="font-mono text-center">
                <tr className={`border-b border-white/5 ${nu === 0 ? 'bg-cyan-500/5' : ''}`}>
                  <td className="text-left py-2 text-slate-300">0 型 (ν=0)</td>
                  <td className="py-2 text-amber-300">A/(1+K)={fmtInf(1 / (1 + K))}</td>
                  <td className="py-2 text-rose-400">∞</td>
                  <td className="py-2 text-rose-400">∞</td>
                </tr>
                <tr className={`border-b border-white/5 ${nu === 1 ? 'bg-cyan-500/5' : ''}`}>
                  <td className="text-left py-2 text-slate-300">I 型 (ν=1)</td>
                  <td className="py-2 text-emerald-300">0</td>
                  <td className="py-2 text-amber-300">A/K={fmtInf(0.5 / K)}</td>
                  <td className="py-2 text-rose-400">∞</td>
                </tr>
                <tr className={nu === 2 ? 'bg-cyan-500/5' : ''}>
                  <td className="text-left py-2 text-slate-300">II 型 (ν=2)</td>
                  <td className="py-2 text-emerald-300">0</td>
                  <td className="py-2 text-emerald-300">0</td>
                  <td className="py-2 text-amber-300">A/K={fmtInf(0.5 / K)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ================================================================
// 实验九：非线性系统相平面（饱和/死区/继电/滞环 → 极限环）
// ================================================================
export function NonlinearExp() {
  const [kind, setKind] = useState<NonlinKind>('hysteresis');
  const [wn, setWn] = useState(1);
  const [zeta, setZeta] = useState(0.05);
  const [limit, setLimit] = useState(0.6);
  const [dead, setDead] = useState(0.25);
  const [x0, setX0] = useState(2.2);

  const sim = useMemo(() => phasePlaneSim(kind, wn, zeta, limit, dead, x0, 0, 30, 6000), [kind, wn, zeta, limit, dead, x0]);
  const duration = 30;
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

    const { xs, vs } = sim;
    const drawnN = Math.max(2, Math.floor((loop.t / duration) * xs.length));
    const xRange = Math.max(2.6, Math.abs(x0) * 1.15);

    // ---------- 左：相平面 ----------
    const pw = 470;
    const sc = (pw - 60) / (2 * xRange);
    const cx = 40 + (pw - 40) / 2, cy = 30 + (H - 70) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(10, 10, pw + 20, H - 20, 12);
    ctx.fillStyle = 'rgba(2,6,23,0.45)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(148,163,184,0.2)';
    ctx.stroke();
    ctx.restore();
    panelTitle(ctx, W, '① 相平面 (x, ẋ) —— 轨迹收敛或形成极限环');

    // 坐标轴
    ctx.strokeStyle = 'rgba(226,232,240,0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(24, cy); ctx.lineTo(pw + 22, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 22); ctx.lineTo(cx, H - 22); ctx.stroke();
    drawLabel(ctx, pw + 8, cy - 10, 'ẋ', COLORS.slate, 12);
    drawLabel(ctx, cx + 8, 26, 'x', COLORS.slate, 12);
    // 刻度
    for (let i = -2; i <= 2; i++) {
      if (i === 0) continue;
      drawLabel(ctx, cx + i * xRange * sc / 2, cy + 12, (i * xRange / 2).toFixed(1), 'rgba(148,163,184,0.6)', 9, 'mono', 'center');
    }

    // 非线性特性示意（右上角小图）
    const nlx = pw - 118, nly = 30, nlw = 100, nlh = 66;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(nlx, nly, nlw, nlh, 8);
    ctx.fillStyle = 'rgba(15,23,42,0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(148,163,184,0.3)';
    ctx.stroke();
    ctx.beginPath();
    const nN = 40;
    for (let i = 0; i <= nN; i++) {
      const xv = -2 + (4 * i) / nN;
      let yv: number;
      if (kind === 'saturation') yv = Math.max(-limit, Math.min(limit, xv)) / 2;
      else if (kind === 'deadzone') yv = Math.abs(xv) <= dead ? 0 : (xv - Math.sign(xv) * dead) / 2;
      else yv = (xv >= 0 ? limit : -limit) / 2;
      const X = nlx + (xv + 2) / 4 * nlw;
      const Y = nly + nlh / 2 - yv / Math.max(limit, 0.1) * (nlh / 2 - 6);
      if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    }
    ctx.strokeStyle = COLORS.violet;
    ctx.lineWidth = 1.8;
    ctx.stroke();
    drawLabel(ctx, nlx + nlw / 2, nly + nlh - 8, '非线性特性 N(x)', 'rgba(148,163,184,0.8)', 8, 'sans', 'center');
    ctx.restore();

    // 完整轨迹（淡）+ 已扫过（亮）
    const tracePath = (n: number, color: string, width: number, alpha: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const X = cx + xs[i] * sc, Y = cy - vs[i] * sc;
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
      ctx.restore();
    };
    tracePath(xs.length, COLORS.violet, 1.2, 0.22);
    tracePath(drawnN, COLORS.cyan, 2.2, 0.9);
    // 轨迹头部光点
    const hx = cx + xs[Math.min(drawnN - 1, xs.length - 1)] * sc;
    const hy = cy - vs[Math.min(drawnN - 1, vs.length - 1)] * sc;
    drawDot(ctx, hx, hy, 6, COLORS.amber);

    // 起点标记
    drawDot(ctx, cx + xs[0] * sc, cy - vs[0] * sc, 4, COLORS.green, false);
    drawLabel(ctx, cx + xs[0] * sc + 8, cy - vs[0] * sc, '起点', COLORS.green, 10, 'sans');

    // 极限环判别（末段振幅 vs 中段）
    const tail = Math.max(...xs.slice(Math.floor(xs.length * 0.8)).map(Math.abs));
    const early = Math.max(...xs.slice(0, Math.floor(xs.length * 0.1)).map(Math.abs));
    const hasCycle = tail > 0.05 && tail > early * 0.55;
    drawChip(ctx, 24, H - 34, hasCycle
      ? `检测到极限环：振幅稳定在 ±${tail.toFixed(2)}（自持振荡）`
      : tail < 0.05 ? '轨迹收敛到原点（系统稳定）' : '轨迹仍在收敛中…',
      hasCycle ? 'rgba(251,191,36,0.12)' : 'rgba(52,211,153,0.12)',
      hasCycle ? COLORS.amber : COLORS.green, 11);

    // ---------- 右：时间响应 ----------
    const off = pw + 42;
    ctx.save();
    ctx.translate(off, 0);
    const reg = plotAxes(ctx, W - off, H, {
      xMin: 0, xMax: duration, yMin: -xRange, yMax: xRange,
      xTicks: 5, yTicks: 4, xLabel: '时间 t (s)', yLabel: 'x(t) 与 ẋ(t)',
      bgColor: 'rgba(2,6,23,0.4)',
    });
    drawDashedLine(ctx, reg.padL, pxY(reg, 0), reg.padL + reg.plotW, pxY(reg, 0), 'rgba(148,163,184,0.4)');
    const upTo2 = Math.max(2, Math.floor((loop.t / duration) * xs.length));
    drawPolyline(ctx, reg, sim.ts.slice(0, upTo2), xs.slice(0, upTo2), COLORS.cyan, 2.2);
    drawPolyline(ctx, reg, sim.ts.slice(0, upTo2), vs.slice(0, upTo2), 'rgba(251,113,133,0.55)', 1.5);
    // 极限环幅值线
    if (hasCycle) {
      drawDashedLine(ctx, reg.padL, pxY(reg, tail), reg.padL + reg.plotW, pxY(reg, tail), 'rgba(251,191,36,0.4)', [4, 4]);
      drawDashedLine(ctx, reg.padL, pxY(reg, -tail), reg.padL + reg.plotW, pxY(reg, -tail), 'rgba(251,191,36,0.4)', [4, 4]);
      drawLabel(ctx, reg.padL + reg.plotW - 6, pxY(reg, tail) - 9, `±${tail.toFixed(2)}`, COLORS.amber, 10, 'mono', 'right');
    }
    drawChip(ctx, reg.padL + 8, reg.padT + 12, '— 位移 x', 'rgba(34,211,238,0.12)', COLORS.cyan, 10);
    drawChip(ctx, reg.padL + 84, reg.padT + 12, '— 速度 ẋ', 'rgba(251,113,133,0.12)', COLORS.rose, 10);
    ctx.restore();
  }, [loop.t, loop.cycle, sim, kind, limit, dead, x0, W, H, duration]);

  const kindLabels: Record<NonlinKind, string> = {
    saturation: '饱和特性',
    deadzone: '死区特性',
    relay: '理想继电',
    hysteresis: '滞环继电',
  };
  const kindNotes: Record<NonlinKind, string> = {
    saturation: '大信号时等效增益下降 → 超调受限制，大初始偏差下收敛变慢但稳定',
    deadzone: '小信号时无输出 → 存在稳态误差平台，响应尾部出现爬行',
    relay: '开关式控制（Bang-Bang）→ 高效率，但抖动与滑动模态',
    hysteresis: '继电带滞环 → 能量不断注入，形成稳定的自持振荡（极限环）',
  };

  const steps: CalcStep[] = [
    { title: '非线性二阶系统方程', formula: 'ẍ + 2ζωn·ẋ + ωn²·N(x) = 0', substitution: `N(x) = ${kindLabels[kind]}, ωn=${wn}, ζ=${zeta}`, note: kindNotes[kind] },
    { title: '相平面法', formula: '以 (x, ẋ) 为坐标，消去时间 t 得一阶方程: dẋ/dx = f(x,ẋ)/ẋ', note: '轨迹族完全刻画系统行为，无需求解解析解' },
    { title: '奇点与平衡点', formula: 'ẋ = 0 且 N(x) = 0 处为平衡点', substitution: kind === 'deadzone' ? `死区 |x| ≤ ${dead.toFixed(2)} 内任意点均为平衡点` : '原点 (0,0)' },
    { title: '极限环判别', formula: '相轨迹闭合 → 时域出现等幅自持振荡', substitution: `末段振幅 ±${Math.max(...sim.xs.slice(Math.floor(sim.xs.length * 0.8)).map(Math.abs)).toFixed(2)}`, result: Math.max(...sim.xs.slice(Math.floor(sim.xs.length * 0.8)).map(Math.abs)) > 0.05 ? '存在极限环 ⭕' : '收敛稳定 ✓', active: true },
    { title: '工程意义', formula: '描述函数法: N(A) 等效线性化 + 奈氏判据', note: '滞环宽度越大极限环振幅越大、频率越低' },
  ];

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
              <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500" /> 非线性类型
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {(['saturation', 'deadzone', 'relay', 'hysteresis'] as NonlinKind[]).map(k => (
                <button key={k} onClick={() => { setKind(k); loop.replay(); }}
                  className={`py-2 rounded-xl text-xs font-medium border transition ${
                    kind === k ? 'bg-violet-500/15 border-violet-500/40 text-violet-300' : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-slate-200'
                  }`}>
                  {kindLabels[k]}
                </button>
              ))}
            </div>
            <SliderControl label="自然频率 ωn" value={wn} min={0.4} max={3} step={0.05} unit="rad/s" onChange={setWn} />
            <SliderControl label="阻尼比 ζ" value={zeta} min={0} max={0.5} step={0.01} onChange={setZeta} />
            <SliderControl label="限幅/继电幅值 L" value={limit} min={0.1} max={2} step={0.05} onChange={setLimit} />
            <SliderControl label="死区/滞环宽度 Δ" value={dead} min={0.02} max={0.8} step={0.02} onChange={setDead} />
            <SliderControl label="初始位移 x₀" value={x0} min={0.1} max={2.5} step={0.1} onChange={setX0} />
            <div className="text-[11px] leading-relaxed text-slate-500 rounded-xl bg-slate-900/60 border border-white/5 p-3">
              {kindNotes[kind]}
            </div>
          </div>
          <MetricGrid items={[
            { k: '末段振幅', v: `±${Math.max(...sim.xs.slice(Math.floor(sim.xs.length * 0.8)).map(Math.abs)).toFixed(3)}`, tone: 'amber' },
            { k: '初始振幅', v: `±${Math.max(...sim.xs.slice(0, 100).map(Math.abs)).toFixed(3)}`, tone: 'cyan' },
            { k: '行为', v: Math.max(...sim.xs.slice(Math.floor(sim.xs.length * 0.8)).map(Math.abs)) > 0.05 ? '自持振荡' : '收敛', tone: Math.max(...sim.xs.slice(Math.floor(sim.xs.length * 0.8)).map(Math.abs)) > 0.05 ? 'rose' : 'green' },
            { k: '非线性', v: kindLabels[kind], tone: 'violet' },
          ]} />
          <SaveRecordButton
            simulationId="lab-nonlinear"
            params={{ wn, zeta, limit, dead, x0 }}
            metrics={{ 非线性: kindLabels[kind], 末段振幅: Math.max(...sim.xs.slice(Math.floor(sim.xs.length * 0.8)).map(Math.abs)).toFixed(3) }}
          />
        </div>
        <div className="lg:col-span-8">
          <CalcProcess steps={steps} title="相平面分析法 · 逐步拆解" />
        </div>
      </div>
    </div>
  );
}

// ================================================================
// 实验十：采样与离散控制（ZOH 离散化 + z 平面稳定性）
// ================================================================
export function SamplingExp() {
  const [Ts, setTs] = useState(0.3);
  const [K, setK] = useState(1.5);
  const plant: Tf = { num: [1], den: [1, 1, 0] };  // G(s) = 1/[s(s+1)]

  const dsc = useMemo(() => discretizeZOH(plant, Ts), [Ts]);
  const closed = useMemo(() => {
    // 连续闭环
    const denCl = [1, 1, 1 + K];
    const cont = polyRoots(denCl);
    // 离散闭环
    const denClZ = polyAdd(dsc.denZ, dsc.numZ.map(v => v * K));
    const zpoles = polyRoots(denClZ);
    const resp = discreteClosedLoopStep(dsc, K, 60);
    const stableZ = zpoles.every(p => Math.hypot(p.re, p.im) < 1);
    return { cont, zpoles, resp, stableZ };
  }, [dsc, K]);

  const duration = 12;
  const loop = useSimLoop({ duration });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 880, H = 620;

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = W * dpr; c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // ---- 上：连续 vs 采样保持 对比 ----
    const h1 = 300;
    const reg = plotAxes(ctx, W, h1, {
      xMin: 0, xMax: duration, yMin: -0.1, yMax: 1.8,
      xTicks: 8, yTicks: 4, xLabel: '', yLabel: 'r / y连续 / y离散',
      bgColor: 'rgba(2,6,23,0.4)',
    });
    drawDashedLine(ctx, reg.padL, pxY(reg, 1), reg.padL + reg.plotW, pxY(reg, 1), 'rgba(148,163,184,0.5)');
    drawLabel(ctx, reg.padL + reg.plotW - 8, pxY(reg, 1) - 9, '设定值 r=1', COLORS.slate, 10, 'sans', 'right');

    const upto = Math.max(2, Math.floor((loop.t / duration) * 400));
    const Nc = 400;
    const tsC: number[] = [], ysC: number[] = [];
    // 连续闭环阶跃: 1+K/[s(s+1)] → s²+s+K
    {
      let x = [0, 0];
      const dt = duration / Nc;
      for (let i = 0; i <= Nc; i++) {
        const t = i * dt;
        tsC.push(t);
        ysC.push(x[0]);
        if (i < Nc) {
          const f = (xx: number[]) => [xx[1], -K * xx[0] - xx[1] + K];
          const k1 = f(x);
          const k2 = f([x[0] + dt / 2 * k1[0], x[1] + dt / 2 * k1[1]]);
          const k3 = f([x[0] + dt / 2 * k2[0], x[1] + dt / 2 * k2[1]]);
          const k4 = f([x[0] + dt * k3[0], x[1] + dt * k3[1]]);
          x = [x[0] + dt / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), x[1] + dt / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])];
        }
      }
      drawPolyline(ctx, reg, tsC, ysC, COLORS.blue, 1.8, upto);
    }

    // 离散响应：阶梯保持线 + 采样点
    const { k: ks, y: yk } = closed.resp;
    const drawUpTo = Math.min(ks.length - 1, Math.ceil(loop.t / Ts));
    // 阶梯
    ctx.save();
    ctx.beginPath();
    ctx.rect(reg.padL, reg.padT, reg.plotW, reg.plotH);
    ctx.clip();
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= drawUpTo; i++) {
      const t0 = i * Ts, t1 = (i + 1) * Ts;
      if (t0 > duration) break;
      const X0 = pxX(reg, t0), Y = pxY(reg, Math.max(-0.1, Math.min(1.8, yk[i])));
      const X1 = pxX(reg, Math.min(t1, duration));
      if (!started) { ctx.moveTo(X0, Y); started = true; }
      else ctx.lineTo(X0, Y);
      ctx.lineTo(X1, Y);
    }
    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = 2.4;
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 5;
    ctx.stroke();
    ctx.restore();
    // 采样点
    for (let i = 0; i <= drawUpTo && i * Ts <= duration; i++) {
      drawDot(ctx, pxX(reg, i * Ts), pxY(reg, Math.max(-0.1, Math.min(1.8, yk[i]))), 3.2, COLORS.cyan, false);
      // 采样脉冲
      drawDashedLine(ctx, pxX(reg, i * Ts), reg.padT + reg.plotH, pxX(reg, i * Ts), pxY(reg, Math.max(-0.1, Math.min(1.8, yk[i]))), 'rgba(34,211,238,0.12)', [2, 3], 1);
    }
    drawChip(ctx, W - 260, 24, `采样周期 Ts = ${Ts.toFixed(2)} s`, 'rgba(34,211,238,0.1)', COLORS.cyan, 11);
    drawChip(ctx, reg.padL + 8, reg.padT + 12, '— 连续控制', 'rgba(96,165,250,0.12)', COLORS.blue, 10);
    drawChip(ctx, reg.padL + 96, reg.padT + 12, '— 数字控制 (ZOH)', 'rgba(34,211,238,0.12)', COLORS.cyan, 10);

    // ---- 下：z 平面 ----
    const y2 = h1 + 10;
    const h2 = H - y2 - 10;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(10, y2, 470, h2, 12);
    ctx.fillStyle = 'rgba(2,6,23,0.45)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(148,163,184,0.2)';
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.translate(0, y2);
    panelTitle(ctx, W, '② z 平面 —— 极点必须位于单位圆内');
    const zc = 40 + (470 - 20) / 2 + 10, zcy = (h2 - 10) / 2 + 4;
    const zsc = Math.min(h2, 460) / 4.4;
    // 单位圆
    ctx.strokeStyle = 'rgba(52,211,153,0.5)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(zc, zcy, zsc, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(52,211,153,0.05)';
    ctx.fill();
    // 轴
    ctx.strokeStyle = 'rgba(226,232,240,0.4)';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(zc - zsc * 2.1, zcy); ctx.lineTo(zc + zsc * 2.1, zcy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(zc, zcy - zsc * 1.5); ctx.lineTo(zc, zcy + zsc * 1.5); ctx.stroke();
    drawLabel(ctx, zc + zsc - 8, zcy - 8, 'Re(z)', COLORS.slate, 10);
    drawLabel(ctx, zc + 6, zcy - zsc * 1.5 + 4, 'Im(z)', COLORS.slate, 10);
    // z=1 点
    drawDot(ctx, zc + zsc, zcy, 3.5, COLORS.slate, false);
    // 闭环 z 极点
    closed.zpoles.forEach((p, i) => {
      const inside = Math.hypot(p.re, p.im) < 1;
      const col = inside ? COLORS.green : COLORS.orange;
      drawPoleZero(ctx, zc + p.re * zsc, zcy - p.im * zsc, 'pole', col, 8, true);
      if (i === 0) {
        drawChip(ctx, zc + p.re * zsc + 12, zcy - p.im * zsc - 6, `|z|=${Math.hypot(p.re, p.im).toFixed(2)}`, 'rgba(15,23,42,0.9)', col, 10);
      }
    });
    drawLabel(ctx, 24, h2 - 26, closed.stableZ ? '✓ 闭环稳定：所有极点在单位圆内' : '✗ 不稳定：存在单位圆外极点', closed.stableZ ? COLORS.green : COLORS.orange, 12, 'sans');
    ctx.restore();

    // ---- 右下：离散差分方程信息 ----
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(492, y2, W - 504, h2, 12);
    ctx.fillStyle = 'rgba(2,6,23,0.45)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(148,163,184,0.2)';
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.translate(0, y2);
    panelTitle(ctx, W, '③ ZOH 离散化结果 G(z)');
    const numS = dsc.numZ.map(v => v.toFixed(4)).join(', ');
    const denS = dsc.denZ.map(v => v.toFixed(4)).join(', ');
    const lines = [
      `G(z) = (${numS}) / (${denS})`,
      ``,
      `Ts = ${Ts.toFixed(2)} s,  K = ${K.toFixed(2)}`,
      `闭环特征方程: 1 + K·G(z) = 0`,
      `闭环 z 极点: ${closed.zpoles.map(p => `${p.re.toFixed(3)}${p.im >= 0 ? '+' : ''}${p.im.toFixed(3)}j`).join(', ')}`,
    ];
    lines.forEach((ln, i) => {
      drawLabel(ctx, 22, 44 + i * 22, ln, i === 0 ? COLORS.cyan : 'rgba(203,213,225,0.8)', 11, 'mono');
    });
    drawLabel(ctx, 22, h2 - 30, closed.stableZ ? `采样控制收敛，与连续控制接近` : `Ts 过大 → 采样定理被违反 → 失稳!`, closed.stableZ ? 'rgba(52,211,153,0.9)' : COLORS.rose, 11, 'sans');
    ctx.restore();
  }, [loop.t, loop.cycle, dsc, closed, Ts, K, W, H, duration]);

  const steps: CalcStep[] = [
    { title: '连续对象', formula: 'G(s) = 1 / [s(s+1)]', note: '含积分环节的典型电机速度对象' },
    { title: '零阶保持器等效离散化', formula: `G(z) = Z{ G_h(s)·G(s) } → (${dsc.numZ.map(v => v.toFixed(3)).join(', ')}) / (${dsc.denZ.map(v => v.toFixed(3)).join(', ')})`, substitution: `采样周期 Ts = ${Ts.toFixed(2)} s` },
    { title: '数字比例控制器', formula: `u(k) = K·[ r(k) − y(k−1) ]`, substitution: `K = ${K.toFixed(2)}` },
    { title: '闭环特征方程', formula: '1 + K·G(z) = 0', substitution: closed.zpoles.map(p => `z = ${p.re.toFixed(3)}${p.im >= 0 ? '+' : ''}${p.im.toFixed(3)}j`).join(', '), active: true },
    {
      title: '稳定性判定（z 平面）',
      formula: '稳定 ⇔ 所有闭环极点 |zᵢ| < 1（单位圆内）',
      result: closed.stableZ ? '|z|max = ' + Math.max(...closed.zpoles.map(p => Math.hypot(p.re, p.im))).toFixed(3) + ' < 1 → 稳定 ✓' : '|z| ≥ 1 → 不稳定 ✗',
      note: 's 左半平面映射为 z 单位圆内: z = e^(s·Ts)。Ts 越大，离散化畸变越严重',
    },
    { title: '与连续控制对比', formula: '连续闭环: s²+s+K=0', substitution: `连续极点: ${closed.cont.map(p => p.re.toFixed(2)).join(', ')}`, note: '观察上方曲线：Ts 增大后数字控制出现额外滞后与振荡' },
  ];

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
              <span className="w-1.5 h-4 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500" /> 采样参数
            </div>
            <SliderControl label="采样周期 Ts" value={Ts} min={0.05} max={2.5} step={0.05} unit="s" onChange={setTs}
              format={v => v.toFixed(2)} />
            <SliderControl label="数字控制器增益 K" value={K} min={0.2} max={4} step={0.05} onChange={setK} />
            <div className="text-[11px] leading-relaxed text-slate-500 rounded-xl bg-slate-900/60 border border-white/5 p-3">
              把 <span className="text-cyan-300">Ts 逐渐调大</span>，观察 z 平面上极点被"推出"单位圆的瞬间 ——
              这就是采样周期过大会让原本稳定的连续系统失稳的原因。
            </div>
          </div>
          <MetricGrid items={[
            { k: '采样角频率 ωs', v: `${(2 * Math.PI / Ts).toFixed(1)} rad/s`, tone: 'cyan' },
            { k: '闭环极点 |z|max', v: Math.max(...closed.zpoles.map(p => Math.hypot(p.re, p.im))).toFixed(3), tone: closed.stableZ ? 'green' : 'rose' },
            { k: '稳定性', v: closed.stableZ ? '稳定 ✓' : '失稳 ✗', tone: closed.stableZ ? 'green' : 'rose' },
            { k: '奈奎斯特频率', v: `${(Math.PI / Ts).toFixed(2)} rad/s`, tone: 'violet' },
          ]} />
          <SaveRecordButton
            simulationId="lab-sampling"
            params={{ Ts, K }}
            metrics={{ Ts: `${Ts.toFixed(2)}s`, 稳定性: closed.stableZ ? '稳定' : '失稳', z模最大: Math.max(...closed.zpoles.map(p => Math.hypot(p.re, p.im))).toFixed(3) }}
          />
        </div>
        <div className="lg:col-span-8">
          <CalcProcess steps={steps} title="ZOH 离散化与闭环设计流程" />
        </div>
      </div>
    </div>
  );
}
