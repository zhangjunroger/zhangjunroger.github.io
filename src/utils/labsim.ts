// ============ 控制理论仿真引擎 ============
// 提供传递函数运算、数值求根、状态空间仿真(RK4)、伯德/奈奎斯特数据、
// 根轨迹求解、PID闭环仿真、ZOH离散化等核心算法，供各交互实验调用。

export interface Complex { re: number; im: number }

export const C = (re: number, im = 0): Complex => ({ re, im });
export const cadd = (a: Complex, b: Complex): Complex => ({ re: a.re + b.re, im: a.im + b.im });
export const csub = (a: Complex, b: Complex): Complex => ({ re: a.re - b.re, im: a.im - b.im });
export const cmul = (a: Complex, b: Complex): Complex => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});
export const cdiv = (a: Complex, b: Complex): Complex => {
  const d = b.re * b.re + b.im * b.im;
  if (d === 0) return C(a.re !== 0 ? a.re * 1e12 : 1e12, a.im !== 0 ? a.im * 1e12 : 0);
  return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d };
};
export const cabs = (a: Complex): number => Math.hypot(a.re, a.im);
export const carg = (a: Complex): number => Math.atan2(a.im, a.re);
export const cscale = (a: Complex, k: number): Complex => ({ re: a.re * k, im: a.im * k });

// ---------- 多项式工具（系数均为降幂排列，如 [1,3,2] 表示 s²+3s+2） ----------
export function polyEval(p: number[], s: Complex): Complex {
  let acc = C(p[0] || 0, 0);
  for (let i = 1; i < p.length; i++) {
    acc = cadd(cmul(acc, s), C(p[i] || 0, 0));
  }
  return acc;
}

export function polyDeriv(p: number[]): number[] {
  if (p.length <= 1) return [0];
  const out: number[] = [];
  const n = p.length - 1;
  for (let i = 0; i < n; i++) out.push(p[i] * (n - i));
  return out;
}

export function polyMultiply(a: number[], b: number[]): number[] {
  const out = new Array(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++)
    for (let j = 0; j < b.length; j++) out[i + j] += a[i] * b[j];
  return out;
}

export function polyAdd(a: number[], b: number[]): number[] {
  const n = Math.max(a.length, b.length);
  const pa = new Array(n).fill(0).concat(a as never).slice(-n);
  const pb = new Array(n).fill(0).concat(b as never).slice(-n);
  return pa.map((v, i) => v + pb[i]);
}

export function polyTrim(p: number[]): number[] {
  let i = 0;
  while (i < p.length - 1 && Math.abs(p[i]) < 1e-14) i++;
  return p.slice(i);
}

// Durand–Kerner 法求多项式全部复根
export function polyRoots(coeffs: number[]): Complex[] {
  const p = polyTrim(coeffs);
  let lead = p[0];
  if (Math.abs(lead) < 1e-15) return [];
  const monic = p.map(v => v / lead);
  const n = monic.length - 1;
  if (n < 1) return [];
  const roots: Complex[] = [];
  for (let k = 0; k < n; k++) {
    const r = 0.5 + 0.905 * k; // 初始圆环分布
    const th = (2 * Math.PI * k) / n + 0.4;
    roots.push(C(r * Math.cos(th), r * Math.sin(th)));
  }
  for (let iter = 0; iter < 400; iter++) {
    let maxDelta = 0;
    for (let i = 0; i < n; i++) {
      let denom = C(1, 0);
      for (let j = 0; j < n; j++) {
        if (j !== i) denom = cmul(denom, csub(roots[i], roots[j]));
      }
      const delta = cdiv(polyEval(monic, roots[i]), denom);
      roots[i] = csub(roots[i], delta);
      maxDelta = Math.max(maxDelta, cabs(delta));
    }
    if (maxDelta < 1e-13) break;
  }
  // 清理微小虚部/实部
  return roots.map(r => ({
    re: Math.abs(r.re) < 1e-11 ? 0 : r.re,
    im: Math.abs(r.im) < 1e-9 ? 0 : r.im,
  }));
}

// ---------- 传递函数（num/den 降幂排列） ----------
export interface Tf { num: number[]; den: number[] }

