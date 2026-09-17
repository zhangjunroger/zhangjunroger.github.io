// ============ 实验画布绘图工具箱 ============
// 所有实验共用的 canvas 绘制原语：坐标系、曲线、动画元素、机构简图等。

export interface PlotRegion {
  padL: number; padR: number; padT: number; padB: number;
  plotW: number; plotH: number;
}

export interface AxisOpts {
  xMin?: number; xMax?: number; yMin?: number; yMax?: number;
  xTicks?: number; yTicks?: number;
  xLabel?: string; yLabel?: string;
  xTickFmt?: (v: number) => string;
  yTickFmt?: (v: number) => string;
  gridColor?: string;
  bgColor?: string;
  logX?: boolean;
}

export const MONO = '"JetBrains Mono", monospace';
export const SANS = '"Noto Sans SC", sans-serif';

export const COLORS = {
  cyan: '#22d3ee',
  cyanDeep: '#06b6d4',
  blue: '#60a5fa',
  amber: '#fbbf24',
  orange: '#fb923c',
  rose: '#fb7185',
  green: '#34d399',
  violet: '#a78bfa',
  slate: '#94a3b8',
  white: '#e2e8f0',
};

export function plotAxes(
  ctx: CanvasRenderingContext2D, w: number, h: number, opts: AxisOpts = {}
): PlotRegion & { xMin: number; xMax: number; yMin: number; yMax: number } {
  const padL = opts.yLabel ? 54 : 46;
  const padR = 18, padT = 18, padB = 42;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const xMin = opts.xMin ?? 0, xMax = opts.xMax ?? 10;
  const yMin = opts.yMin ?? 0, yMax = opts.yMax ?? 1;

  ctx.save();
  ctx.clearRect(0, 0, w, h);
  if (opts.bgColor) {
    ctx.fillStyle = opts.bgColor;
    ctx.beginPath();
    ctx.roundRect(padL, padT, plotW, plotH, 8);
    ctx.fill();
  }
  // 网格
  ctx.strokeStyle = opts.gridColor ?? 'rgba(148,163,184,0.09)';
  ctx.lineWidth = 1;
  const xT = opts.xTicks ?? 5, yT = opts.yTicks ?? 4;
  for (let i = 0; i <= xT; i++) {
    const x = Math.round(padL + (plotW * i) / xT) + 0.5;
    ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
  }
  for (let j = 0; j <= yT; j++) {
    const y = Math.round(padT + (plotH * j) / yT) + 0.5;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
  }
  // 边框
  ctx.strokeStyle = 'rgba(148,163,184,0.25)';
  ctx.beginPath();
  ctx.rect(padL, padT, plotW, plotH);
  ctx.stroke();
  // 刻度
  ctx.fillStyle = 'rgba(148,163,184,0.85)';
  ctx.font = `10px ${MONO}`;
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let j = 0; j <= yT; j++) {
    const v = yMin + ((yMax - yMin) * j) / yT;
    const label = opts.yTickFmt ? opts.yTickFmt(v) : trimNum(v);
    ctx.fillText(label, padL - 7, padT + plotH - (plotH * j) / yT);
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let i = 0; i <= xT; i++) {
    const v = xMin + ((xMax - xMin) * i) / xT;
    const label = opts.xTickFmt ? opts.xTickFmt(v) : trimNum(v);
    ctx.fillText(label, padL + (plotW * i) / xT, padT + plotH + 7);
  }
  if (opts.xLabel) {
    ctx.fillStyle = 'rgba(203,213,225,0.75)';
    ctx.font = `12px ${SANS}`;
    ctx.fillText(opts.xLabel, padL + plotW / 2, h - 14);
  }
  if (opts.yLabel) {
    ctx.save();
    ctx.fillStyle = 'rgba(203,213,225,0.75)';
    ctx.font = `12px ${SANS}`;
    ctx.translate(15, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(opts.yLabel, 0, 0);
    ctx.restore();
  }
  ctx.restore();
  return { padL, padR, padT, padB, plotW, plotH, xMin, xMax, yMin, yMax };
}

function trimNum(v: number): string {
  if (Math.abs(v) >= 1000) return v.toExponential(0);
  const s = Math.abs(v) >= 10 ? v.toFixed(0) : Math.abs(v) >= 1 ? v.toFixed(1) : v.toFixed(2);
  return s;
}

export function pxX(reg: ReturnType<typeof plotAxes>, x: number): number {
  return reg.padL + ((x - reg.xMin) / (reg.xMax - reg.xMin)) * reg.plotW;
}
export function pxY(reg: ReturnType<typeof plotAxes>, y: number): number {
  return reg.padT + (1 - (y - reg.yMin) / (reg.yMax - reg.yMin)) * reg.plotH;
}

