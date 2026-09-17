import { Activity, Mail, Phone, MapPin, Github, BookOpen, MessageCircle, ChevronUp } from 'lucide-react';

const cols = [
  {
    title: '课程内容',
    links: ['课程大纲', '教学视频', '课件下载', '仿真实验', '章节练习', '期末考试'],
  },
  {
    title: '学习支持',
    links: ['常见问题', '学习指南', 'AI助教', '学习社区', '教师答疑', '学习建议'],
  },
  {
    title: '友情链接',
    links: ['教育部 MOOC 平台', '中国大学 MOOC', '学堂在线', 'MATLAB 官网', '控制工程学报', 'IEEE Xplore'],
  },
];

export default function Footer() {
  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  return (
    <footer className="relative mt-24 border-t border-white/5 bg-slate-950/70 backdrop-blur-sm">
      <div className="absolute inset-0 bg-glow-blue opacity-50 pointer-events-none" />
      <div className="container relative py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <a href="#top" className="flex items-center gap-3 mb-5">
              <div className="relative w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center border border-white/10">
                <Activity className="w-6 h-6 text-signal-400" />
              </div>
              <div>
                <div className="font-serif font-bold text-white text-lg">自动控制原理</div>
                <div className="text-[11px] text-slate-400 tracking-[0.2em] uppercase">AI Wisdom Course</div>
              </div>
            </a>
            <p className="text-slate-400 leading-relaxed max-w-md mb-6">
              面向新时代工科人才培养的AI智慧课程，将抽象的控制理论变得可视、可交互、可理解。
              12,580+ 位同学正在一起学习，加入我们，掌握工程世界的核心方法论。
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Mail className="w-4 h-4 text-signal-400" />
                control_course@university.edu.cn
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Phone className="w-4 h-4 text-signal-400" />
                +86 010-12345678 (教学办)
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <MapPin className="w-4 h-4 text-signal-400" />
                自动化学院 · 工程楼 A座 402室
              </div>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <a href="#" className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-signal-500/40 transition">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-signal-500/40 transition">
                <MessageCircle className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-lg border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-signal-500/40 transition">
                <BookOpen className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-7 grid gap-8 grid-cols-3">
            {cols.map((col) => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold text-white mb-4 tracking-wide">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm text-slate-400 hover:text-signal-400 transition-colors">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © 2026 自动化学院《自动控制原理》课程组 · All rights reserved · 京ICP备 00000000号
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <a href="#" className="hover:text-slate-300 transition">用户协议</a>
            <a href="#" className="hover:text-slate-300 transition">隐私政策</a>
            <button
              onClick={toTop}
              className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-signal-500/40 hover:text-white transition"
            >
              返回顶部 <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