export function tfNormalize(tf: Tf): Tf {
  const lead = tf.den[0] || 1;
  return { num: tf.num.map(v => v / lead), den: tf.den.map(v => v / lead) };
}

export function tfEval(tf: Tf, s: Complex): Complex {
  return cdiv(polyEval(tf.num, s), polyEval(tf.den, s));
}

export function tfPoles(tf: Tf): Complex[] { return polyRoots(tf.den); }
export function tfZeros(tf: Tf): Complex[] { return polyRoots(tf.num.filter(v => Math.abs(v) > 1e-14)); }

export function tfSeries(a: Tf, b: Tf): Tf {
  return { num: polyMultiply(a.num, b.num), den: polyMultiply(a.den, b.den) };
}

export function tfFeedback(a: Tf, fbNum: number[] = [1], fbDen: number[] = [1]): Tf {
  // 闭环: a/(1 + a·fb)
  const loopNum = polyMultiply(a.num, fbNum);
  const loopDen = polyMultiply(a.den, fbDen);
  return { num: polyMultiply(a.num, fbDen), den: polyAdd(loopDen, loopNum) };
}

// TF → 可控标准型状态空间 (A,B,C,D)，返回 {A,B,C,D,n}
export function tf2ss(tf: Tf) {
  const t = tfNormalize(tf);
  const n = t.den.length - 1;
  const num = new Array(n + 1).fill(0);
  const off = n + 1 - t.num.length;
  for (let i = 0; i < t.num.length; i++) num[off + i] = t.num[i];
  const a = t.den.slice(1); // a[0..n-1] 对应 s^{n-1}..s^0? den=[1,a1,...,an]; a_i = den[i+1] 为 s^{n-i} 系数
  const A: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row = new Array(n).fill(0);
    if (i < n - 1) row[i + 1] = 1;
    else for (let j = 0; j < n; j++) row[j] = -a[n - 1 - j];
    A.push(row);
  }
  const B = new Array(n).fill(0); B[n - 1] = 1;
  const D = num[0];
  // 可控标准型: num = c1·s + c0 形式 → C = [c0, c1, ...]（对应 s^0, s^1, ... 系数）
  const Cv = new Array(n).fill(0);
  for (let j = 0; j < n; j++) Cv[j] = num[n - j] - D * a[n - 1 - j];
  return { A, B, C: Cv, D, n };
}

function matVec(A: number[][], x: number[]): number[] {
  return A.map(row => row.reduce((s, v, i) => s + v * x[i], 0));
}
function vecAddScale(a: number[], b: number[], k: number): number[] {
  return a.map((v, i) => v + b[i] * k);
}

