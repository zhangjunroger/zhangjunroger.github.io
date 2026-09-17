// 仿真引擎快速验证脚本 (npx tsx scripts/test-labsim.ts)
import {
  polyRoots, tfStep, tfNormalize, bodeData, stabilityMargins, rootLocus,
  pidSim, zieglerNichols, discretizeZOH, discreteClosedLoopStep, polyRoots as pr,
  phasePlaneSim, errorConstants, type Tf,
} from '../src/utils/labsim';

// 1. 多项式求根: s²+3s+2 → -1, -2
console.log('roots(s²+3s+2):', polyRoots([1, 3, 2]));

// 2. 二阶系统 1/(s²+2·0.45·2s+4) 阶跃终值应≈1，峰值≈1+σ%
const wn = 2, zeta = 0.45;
const g2: Tf = { num: [wn * wn], den: [1, 2 * zeta * wn, wn * wn] };
const r = tfStep(g2, 8, 1600);
const peak = Math.max(...r.y);
const final = r.y[r.y.length - 1];
const osExp = Math.exp((-Math.PI * zeta) / Math.sqrt(1 - zeta * zeta));
console.log(`二阶阶跃: peak=${peak.toFixed(4)} final=${final.toFixed(4)} σ%理论=${(osExp * 100).toFixed(2)}% 实测=${((peak / final - 1) * 100).toFixed(2)}%`);

// 3. 带积分环节 1/(s(s+1)) 阶跃应发散到∞(开环)，闭环 K=1 时终值1
const G = { num: [1], den: [1, 1, 0] };
const Gc = { num: [1], den: [1, 1, 1] };
const rc = tfStep(Gc, 15, 1500);
console.log(`闭环1/(s²+s+1)阶跃终值: ${rc.y[rc.y.length - 1].toFixed(4)}`);

// 4. 伯德/裕度: G=10/((s+1)(0.1s+1)(0.05s+1)) 用 stabilityMargins
const G3: Tf = tfNormalize({ num: [100], den: [1, 11, 21, 10].map((v, i) => v) });
const m = stabilityMargins(G3);
console.log('裕度:', m);

// 5. 根轨迹: 1/(s(s+2)) 分离点应 = -1
const rl = rootLocus({ num: [1], den: [1, 2, 0] }, 20, 200);
console.log('根轨迹分离点:', rl.breakaway, '渐近线:', rl.asymptoteAngles, '重心:', rl.centroid);
const tipRe = rl.branches.map(b => b[b.length - 1].re);
console.log('K=20时各根:', rl.branches.map(b => `${b[b.length - 1].re.toFixed(3)}±${Math.abs(b[b.length - 1].im).toFixed(3)}j`));

// 6. PID: G=1/(s+1), Kp=2,Ki=1,Kd=0 → 终值应=1(有积分)
const pr2 = pidSim({ num: [1], den: [1, 1] }, { Kp: 2, Ki: 1, Kd: 0, tEnd: 10 });
console.log(`PID终值: y=${pr2.y[pr2.y.length - 1].toFixed(4)} u终=${pr2.u[pr2.u.length - 1].toFixed(4)}`);

// 7. Z-N 整定: G=1/(s(s+1)(0.5s+1))
const zn = zieglerNichols({ num: [1], den: [0.5, 1.5, 1, 0] });
console.log('Z-N:', zn);

// 8. ZOH 离散化: G=1/(s+1), Ts=0.5 → G(z)=(1-e^-0.5)/(z-e^-0.5) = 0.3935/(z-0.6065)
const dz = discretizeZOH({ num: [1], den: [1, 1] }, 0.5);
console.log('G(z) num:', dz.numZ.map(v => v.toFixed(4)), 'den:', dz.denZ.map(v => v.toFixed(4)));
const dc = discreteClosedLoopStep(dz, 1.5, 40);
console.log('离散闭环 y[5..10]:', dc.y.slice(5, 11).map(v => v.toFixed(3)).join(','));

// 9. 相平面: 无阻尼继电 → 极限环
const pp = phasePlaneSim('relay', 1, 0.1, 0.5, 0.05, 0.01, 0, 30, 6000);
console.log('相平面末段 |x|:', Math.max(...pp.xs.slice(-500)).toFixed(3), '前段|x|:', Math.max(...pp.xs.slice(0, 500)).toFixed(3));

// 10. 误差系数
const ec = errorConstants({ num: [2], den: [1, 1, 0] });
console.log('误差系数(型别I):', ec);
