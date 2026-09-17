import { useEffect, useRef, useState, useCallback } from 'react';

// ============ 实验动画循环 Hook ============
// 管理 requestAnimationFrame 播放/暂停/复位/倍速，输出仿真时钟 t（秒）。
export function useSimLoop(opts: { duration: number; autoPlay?: boolean; speed?: number }) {
  const { duration, autoPlay = true } = opts;
  const [playing, setPlaying] = useState(autoPlay);
  const [speed, setSpeed] = useState(opts.speed ?? 1);
  const [t, setT] = useState(0);
  const [cycle, setCycle] = useState(0);           // 复位代数，供子组件重置内部状态
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    if (!playing) return;
    lastRef.current = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastRef.current) / 1000) * speed;
      lastRef.current = now;
      tRef.current += dt;
      if (tRef.current >= duration) {
        tRef.current = 0;
        setCycle(c => c + 1);   // 循环播放
      }
      setT(tRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, speed, duration]);

  const reset = useCallback(() => {
    tRef.current = 0;
    setT(0);
    setCycle(c => c + 1);
  }, []);

  const replay = useCallback(() => {
    tRef.current = 0;
    setT(0);
    setCycle(c => c + 1);
    setPlaying(true);
  }, []);

  return { t, playing, setPlaying, speed, setSpeed, reset, replay, cycle };
}

// 数值插值：t 时刻在时间序列中的响应值（线性插值）
export function sampleAt(ts: number[], ys: number[], t: number): { y: number; idx: number } {
  const n = ts.length;
  if (n === 0) return { y: 0, idx: 0 };
  if (t <= ts[0]) return { y: ys[0], idx: 0 };
  if (t >= ts[n - 1]) return { y: ys[n - 1], idx: n - 1 };
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (ts[mid] <= t) lo = mid; else hi = mid;
  }
  const f = (t - ts[lo]) / (ts[hi] - ts[lo] || 1);
  return { y: ys[lo] + f * (ys[hi] - ys[lo]), idx: lo };
}