// RK4 仿真: ẋ = Ax + Bu(t), y = Cx + Du
export function simulateSS(
  ss: { A: number[][]; B: number[]; C: number[]; D: number; n: number },
  uFn: (t: number) => number,
  tEnd: number,
  steps: number,
  x0?: number[]
): { t: number[]; y: number[]; x: number[][] } {
  const dt = tEnd / steps;
  const xs: number[][] = [];
  const ys: number[] = [];
  const ts: number[] = [];
  let x = x0 ? [...x0] : new Array(ss.n).fill(0);
  const deriv = (xx: number[], t: number) => {
    const Ax = matVec(ss.A, xx);
    const u = uFn(t);
    return vecAddScale(Ax, ss.B, u);
  };
  for (let k = 0; k <= steps; k++) {
    const t = k * dt;
    const u = uFn(t);
    const y = ss.C.reduce((s, c, i) => s + c * x[i], 0) + ss.D * u;
    ts.push(t); xs.push([...x]); ys.push(y);
    if (k === steps) break;
    const k1 = deriv(x, t);
    const k2 = deriv(vecAddScale(x, k1, dt / 2), t + dt / 2);
    const k3 = deriv(vecAddScale(x, k2, dt / 2), t + dt / 2);
    const k4 = deriv(vecAddScale(x, k3, dt), t + dt);
    x = x.map((v, i) => v + (dt / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
  }
  return { t: ts, y: ys, x: xs };
}

export function tfStep(tf: Tf, tEnd: number, steps = 800, amplitude = 1) {
  return simulateSS(tf2ss(tf), () => amplitude, tEnd, steps);
}

export function tfImpulse(tf: Tf, tEnd: number, steps = 800) {
  const ss = tf2ss(tf);
  // 冲激响应: x(0)=B, u=0
  const x0 = ss.B.map(v => v);
  return simulateSS(ss, () => 0, tEnd, steps, x0);
}

// ---------- 伯德图数据 ----------
export function bodeData(tf: Tf, wMin = 0.01, wMax = 1000, N = 720) {
  const ws: number[] = [], mags: number[] = [], phases: number[] = [];
  const ratio = Math.pow(wMax / wMin, 1 / N);
  let w = wMin;
  let phase = 0, prev = 0;
  for (let i = 0; i <= N; i++) {
    const g = tfEval(tf, C(0, w));
    const m = cabs(g);
    let ph = carg(g) * (180 / Math.PI);
    // 解卷绕
    if (i > 0) {
      while (ph - prev > 180) ph -= 360;
      while (ph - prev < -180) ph += 360;
    }
    prev = ph;
    ws.push(w); mags.push(20 * Math.log10(Math.max(m, 1e-10))); phases.push(ph);
    w *= ratio;
  }
  return { ws, mags, phases };
}

// 渐近幅频特性（分环节渐近线叠加）
export function bodeAsymptote(
  K: number, type: number, polesT: number[], zerosT: number[], wn2: number | null, ws: number[]
): number[] {
  // type: 积分环节数 ν；polesT: 一阶惯性时间常数；zerosT: 一阶微分时间常数
  return ws.map(w => {
    let db = 20 * Math.log10(Math.max(K, 1e-10)) - type * 20 * Math.log10(Math.max(w, 1e-6));
    for (const T of polesT) db -= 20 * Math.log10(Math.max(1, w * T));
    for (const T of zerosT) db += 20 * Math.log10(Math.max(1, w * T));
    if (wn2 && wn2 > 0) db -= 40 * Math.log10(Math.max(1, w / wn2));
    return db;
  });
}

// 剪切频率 ωc (|G|=1) 与相角裕度；-180°穿越频率 ωg 与幅值裕度
export function stabilityMargins(tf: Tf) {
  const { ws, mags, phases } = bodeData(tf, 0.001, 10000, 1500);
  let wc = NaN, gamma = NaN, wg = NaN, gm = NaN;
  for (let i = 1; i < ws.length; i++) {
    if (mags[i - 1] > 0 && mags[i] <= 0) {
      const f = mags[i - 1] / (mags[i - 1] - mags[i]);
      wc = ws[i - 1] + (ws[i] - ws[i - 1]) * f;
      gamma = 180 + phases[i - 1] + (phases[i] - phases[i - 1]) * f;
    }
    if (phases[i - 1] > -180 && phases[i] <= -180) {
      const f = (phases[i - 1] + 180) / (phases[i - 1] - phases[i]);
      wg = ws[i - 1] + (ws[i] - ws[i - 1]) * f;
      const m = mags[i - 1] + (mags[i] - mags[i - 1]) * f;
      gm = -m;
    }
  }
  return { wc, gamma, wg, gm };
}

// ---------- 奈奎斯特数据（正频 + 共轭镜像） ----------
export function nyquistData(tf: Tf, wMin = 0.01, wMax = 200, N = 1200) {
  const pos: Complex[] = [];
  const ws: number[] = [];
  const ratio = Math.pow(wMax / wMin, 1 / N);
  let w = wMin;
  for (let i = 0; i <= N; i++) {
    pos.push(tfEval(tf, C(0, w)));
    ws.push(w);
    w *= ratio;
  }
  return { pos, ws };
}

// G(jω) 轨迹对 (-1, j0) 的包围圈数（顺时针为正）
export function encirclementsOfMinus1(pos: Complex[]): number {
  let total = 0, prev = carg(pos[0]);
  for (let i = 1; i < pos.length; i++) {
    let d = carg(pos[i]) - prev;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    total += d;
    prev = carg(pos[i]);
  }
  return total / (2 * Math.PI);
}

// ---------- 根轨迹 ----------
export interface RootLocusData {
  Ks: number[];
  branches: Complex[][];  // 每条分支: 随K变化的根序列
  asymptoteAngles: number[];
  centroid: number;
  breakaway: number[];    // 分离点(实轴)
}

export function rootLocus(tf: Tf, Kmax = 20, N = 240): RootLocusData {
  const t = tfNormalize(tf);
  const Ks: number[] = [];
  const rootSets: Complex[][] = [];
  for (let i = 1; i <= N; i++) {
    const K = (Kmax * i) / N;
    Ks.push(K);
    rootSets.push(polyRoots(polyAdd(t.den, t.num.map(v => v * K))));
  }
  // 分支追踪：每一步将根分配给最近的分支
  const n = t.den.length - 1;
  const branches: Complex[][] = Array.from({ length: n }, () => []);
  const used: number[][] = Array.from({ length: N }, () => new Array(n).fill(0));
  for (let i = 0; i < N; i++) {
    for (let b = 0; b < n; b++) {
      if (i === 0) {
        branches[b].push(rootSets[i][b]);
        used[i][b] = 1;
      } else {
        let best = -1, bestD = Infinity;
        for (let j = 0; j < n; j++) {
          if (used[i][j]) continue;
          const d = cabs(csub(rootSets[i][j], branches[b][i - 1]));
          if (d < bestD) { bestD = d; best = j; }
        }
        if (best < 0) best = b;
        used[i][best] = 1;
        branches[b].push(rootSets[i][best]);
      }
    }
  }
  const zeros = tfZeros(t);
  const poles = tfPoles(t);
  const nmm = poles.length - zeros.length;
  const sumP = poles.reduce((s, p) => s + p.re, 0);
  const sumZ = zeros.reduce((s, z) => s + z.re, 0);
  const centroid = nmm > 0 ? (sumP - sumZ) / nmm : 0;
  const asymptoteAngles: number[] = [];
  if (nmm > 0) {
    for (let k = 0; k < nmm; k++) asymptoteAngles.push(((2 * k + 1) * 180) / nmm);
  }
  // 分离点: D'N − DN' = 0 的实根，且对应 K = −D/N ≥ 0
  const Dp = polyDeriv(t.den), Np = polyDeriv(t.num);
  const cand = polyAdd(polyMultiply(Dp, t.num), polyMultiply(t.den, Np).map(v => -v));
  const breakaway: number[] = [];
  for (const r of polyRoots(cand)) {
    if (Math.abs(r.im) > 1e-6) continue;
    const s = C(r.re, 0);
    const Ns = polyEval(t.num, s).re;
    const Ds = polyEval(t.den, s).re;
    if (Math.abs(Ns) < 1e-10) continue;
    const K = -Ds / Ns;
    if (K >= -1e-9 && isFinite(K) && Math.abs(K) < 1e7) breakaway.push(r.re);
  }
  breakaway.sort((a, b) => a - b);
  return { Ks, branches, asymptoteAngles, centroid, breakaway };
}

// ---------- PID 闭环仿真（带抗饱和与微分滤波） ----------
export interface PidSimResult {
  t: number[]; r: number[]; y: number[]; u: number[]; e: number[];
  pTerm: number[]; iTerm: number[]; dTerm: number[];
}

export interface PidOptions {
  Kp: number; Ki: number; Kd: number;
  tEnd?: number;
  umin?: number; umax?: number;
  distAt?: number; distValue?: number;   // t=distAt 时加入负载扰动
  noiseAmp?: number;
}

export function pidSim(tf: Tf, opt: PidOptions, rFn: (t: number) => number = () => 1): PidSimResult {
  const tEnd = opt.tEnd ?? 12;
  const sub = 6;                     // 每个控制周期内对象细分子步
  const dtC = 0.01;
  const steps = Math.round(tEnd / dtC);
  const dtP = dtC / sub;
  const ss = tf2ss(tf);
  let x = new Array(ss.n).fill(0);
  let integral = 0, dFilt = 0, yPrev = 0;
  const out: PidSimResult = { t: [], r: [], y: [], u: [], e: [], pTerm: [], iTerm: [], dTerm: [] };
  const umin = opt.umin ?? -50, umax = opt.umax ?? 50;
  for (let k = 0; k <= steps; k++) {
    const t = k * dtC;
    const r = rFn(t);
    const y = ss.C.reduce((s, c, i) => s + c * x[i], 0) + ss.D * 0;
    const e = r - y;
    const dRaw = (y - yPrev) / dtC;      // 微分先行(对输出微分,避免微分冲击)
    dFilt = dFilt + (dtC / (0.05 + dtC)) * (-dRaw - dFilt);
    const p = opt.Kp * e;
    const it = opt.Ki * integral;
    const d = opt.Kd * dFilt;
    let u = p + it + d;
    const uSat = Math.max(umin, Math.min(umax, u));
    const saturated = Math.abs(u - uSat) > 1e-9;
    // 抗积分饱和: 输出饱和且误差同向时暂停积分
    if (!(saturated && Math.sign(e) === Math.sign(u - uSat))) integral += e * dtC;
    u = uSat;
    // 对象仿真（含负载扰动）
    const dist = opt.distAt !== undefined && t >= opt.distAt ? (opt.distValue ?? 0.4) : 0;
    const uEff = u + dist;
    for (let s = 0; s < sub; s++) {
      const tp = t + s * dtP;
      const f = (xx: number[]) => vecAddScale(matVec(ss.A, xx), ss.B, uEff);
      const k1 = f(x);
      const k2 = f(vecAddScale(x, k1, dtP / 2));
      const k3 = f(vecAddScale(x, k2, dtP / 2));
      const k4 = f(vecAddScale(x, k3, dtP));
      x = x.map((v, i) => v + (dtP / 6) * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i]));
    }
    yPrev = ss.C.reduce((s, c, i) => s + c * x[i], 0);
    out.t.push(t); out.r.push(r); out.y.push(y); out.u.push(u); out.e.push(e);
    out.pTerm.push(p); out.iTerm.push(it); out.dTerm.push(d);
  }
  return out;
}