export function drawPolyline(
  ctx: CanvasRenderingContext2D,
  reg: ReturnType<typeof plotAxes>,
  xs: number[], ys: number[],
  color: string, lineWidth = 2.2,
  upto?: number,
  dash: number[] = []
) {
  if (xs.length === 0) return;
  const xMin = reg.xMin, xMax = reg.xMax, yMin = reg.yMin, yMax = reg.yMax;
  ctx.save();
  ctx.beginPath();
  ctx.rect(reg.padL, reg.padT - 4, reg.plotW, reg.plotH + 8);
  ctx.clip();
  ctx.setLineDash(dash);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  let started = false;
  const n = upto !== undefined ? upto : xs.length;
  for (let i = 0; i < n && i < xs.length; i++) {
    const X = pxX(reg, xs[i]);
    const Y = pxY(reg, Math.max(yMin - (yMax - yMin), Math.min(yMax + (yMax - yMin), ys[i])));
    if (!started) { ctx.moveTo(X, Y); started = true; }
    else ctx.lineTo(X, Y);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawDot(
  ctx: CanvasRenderingContext2D, x: number, y: number,
  r: number, color: string, glow = true
) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
  }
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

export function drawDashedLine(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  color: string, dash: number[] = [5, 4], width = 1.2
) {
  ctx.save();
  ctx.setLineDash(dash);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.restore();
}

export function drawLabel(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, text: string,
  color: string, size = 11, font: 'mono' | 'sans' = 'mono',
  align: CanvasTextAlign = 'left'
) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${size}px ${font === 'mono' ? MONO : SANS}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

// 带背景的小标签
export function drawChip(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, text: string,
  bg: string, fg: string, size = 10
) {
  ctx.save();
  ctx.font = `${size}px ${MONO}`;
  const w = ctx.measureText(text).width + 10;
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(x, y - size / 2 - 4, w, size + 8, 5);
  ctx.fill();
  ctx.fillStyle = fg;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 5, y);
  ctx.restore();
  return w;
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  color: string, width = 1.6, headLen = 7
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - headLen * Math.cos(ang) * 0.6, y2 - headLen * Math.sin(ang) * 0.6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(ang - 0.42), y2 - headLen * Math.sin(ang - 0.42));
  ctx.lineTo(x2 - headLen * Math.cos(ang + 0.42), y2 - headLen * Math.sin(ang + 0.42));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 弹簧（简图）
export function drawSpring(
  ctx: CanvasRenderingContext2D,
  x1: number, y: number, x2: number,
  color: string, coils = 8, amp = 8
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  const len = x2 - x1;
  const seg = len / (coils + 1);
  for (let i = 0; i <= coils; i++) {
    const x = x1 + seg * (i + 0.5);
    ctx.lineTo(x, y + (i % 2 === 0 ? -amp : amp));
  }
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}

// 阻尼器（简图）
export function drawDamper(
  ctx: CanvasRenderingContext2D,
  x1: number, y: number, x2: number, color: string
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  const mid = (x1 + x2) / 2;
  ctx.beginPath();
  ctx.moveTo(x1, y); ctx.lineTo(mid - 8, y);
  ctx.moveTo(mid - 8, y - 7); ctx.lineTo(mid - 8, y + 7);
  ctx.moveTo(mid - 8, y); ctx.lineTo(mid + 8, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(mid + 8, y - 9); ctx.lineTo(mid + 8, y + 9);
  ctx.stroke();
  ctx.moveTo(mid + 8, y); ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}

// 质量块
export function drawMass(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  fill: string, label?: string
) {
  ctx.save();
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, fill);
  grad.addColorStop(1, 'rgba(30,41,59,0.9)');
  ctx.fillStyle = grad;
  ctx.strokeStyle = 'rgba(226,232,240,0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();
  if (label) {
    ctx.fillStyle = 'rgba(15,23,42,0.95)';
    ctx.font = `bold 13px ${SANS}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w / 2, y + h / 2);
  }
  ctx.restore();
}

// 极点 × / 零点 ○
export function drawPoleZero(
  ctx: CanvasRenderingContext2D, x: number, y: number,
  kind: 'pole' | 'zero', color: string, size = 7, glow = false
) {
  ctx.save();
  if (glow) { ctx.shadowColor = color; ctx.shadowBlur = 10; }
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  if (kind === 'pole') {
    ctx.beginPath();
    ctx.moveTo(x - size, y - size); ctx.lineTo(x + size, y + size);
    ctx.moveTo(x + size, y - size); ctx.lineTo(x - size, y + size);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// 填充曲线下方区域
export function fillUnderCurve(
  ctx: CanvasRenderingContext2D,
  reg: ReturnType<typeof plotAxes>,
  xs: number[], ys: number[], color: string, upto?: number
) {
  const n = upto !== undefined ? upto : xs.length;
  if (n < 2) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(reg.padL, reg.padT, reg.plotW, reg.plotH);
  ctx.clip();
  ctx.beginPath();
  ctx.moveTo(pxX(reg, xs[0]), pxY(reg, Math.max(reg.yMin, ys[0])));
  for (let i = 1; i < n; i++) {
    ctx.lineTo(pxX(reg, xs[i]), pxY(reg, Math.max(reg.yMin, ys[i])));
  }
  ctx.lineTo(pxX(reg, xs[n - 1]), pxY(reg, reg.yMin));
  ctx.lineTo(pxX(reg, xs[0]), pxY(reg, reg.yMin));
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, reg.padT, 0, reg.padT + reg.plotH);
  grad.addColorStop(0, color + '44');
  grad.addColorStop(1, color + '05');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
}

// 迷你面板标题
export function panelTitle(
  ctx: CanvasRenderingContext2D, w: number, text: string, sub?: string
) {
  ctx.save();
  ctx.fillStyle = 'rgba(226,232,240,0.9)';
  ctx.font = `bold 12px ${SANS}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(text, 14, 8);
  if (sub) {
    ctx.fillStyle = 'rgba(148,163,184,0.7)';
    ctx.font = `10px ${SANS}`;
    const tw = ctx.measureText(text).width;
    ctx.fillText(sub, 18 + tw, 9);
  }
  ctx.restore();
}
