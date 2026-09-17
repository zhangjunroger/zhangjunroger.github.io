import { useEffect, useRef } from 'react';

export interface WordCloudItem {
  word: string;
  count: number;
  color?: string;
}

interface PlacedWord extends WordCloudItem {
  x: number; y: number; size: number; rotate: boolean;
}

// ============ Canvas 词云（阿基米德螺旋布局，无外部依赖） ============
export default function WordCloud(p: {
  words: WordCloudItem[];
  width?: number;
  height?: number;
  palette?: string[];
  emptyText?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const W = p.width ?? 640;
  const H = p.height ?? 360;
  const palette = p.palette ?? ['#22d3ee', '#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#fb7185'];

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = W * dpr;
    c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const words = [...p.words].sort((a, b) => b.count - a.count).slice(0, 60);
    if (words.length === 0) {
      ctx.fillStyle = 'rgba(148,163,184,0.5)';
      ctx.font = '13px "Noto Sans SC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.emptyText ?? '暂无数据，等待学生扫码参与…', W / 2, H / 2);
      return;
    }

    const maxC = words[0].count;
    const minC = words[words.length - 1].count;
    const maxSize = Math.min(W, H) * 0.17;
    const minSize = 12;

    // 用离屏 canvas 检测像素碰撞
    const off = document.createElement('canvas');
    off.width = W; off.height = H;
    const octx = off.getContext('2d')!;
    const imageData = octx.getImageData(0, 0, W, H);
    const occupied = new Uint8Array(W * H);

    const placed: PlacedWord[] = [];
    words.forEach((w, i) => {
      const t = maxC === minC ? 0.5 : (w.count - minC) / (maxC - minC);
      const size = Math.round(minSize + t * (maxSize - minSize));
      const rotate = i % 4 === 3 && size < maxSize * 0.55;
      ctx.save();
      ctx.font = `600 ${size}px "Noto Sans SC", sans-serif`;
      const tw = ctx.measureText(w.word).width;
      const th = size * 1.1;
      // 阿基米德螺旋找位置
      let bx = W / 2, by = H / 2, found = false;
      for (let step = 0; step < 2200 && !found; step++) {
        const a = step * 0.35;
        const r = 3.2 * Math.sqrt(step);
        const cx = W / 2 + r * Math.cos(a) * (W > H ? 1.55 : 1);
        const cy = H / 2 + r * Math.sin(a);
        if (cx - tw / 2 < 4 || cx + tw / 2 > W - 4 || cy - th / 2 < 4 || cy + th / 2 > H - 4) continue;
        // 碰撞检测（粗粒度：每2px采样）
        let collide = false;
        const x0 = Math.max(0, Math.floor(cx - tw / 2));
        const x1 = Math.min(W - 1, Math.ceil(cx + tw / 2));
        const y0 = Math.max(0, Math.floor(cy - th / 2));
        const y1 = Math.min(H - 1, Math.ceil(cy + th / 2));
        for (let yy = y0; yy <= y1 && !collide; yy += 2) {
          for (let xx = x0; xx <= x1 && !collide; xx += 2) {
            if (occupied[yy * W + xx]) collide = true;
          }
        }
        if (!collide) { bx = cx; by = cy; found = true; }
      }
      if (!found && placed.length > 0) return; // 放不下就跳过
      // 标记占用
      const x0 = Math.max(0, Math.floor(bx - tw / 2));
      const x1 = Math.min(W - 1, Math.ceil(bx + tw / 2));
      const y0 = Math.max(0, Math.floor(by - th / 2));
      const y1 = Math.min(H - 1, Math.ceil(by + th / 2));
      for (let yy = y0; yy <= y1; yy++)
        for (let xx = x0; xx <= x1; xx++) occupied[yy * W + xx] = 1;

      const color = w.color ?? palette[i % palette.length];
      ctx.save();
      if (rotate) {
        ctx.translate(bx, by);
        ctx.rotate(-Math.PI / 2);
        ctx.fillStyle = color;
        ctx.shadowColor = color + '66';
        ctx.shadowBlur = 8;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `600 ${size}px "Noto Sans SC", sans-serif`;
        ctx.fillText(w.word, 0, 0);
      } else {
        ctx.fillStyle = color;
        ctx.shadowColor = color + '55';
        ctx.shadowBlur = 6;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `600 ${size}px "Noto Sans SC", sans-serif`;
        ctx.fillText(w.word, bx, by);
      }
      ctx.restore();
      placed.push({ ...w, x: bx, y: by, size, rotate });
    });
    void imageData;
    void octx;
    void off;
  }, [p.words, W, H, palette, p.emptyText]);

  return (
    <canvas
      ref={ref}
      className="w-full h-auto rounded-xl"
      style={{ aspectRatio: `${W}/${H}` }}
    />
  );
}