// 齐格勒-尼科尔斯整定：求临界增益 Ku 与临界周期 Tu
export function zieglerNichols(tf: Tf): { Ku: number; Tu: number } | null {
  const { wg, gm } = stabilityMargins(tf);
  if (!isFinite(wg) || !isFinite(gm) || gm <= 0 || wg <= 0) return null;
  const Ku = Math.pow(10, gm / 20);
  const Tu = (2 * Math.PI) / wg;
  return { Ku, Tu };
}

// ---------- 稳态误差 ----------
export interface SsErrorInfo {
  type: number;       // 系统型别(积分环节数)
  Kp: number;         // 静态位置误差系数
  Kv: number;         // 静态速度误差系数
  Ka: number;         // 静态加速度误差系数
}

// 数值法计算误差系数（lim s^k G(s)）
export function errorConstants(tf: Tf): SsErrorInfo {
  const t = tfNormalize(tf);
  let type = 0;
  for (let i = t.den.length - 1; i > 0 && Math.abs(t.den[i]) < 1e-14; i--) type++;
  const eps = 1e-7;
  const val = (k: number) => {
    const g = tfEval(t, C(eps, 0));
    const v = cabs(g) * Math.pow(eps, k);
    return isFinite(v) && v > 1e6 ? Infinity : v;
  };
  return {
    type,
    Kp: type >= 1 ? Infinity : val(0),
    Kv: type >= 2 ? Infinity : (type === 0 ? 0 : val(1)),
    Ka: type >= 3 ? Infinity : (type <= 1 ? 0 : val(2)),
  };
}

