import { useEffect, useRef, useState } from 'react';

interface CountUpNumberProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
  startOnView?: boolean;
}

const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export default function CountUpNumber({
  end,
  duration = 1500,
  suffix = '',
  prefix = '',
  decimals = 0,
  className = '',
  startOnView = true,
}: CountUpNumberProps) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const start = () => {
      if (started.current) return;
      started.current = true;
      const startTime = performance.now();
      const startValue = 0;
      const animate = (now: number) => {
        const t = Math.min(1, (now - startTime) / duration);
        const eased = easeOutExpo(t);
        setValue(startValue + (end - startValue) * eased);
        if (t < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    };
    if (!startOnView) {
      start();
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) start();
        });
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [end, duration, startOnView]);

  const display =
    decimals > 0
      ? value.toFixed(decimals)
      : Math.round(value).toLocaleString('zh-CN');

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
