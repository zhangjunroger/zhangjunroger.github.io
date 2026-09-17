import { useEffect, useRef, useState, type ReactNode } from 'react';
import clsx from 'clsx';

interface ScrollRevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  y?: number;
  duration?: number;
  threshold?: number;
  once?: boolean;
}

export default function ScrollReveal({
  children,
  delay = 0,
  className = '',
  as = 'div',
  y = 40,
  duration = 700,
  threshold = 0.15,
  once = true,
}: ScrollRevealProps) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLElement | null>(null);
  const Tag = as as keyof JSX.IntrinsicElements;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible(true);
            if (once) io.unobserve(el);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, once]);

  const style: React.CSSProperties = {
    transform: visible ? 'translateY(0)' : `translateY(${y}px)`,
    opacity: visible ? 1 : 0,
    transition: `transform ${duration}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, opacity ${duration}ms ease ${delay}ms`,
    willChange: 'transform, opacity',
  };

  const props = {
    ref: ref as never,
    style,
    className: clsx(className),
  };

  // @ts-expect-error dynamic tag
  return <Tag {...props}>{children}</Tag>;
}