// ---------- 非线性系统相平面 ----------
export type NonlinKind = 'saturation' | 'deadzone' | 'relay' | 'hysteresis';

export function nonlinValue(kind: NonlinKind, x: number, limit: number, dead: number, relayState: 1 | -1): number {
  switch (kind) {
    case 'saturation':
      return Math.max(-limit, Math.min(limit, x));
    case 'deadzone': {
      if (Math.abs(x) <= dead) return 0;
      return x - Math.sign(x) * dead;
    }
    case 'relay':
      return x >= 0 ? limit : -limit;
    case 'hysteresis':
      return relayState * limit;
  }
}

// 相平面轨迹: ẍ + 2ζωn·ẋ + ωn²·N(x) = 0
export function phasePlaneSim(
  kind: NonlinKind, wn: number, zeta: number, limit: number, dead: number,
  x0: number, v0: number, tEnd = 24, steps = 4000
) {
  const dt = tEnd / steps;
  const xs: number[] = [], vs: number[] = [], ts: number[] = [];
  let x = x0, v = v0, relay: 1 | -1 = x >= 0 ? 1 : -1;
  const Nf = (xx: number) => {
    if (kind === 'hysteresis') {
      if (relay === 1 && xx < -dead) relay = -1;
      else if (relay === -1 && xx > dead) relay = 1;
      return relay * limit;
    }
    return nonlinValue(kind, xx, limit, dead, relay);
  };
  const acc = (xx: number, vv: number) => -2 * zeta * wn * vv - wn * wn * Nf(xx);
  for (let i = 0; i <= steps; i++) {
    xs.push(x); vs.push(v); ts.push(i * dt);
    if (i === steps) break;
    const k1x = v, k1v = acc(x, v);
    const k2x = v + (dt / 2) * k1v, k2v = acc(x + (dt / 2) * k1x, v + (dt / 2) * k1v);
    const k3x = v + (dt / 2) * k2v, k3v = acc(x + (dt / 2) * k2x, v + (dt / 2) * k2v);
    const k4x = v + dt * k3v, k4v = acc(x + dt * k3x, v + dt * k3v);
    x += (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
    v += (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
  }
  return { ts, xs, vs };
}

// ---------- 采样系统 (ZOH 离散化) ----------
// 矩阵指数（缩放平方 + Taylor, n≤4 足够）
export function expm(A: number[][]): number[][] {
  const n = A.length;
  const norm = Math.max(...A.flat().map(Math.abs), 0.001);
  const s = Math.max(0, Math.ceil(Math.log2(norm)) + 1);
  const As = A.map(row => row.map(v => v / Math.pow(2, s)));
  let X: number[][] = As.map((_, i) => As[i].map((_, j) => (i === j ? 1 : 0)));
  let term = X.map(r => [...r]);
  for (let k = 1; k <= 12; k++) {
    term = term.map((row, i) => row.map((_, j) =>
      As.reduce((sum, _arow, l) => sum + As[i][l] * term[l][j], 0) / k
    ));
    X = X.map((row, i) => row.map((v, j) => v + term[i][j]));
  }
  for (let i = 0; i < s; i++) {
    X = X.map(row1 => X.map((row2, j) => row1.reduce((sum, v, l) => sum + v * row2[l][j], 0)));
  }
  return X;
}

export interface DiscreteTf { numZ: number[]; denZ: number[]; Ts: number }

// ZOH 离散化: G(s) → G(z)，返回降幂 z 多项式（denZ 首一）
export function discretizeZOH(tf: Tf, Ts: number): DiscreteTf {
  const ss = tf2ss(tf);
  const n = ss.n;
  // M = [[A, B],[0, 0]] (n+1 阶), expm(M·Ts) = [[Ad, Bd],[0, 1]]
  const m = n + 1;
  const M: number[][] = [];
  for (let i = 0; i < m; i++) {
    M.push(new Array(m).fill(0));
  }
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) M[i][j] = ss.A[i][j] * Ts;
    M[i][n] = ss.B[i] * Ts;
  }
  const E = expm(M);
  const Ad = E.slice(0, n).map(r => r.slice(0, n));
  const Bd = E.slice(0, n).map(r => r[n]);
  // denZ = det(zI − Ad): Faddeev–LeVerrier
  let Mk: number[][] = Ad.map((_, i) => Ad[i].map((_, j) => (i === j ? 1 : 0)));
  const aCoeff: number[] = [1];
  for (let k = 1; k <= n; k++) {
    const AM = Ad.map((row, i) => row.map((_, j) => row.reduce((s, v, l) => s + v * Mk[l][j], 0)));
    const pk = -AM.reduce((s, row, i) => s + row[i], 0) / k;
    aCoeff.push(pk);
    Mk = AM.map((row, i) => row.map((v, j) => v + (i === j ? pk : 0)));
  }
  // denZ 降幂: z^n + a1 z^{n-1} + ... + an  (aCoeff[k] = p_k)
  const denZ = aCoeff.slice();
  // 在 n+1 个点上数值求 B(z): B(z) = Gd(z)·denZ(z)
  const zs: number[] = [], bs: number[] = [];
  for (let i = 0; i <= n; i++) {
    const z = 1.7 + i * 1.3;
    zs.push(z);
    // Gd(z) = C(zI−Ad)^{-1}Bd + D, 用复数运算求逆
    const g = evalDiscreteAt(Ad, Bd, ss.C, ss.D, z);
    const denAtZ = denZ.reduce((s, v, idx) => s + v * Math.pow(z, denZ.length - 1 - idx), 0);
    bs.push(g * denAtZ);
  }
  // 解 Vandermonde 求 B 系数（降幂 b0 z^n ... 但 B 次数 ≤ n, denZ 已含 D 项 → 解 n+1 系数? B deg ≤ n）
  // B(z) 次数 ≤ n：n+1 个方程 n+1 未知数
  const V: number[][] = zs.map(z => {
    const row: number[] = [];
    for (let p = n; p >= 0; p--) row.push(Math.pow(z, p));
    return row;
  });
  const numZ = solveLinear(V, bs);
  while (numZ.length > 1 && Math.abs(numZ[0]) < 1e-10) numZ.shift();
  return { numZ, denZ, Ts };
}

