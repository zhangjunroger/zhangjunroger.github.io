import { Link } from 'react-router-dom';
import WaveBackground from './WaveBackground';
import { Sparkles, FlaskConical, Signal, ArrowRight, Bot, BookOpenCheck, Award } from 'lucide-react';

export default function HeroSection() {
  return (
    <section id="top" className="relative min-h-[100vh] pt-24 flex items-center overflow-hidden">
      <div className="absolute inset-0 bg-hero-gradient" />
      <div className="absolute inset-0 bg-grid opacity-70 mask-fade-b" />
      <WaveBackground />
      <div className="absolute inset-0 bg-noise opacity-40 mix-blend-overlay" />
      <div className="absolute top-1/4 -left-48 w-[500px] h-[500px] rounded-full bg-brand-600/30 blur-[130px]" />
      <div className="absolute bottom-0 -right-40 w-[560px] h-[560px] rounded-full bg-signal-600/25 blur-[140px]" />

      {/* floating formula watermarks */}
      <div className="formula-watermark top-[18%] left-[6%] text-5xl md:text-6xl animate-float" style={{ animationDelay: '0s' }}>
        G(s) = C(s)/R(s)
      </div>
      <div className="formula-watermark top-[55%] right-[5%] text-4xl md:text-5xl animate-float" style={{ animationDelay: '1.5s' }}>
        1 + G(s)H(s) = 0
      </div>
      <div className="formula-watermark bottom-[12%] left-[42%] text-3xl md:text-4xl animate-float" style={{ animationDelay: '3s' }}>
        y(∞) = limₛ→₀ s·Y(s)
      </div>

      <div className="container relative z-10 py-14 lg:py-24">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10 items-center">
          <div className="lg:col-span-7 space-y-8">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
                         bg-white/5 border border-white/10 backdrop-blur-md"
              style={{ animation: 'fadeUp .8s ease both' }}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300">2026 春季学期 · AI智慧教学升级版 3.0</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-signal-500/20 text-signal-300 border border-signal-500/30 ml-1">
                NEW
              </span>
            </div>

            <div className="space-y-5" style={{ animation: 'fadeUp .9s .1s ease both' }}>
              <h1 className="font-serif font-black text-white leading-[1.08] tracking-tight">
                <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-[64px]">
                  探索<span className="gradient-text">控制理论</span>的
                </span>
                <span className="block text-4xl sm:text-5xl md:text-6xl lg:text-[64px]">
                  无穷魅力与<span className="text-stroke text-transparent">工程之美</span>
                </span>
              </h1>
              <p className="text-slate-400 text-lg md:text-xl leading-relaxed max-w-2xl">
                从开环控制到智能算法，从数学建模到仿真实验。国内经典教材体系 + 4位资深教授主讲 +
                AI助教24小时在线答疑，用<strong className="text-signal-300">交互式可视化</strong>打通控制理论的任督二脉。
              </p>
            </div>

            <div
              className="flex flex-wrap items-center gap-4"
              style={{ animation: 'fadeUp 1s .25s ease both' }}
            >
              <Link to="/lab" className="btn-primary !py-3.5 !px-8 text-base">
                <FlaskConical className="w-5 h-5" />
                进入在线实验平台
              </Link>
              <Link to="/classroom" className="btn-secondary !py-3.5 !px-8 text-base">
                <Signal className="w-4 h-4" />
                智慧课堂 · 扫码签到答题
              </Link>
            </div>

            <div
              className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-6 border-t border-white/5"
              style={{ animation: 'fadeUp 1.1s .4s ease both' }}
            >
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['z1', 'z2', 'z3', 'z4', 'z5'].map((s, i) => (
                    <img
                      key={s}
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=hero${i}&backgroundColor=1e40af,06b6d4,f59e0b,8b5cf6,10b981`}
                      alt=""
                      className="w-9 h-9 rounded-full bg-slate-800 border-2 border-slate-900"
                    />
                  ))}
                </div>
                <div className="text-sm text-slate-400">
                  <span className="text-white font-semibold">12,580+</span> 同学已加入学习
                </div>
              </div>
              <div className="flex items-center gap-2 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M9.05.93a1 1 0 011.9 0l1.6 4.9a1 1 0 00.95.69h5.15a1 1 0 01.59 1.8l-4.17 3.03a1 1 0 00-.36 1.11l1.59 4.87a1 1 0 01-1.55 1.11l-4.17-3.03a1 1 0 00-1.18 0l-4.17 3.03a1 1 0 01-1.55-1.11l1.59-4.87a1 1 0 00-.36-1.11L.76 8.32a1 1 0 01.59-1.8h5.15a1 1 0 00.95-.69l1.6-4.9z" />
                  </svg>
                ))}
                <span className="text-sm text-slate-400 ml-1">
                  <span className="text-white font-semibold">4.9</span>/5.0 学员评价
                </span>
              </div>
            </div>
          </div>

          {/* AI floating card */}
          <div
            className="lg:col-span-5 relative"
            style={{ animation: 'fadeUp 1.2s .2s ease both' }}
          >
            <div className="absolute -inset-6 bg-gradient-to-br from-brand-500/20 via-signal-500/10 to-transparent rounded-[40px] blur-2xl" />
            <div className="relative glass-card rounded-3xl p-6 lg:p-7 shadow-glow">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-2xl bg-signal-400/40 blur-lg animate-pulse-slow" />
                    <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-signal-500 to-brand-600 flex items-center justify-center">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="text-white font-semibold">AI 助教 · 小控</div>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      在线 · 平均响应 1.2s
                    </div>
                  </div>
                </div>
                <button className="w-8 h-8 rounded-lg text-slate-400 hover:bg-white/5 flex items-center justify-center">
                  ⋯
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex-shrink-0 flex items-center justify-center text-xs">👤</div>
                  <div className="rounded-2xl rounded-tl-md bg-slate-800/80 px-4 py-2.5 text-sm text-slate-200 max-w-[85%]">
                    二阶系统超调量 σ% 的公式怎么推导的呀？
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-signal-500 to-brand-600 flex-shrink-0 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <div className="rounded-2xl rounded-tr-md bg-gradient-to-br from-brand-600/40 to-signal-500/30 border border-signal-500/20 px-4 py-3 text-sm text-slate-100 leading-relaxed">
                      <p className="mb-2">好问题！超调量定义为响应最大值与稳态值之差的百分比：</p>
                      <p className="font-mono bg-slate-950/50 rounded-lg px-3 py-2 text-signal-300 text-center">
                        σ% = e<sup>-πζ / √(1-ζ²)</sup> × 100%
                      </p>
                      <p className="mt-2 text-slate-300">由二阶欠阻尼单位阶跃响应 h(t) 求极大值点 t<sub>p</sub>=π/ω<sub>d</sub> 代入即得。需要我配动画演示吗？</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {['配动画演示', '给3道练习题', '对比时域指标', '再展开讲讲'].map((s) => (
                        <button
                          key={s}
                          className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-slate-300 hover:text-signal-300 hover:border-signal-500/40 hover:bg-signal-500/5 transition"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-950/40 border border-white/5">
                <input
                  placeholder="试试：什么是劳斯判据？"
                  className="flex-1 bg-transparent outline-none px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500"
                />
                <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-signal-500 to-brand-600 text-white text-sm font-medium hover:opacity-90 transition">
                  发送
                </button>
              </div>
            </div>

            {/* floating badges */}
            <div className="hidden sm:flex absolute -top-6 -left-6 glass-card rounded-2xl px-4 py-3 items-center gap-3 animate-float" style={{ animationDelay: '0.3s' }}>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                <BookOpenCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-xs text-slate-400">本周学习</div>
                <div className="text-sm font-semibold text-white">8.5 小时 · 进度 <span className="text-signal-300">+23%</span></div>
              </div>
            </div>

            <div className="hidden sm:flex absolute -bottom-4 -right-4 glass-card rounded-2xl px-4 py-3 items-center gap-3 animate-float" style={{ animationDelay: '1.2s' }}>
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                <Award className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-xs text-slate-400">全国排名</div>
                <div className="text-sm font-semibold text-white">Top <span className="text-amber-300">128</span> / 12,580</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
