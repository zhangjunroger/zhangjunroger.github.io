import { useEffect, useRef } from 'react';

export default function WaveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = (t: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      const layers = [
        { amp: 0.09, freq: 0.0035, speed: 0.00028, phase: 0, color: 'rgba(59,130,246,0.22)', offset: 0.55 },
        { amp: 0.07, freq: 0.0055, speed: 0.00042, phase: 1.2, color: 'rgba(6,182,212,0.22)', offset: 0.6 },
        { amp: 0.055, freq: 0.0075, speed: 0.00055, phase: 2.4, color: 'rgba(139,92,246,0.18)', offset: 0.65 },
      ];

      layers.forEach((l, idx) => {
        const baseY = h * l.offset;
        ctx.beginPath();
        ctx.moveTo(0, h);
        for (let x = 0; x <= w; x += 2) {
          const y =
            baseY +
            Math.sin(x * l.freq + t * l.speed + l.phase) * h * l.amp +
            Math.sin(x * l.freq * 2.3 + t * l.speed * 1.5 + l.phase) * h * l.amp * 0.35;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(w, h);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, baseY - h * l.amp, 0, h);
        grad.addColorStop(0, l.color);
        grad.addColorStop(1, 'rgba(15,23,42,0)');
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const y =
            baseY +
            Math.sin(x * l.freq + t * l.speed + l.phase) * h * l.amp +
            Math.sin(x * l.freq * 2.3 + t * l.speed * 1.5 + l.phase) * h * l.amp * 0.35;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = l.color.replace(/[\d.]+\)$/, `${Math.min(1, idx === 0 ? 0.6 : 0.45)})`);
        ctx.lineWidth = 1.4;
        ctx.stroke();
      });

      // pulse dots (signal markers)
      for (let i = 0; i < 6; i++) {
        const lx = ((t * 0.025 + i * 140) % (w + 100)) - 50;
        const ly = h * 0.55 + Math.sin(t * 0.0012 + i) * 18 + i * 8;
        const pulse = (Math.sin(t * 0.004 + i) + 1) / 2;
        ctx.beginPath();
        ctx.arc(lx, ly, 2.5 + pulse * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34,211,238,${0.25 + pulse * 0.5})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden="true"
    />
  );
}