function evalDiscreteAt(Ad: number[][], Bd: number[], Cv: number[], D: number, z: number): number {
  const n = Ad.length;
  // (zI − Ad) x = Bd → 高斯消元
  const Am: number[][] = Ad.map((row, i) => row.map((v, j) => (i === j ? z - v : -v)));
  Am.forEach((row, i) => row.push(Bd[i]));
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(Am[r][col]) > Math.abs(Am[piv][col])) piv = r;
    [Am[col], Am[piv]] = [Am[piv], Am[col]];
    const d = Am[col][col] || 1e-300;
    for (let r = col + 1; r < n; r++) {
      const f = Am[r][col] / d;
      for (let c2 = col; c2 <= n; c2++) Am[r][c2] -= f * Am[col][c2];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = Am[r][n];
    for (let c2 = r + 1; c2 < n; c2++) s -= Am[r][c2] * x[c2];
    x[r] = s / (Am[r][r] || 1e-300);
  }
  return Cv.reduce((s, c, i) => s + c * x[i], 0) + D;
}

export function solveLinear(A: number[][], b: number[]): number[] {
  const n = b.length;
  const Am = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(Am[r][col]) > Math.abs(Am[piv][col])) piv = r;
    [Am[col], Am[piv]] = [Am[piv], Am[col]];
    const d = Am[col][col] || 1e-300;
    for (let r = col + 1; r < n; r++) {
      const f = Am[r][col] / d;
      for (let c = col; c <= n; c++) Am[r][c] -= f * Am[col][c];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = Am[r][n];
    for (let c = r + 1; c < n; c++) s -= Am[r][c] * x[c];
    x[r] = s / (Am[r][r] || 1e-300);
  }
  return x;
}

