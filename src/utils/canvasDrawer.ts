export interface DrawAxisOptions {
  xLabel?: string;
  yLabel?: string;
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
  xTicks?: number;
  yTicks?: number;
  grid?: boolean;
}

export const drawAxes = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opts: DrawAxisOptions = {}
) => {
  const padL = 52;
  const padR = 16;
  const padT = 16;
  const padB = 40;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  ctx.save();
  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(148,163,184,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.rect(padL, padT, plotW, plotH);
  ctx.stroke();

  if (opts.grid !== false) {
    const xTicks = opts.xTicks ?? 5;
    const yTicks = opts.yTicks ?? 4;
    ctx.strokeStyle = 'rgba(148,163,184,0.08)';
    for (let i = 1; i < xTicks; i++) {
      const x = padL + (plotW * i) / xTicks;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, padT + plotH);
      ctx.stroke();
    }
    for (let j = 1; j < yTicks; j++) {
      const y = padT + (plotH * j) / yTicks;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
    }
  }

  ctx.fillStyle = 'rgba(148,163,184,0.85)';
  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const yTicks = opts.yTicks ?? 4;
  const yMin = opts.yMin ?? 0;
  const yMax = opts.yMax ?? 1;
  for (let j = 0; j <= yTicks; j++) {
    const y = padT + plotH - (plotH * j) / yTicks;
    const v = yMin + ((yMax - yMin) * j) / yTicks;
    ctx.fillText(v.toFixed(1), padL - 8, y);
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  const xTicks = opts.xTicks ?? 5;
  const xMin = opts.xMin ?? 0;
  const xMax = opts.xMax ?? 10;
  for (let i = 0; i <= xTicks; i++) {
    const x = padL + (plotW * i) / xTicks;
    const v = xMin + ((xMax - xMin) * i) / xTicks;
    ctx.fillText(v.toFixed(1), x, padT + plotH + 6);
  }

  if (opts.xLabel) {
    ctx.fillStyle = 'rgba(226,232,240,0.7)';
    ctx.font = '12px "Noto Sans SC", sans-serif';
    ctx.fillText(opts.xLabel, padL + plotW / 2, h - 12);
  }
  if (opts.yLabel) {
    ctx.save();
    ctx.fillStyle = 'rgba(226,232,240,0.7)';
    ctx.font = '12px "Noto Sans SC", sans-serif';
    ctx.translate(14, padT + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(opts.yLabel, 0, 0);
    ctx.restore();
  }

  ctx.restore();
  return { padL, padR, padT, padB, plotW, plotH };
};

export const drawCurve = (
  ctx: CanvasRenderingContext2D,
  xs: number[],
  ys: number[],
  regions: ReturnType<typeof drawAxes>,
  color: string = '#06b6d4',
  xMin: number = 0,
  xMax: number = 10,
  yMin: number = 0,
  yMax: number = 1,
  lineWidth: number = 2.2,
  dashed: boolean = false
) => {
  if (xs.length !== ys.length || xs.length === 0) return;
  const { padL, padT, plotW, plotH } = regions;

  ctx.save();
  ctx.beginPath();
  if (dashed) ctx.setLineDash([5, 4]);
  for (let i = 0; i < xs.length; i++) {
    const xPx = padL + ((xs[i] - xMin) / (xMax - xMin)) * plotW;
    const yClamped = Math.max(yMin - 1, Math.min(yMax + 1, ys[i]));
    const yPx = padT + (1 - (yClamped - yMin) / (yMax - yMin)) * plotH;
    if (i === 0) ctx.moveTo(xPx, yPx);
    else ctx.lineTo(xPx, yPx);
  }
  const gradient = ctx.createLinearGradient(padL, padT, padL + plotW, padT);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, color + 'cc');
  ctx.strokeStyle = gradient;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();

  if (!dashed && ys.every(v => v >= yMin)) {
    ctx.setLineDash([]);
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.lineTo(padL, padT + plotH);
    ctx.closePath();
    ctx.fillStyle = color + '15';
    ctx.fill();
  }
  ctx.restore();
};

export const drawSPlaneGrid = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rangeRe: number = 6,
  rangeIm: number = 6
) => {
  const padL = 60, padR = 20, padT = 20, padB = 40;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const cx = padL + plotW / 2;
  const cy = padT + plotH / 2;
  const sx = plotW / (2 * rangeRe);
  const sy = plotH / (2 * rangeIm);

  ctx.save();
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(148,163,184,0.08)';
  ctx.lineWidth = 1;
  for (let i = -rangeRe; i <= rangeRe; i++) {
    const x = cx + i * sx;
    ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
  }
  for (let j = -rangeIm; j <= rangeIm; j++) {
    const y = cy + j * sy;
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(226,232,240,0.5)';
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(padL, cy); ctx.lineTo(padL + plotW, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, padT); ctx.lineTo(cx, padT + plotH); ctx.stroke();
  ctx.fillStyle = 'rgba(148,163,184,0.8)';
  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  for (let i = -rangeRe; i <= rangeRe; i += 2) {
    if (i === 0) continue;
    ctx.fillText(String(i), cx + i * sx, cy + 4);
  }
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let j = -rangeIm; j <= rangeIm; j += 2) {
    if (j === 0) continue;
    ctx.fillText(String(j), cx - 4, cy - j * sy);
  }
  ctx.fillStyle = 'rgba(226,232,240,0.65)';
  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('jω', cx - 4, padT + 4);
  ctx.textAlign = 'left';
  ctx.fillText('σ', padL + plotW - 14, cy - 12);
  ctx.restore();

  return { padL, padR, padT, padB, plotW, plotH, cx, cy, sx, sy };
};

export const drawPole = (
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, sx: number, sy: number,
  re: number, im: number, color: string = '#f43f5e', size: number = 10
) => {
  const x = cx + re * sx;
  const y = cy - im * sy;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(x - size, y - size); ctx.lineTo(x + size, y + size);
  ctx.moveTo(x + size, y - size); ctx.lineTo(x - size, y + size);
  ctx.stroke();
  ctx.restore();
};

export const drawZero = (
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, sx: number, sy: number,
  re: number, im: number, color: string = '#10b981', size: number = 10
) => {
  const x = cx + re * sx;
  const y = cy - im * sy;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};
