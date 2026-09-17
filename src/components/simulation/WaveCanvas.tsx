import { useEffect, useRef } from 'react';
import {
  drawAxes, drawCurve, drawSPlaneGrid, drawPole, drawZero,
} from '@/utils/canvasDrawer';
import {
  stepResponseSecondOrder, bodeMagnitude, bodePhase,
  generateTimeSeries, generateLogFreq, overshoot, settlingTime, risingTime,
} from '@/utils/controlMath';

interface Props {
  type: 'step' | 'bode' | 'rootlocus';
  params: Record<string, number>;
  width?: number;
  height?: number;
}

export default function WaveCanvas({ type, params, width = 720, height = 300 }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = width * dpr;
    c.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (type === 'step') {
      const wn = params.wn ?? 2;
      const zeta = params.zeta ?? 0.45;
      const K = params.K ?? 1;
      const os = overshoot(zeta);
      const T = Math.max(5, settlingTime(wn, zeta) * 1.4);
      const ts = generateTimeSeries(T, 600);
      const ys = ts.map((t) => stepResponseSecondOrder(t, wn, zeta, K));
      const reg = drawAxes(ctx, width, height, {
        xMin: 0, xMax: T, yMin: 0, yMax: Math.max(1.6, K + K * os / 80),
        xTicks: 6, yTicks: 5, xLabel: '时间 t (s)', yLabel: '阶跃响应 h(t)',
      });
      drawCurve(ctx, ts, Array(ts.length).fill(K), reg, '#94a3b8', 0, T, 0, K + 0.4, 1.4, true);
      drawCurve(ctx, ts, ys, reg, '#06b6d4', 0, T, 0, K + 0.4);

      const maxY = Math.max(...ys);
      const peakIdx = ys.indexOf(maxY);
      const peakT = ts[peakIdx];
      const { padL, padT, plotW, plotH } = reg;
      const xPx = padL + (peakT / T) * plotW;
      const yPx = padT + (1 - (maxY / (K + 0.4))) * plotH;
      ctx.beginPath();
      ctx.arc(xPx, yPx, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(xPx, padT + plotH);
      ctx.lineTo(xPx, yPx);
      ctx.lineTo(padL, yPx);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = '11px "JetBrains Mono"';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`σ%=${os.toFixed(1)}%`, xPx + 8, yPx - 10);
      ctx.fillText(`tr=${risingTime(wn, zeta).toFixed(2)}s ts=${settlingTime(wn, zeta).toFixed(2)}s`, padL + 6, padT + 14);
    } else if (type === 'bode') {
      const K = params.K ?? 10;
      const T1 = params.T1 ?? 0.5;
      const T2 = params.T2 ?? 0.1;
      const ws = generateLogFreq(0.01, 100, 500);
      const mags = ws.map((w) => bodeMagnitude(w, K, T1, T2));
      const hs = Math.floor(height / 2) - 8;
      const regTop = drawAxes(ctx, width, hs, {
        xMin: Math.log10(0.01), xMax: Math.log10(100), yMin: -40, yMax: 60,
        xTicks: 5, yTicks: 4, yLabel: '|G| dB',
      });
      const logws = ws.map((w) => Math.log10(w));
      drawCurve(ctx, logws, mags, regTop, '#06b6d4', Math.log10(0.01), Math.log10(100), -40, 60);

      ctx.save();
      ctx.translate(0, hs + 16);
      const phs = ws.map((w) => bodePhase(w, K, T1, T2));
      const regBot = drawAxes(ctx, width, hs, {
        xMin: Math.log10(0.01), xMax: Math.log10(100), yMin: -180, yMax: 0,
        xTicks: 5, yTicks: 4, xLabel: '频率 ω (log)', yLabel: '∠G (°)',
      });
      drawCurve(ctx, logws, phs, regBot, '#f472b6', Math.log10(0.01), Math.log10(100), -180, 0);
      ctx.restore();

      const lblX = (w: number) => regTop.padL + ((Math.log10(w) - Math.log10(0.01)) / (Math.log10(100) - Math.log10(0.01))) * regTop.plotW;
      const freqTicks = [0.1, 1, 10, 100];
      ctx.fillStyle = 'rgba(148,163,184,0.85)';
      ctx.font = '10px "JetBrains Mono"';
      ctx.textAlign = 'center';
      freqTicks.forEach((fw) => {
        ctx.fillText(String(fw), lblX(fw), regTop.padT + hs + 26);
      });
    } else if (type === 'rootlocus') {
      const p1 = params.p1 ?? -1;
      const p2 = params.p2 ?? -2;
      const z1 = params.z1 ?? 5;
      const plane = drawSPlaneGrid(ctx, width, height, 8, 6);
      drawPole(ctx, plane.cx, plane.cy, plane.sx, plane.sy, p1, 0, '#f43f5e');
      drawPole(ctx, plane.cx, plane.cy, plane.sx, plane.sy, p2, 0, '#f43f5e');
      drawZero(ctx, plane.cx, plane.cy, plane.sx, plane.sy, z1, 0, '#10b981');

      const branches = 2;
      const Kmax = 40;
      for (let b = 0; b < branches; b++) {
        ctx.beginPath();
        for (let k = 0; k <= 120; k++) {
          const K = (Kmax * k) / 120;
          const mid = (p1 + p2) / 2;
          const dist = Math.abs(p1 - p2) / 2;
          const sRe = mid - K / 2 + z1 / 2 - (z1 + Math.abs(mid) + 2) / (1 + K / 30);
          const sIm = Math.sqrt(Math.max(0, -((K - z1 + 2) ** 2 - (dist * 2) ** 2))) * 0.55;
          const sign = b === 0 ? 1 : -1;
          const px = plane.cx + sRe * plane.sx;
          const py = plane.cy - sign * sIm * plane.sy;
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = 'rgba(6,182,212,0.85)';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.stroke();
      }
      for (let i = 0; i < 15; i++) {
        const K = (Kmax * i) / 14;
        const mid = (p1 + p2) / 2;
        const sRe = mid - K / 2 + z1 / 2 - (z1 + Math.abs(mid) + 2) / (1 + K / 30);
        const px = plane.cx + sRe * plane.sx;
        const py = plane.cy;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(251,191,36,0.9)';
        ctx.fill();
      }
    }
  }, [type, params, width, height]);

  return <canvas ref={ref} className="w-full h-auto rounded-xl" style={{ aspectRatio: `${width}/${height}` }} />;
}