// 离散闭环阶跃响应: u_k = K(r_k − y_{k−1}), 对象 G_d(z)
export function discreteClosedLoopStep(
  dtf: DiscreteTf, K: number, steps: number
): { k: number[]; y: number[]; r: number[]; u: number[] } {
  const numRaw = dtf.numZ, den = dtf.denZ;
  const n = den.length - 1;
  // num 补零至长度 n+1（降幂），使差分方程 y_k = Σ numPad[i]·u_{k−i} − Σ den[i]·y_{k−i}
  const num = new Array(n + 1).fill(0);
  const off = n + 1 - numRaw.length;
  for (let i = 0; i < numRaw.length; i++) num[off + i] = numRaw[i];
  const y: number[] = [], u: number[] = [], r: number[] = [], ks: number[] = [];
  for (let k = 0; k <= steps; k++) {
    const rk = 1;
    const uk = K * (rk - (y[k - 1] ?? 0));
    let yk = 0;
    for (let i = 0; i <= n; i++) {
      const uVal = i === 0 ? uk : (k - i >= 0 ? u[k - i] : 0);
      yk += num[i] * uVal;
    }
    for (let i = 1; i <= n; i++) yk -= den[i] * (k - i >= 0 ? y[k - i] : 0);
    yk /= den[0] || 1;
    ks.push(k); r.push(rk); u.push(uk); y.push(yk);
  }
  return { k: ks, y, r, u };
}
