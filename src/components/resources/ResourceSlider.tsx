import { useRef, useState, useEffect } from 'react';
import SectionTitle from '@/components/common/SectionTitle';
import ScrollReveal from '@/components/common/ScrollReveal';
import { courseApi } from '@/lib/api';
import { mockResources } from '@/data/mockResources';
import {
  FileText, PlayCircle, Presentation, BookOpen,
  Download, ChevronLeft, ChevronRight, Eye, Clock, X, Loader2
} from 'lucide-react';

const typeMap = {
  pdf: { icon: FileText, color: 'from-rose-500 to-red-500', label: 'PDF文档', bg: 'from-rose-500/20 to-red-500/10' },
  video: { icon: PlayCircle, color: 'from-violet-500 to-fuchsia-500', label: '教学视频', bg: 'from-violet-500/20 to-fuchsia-500/10' },
  ppt: { icon: Presentation, color: 'from-amber-500 to-orange-500', label: '课件PPT', bg: 'from-amber-500/20 to-orange-500/10' },
  reference: { icon: BookOpen, color: 'from-emerald-500 to-teal-500', label: '参考资料', bg: 'from-emerald-500/20 to-teal-500/10' },
};

export default function ResourceSlider() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [resources, setResources] = useState(mockResources);
  const [preview, setPreview] = useState<any | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    courseApi.resources().then(list => {
      if (list && list.length) setResources(list as any);
    }).catch(() => {/* mock 兜底 */});
  }, []);

  const scroll = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 420, behavior: 'smooth' });
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleDownload = async (r: any) => {
    setDownloading(r.id);
    // 模拟下载过程（实际可对接后端文件下载接口）
    setTimeout(() => {
      setDownloading(null);
      showToast(`📥 "${r.title}" 下载已开始`);
    }, 800);
  };

  return (
    <section id="resources" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-brand-950/20 to-slate-950" />
      <div className="container relative">
        <div className="flex items-end justify-between mb-12 gap-4 flex-wrap">
          <ScrollReveal className="min-w-0 flex-1">
            <SectionTitle
              eyebrow="Learning Resources"
              title="丰富的学习资源 · 随时下载随时看"
              subtitle="120+教学视频、80+课件PPT、历年真题、MATLAB源码、权威参考文献 — 只为让你学透每一个知识点"
              icon={<BookOpen className="w-3.5 h-3.5" />}
            />
          </ScrollReveal>
          <ScrollReveal delay={120} className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => scroll(-1)}
              className="w-11 h-11 rounded-xl glass-card hover:border-signal-500/40 text-slate-300 hover:text-white transition flex items-center justify-center"
              aria-label="向左滚动"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll(1)}
              className="w-11 h-11 rounded-xl glass-card hover:border-signal-500/40 text-slate-300 hover:text-white transition flex items-center justify-center"
              aria-label="向右滚动"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </ScrollReveal>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none hidden md:block" />
        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none hidden md:block" />

        <div
          ref={scrollRef}
          className="container overflow-x-auto scrollbar-hidden snap-x snap-mandatory -mx-4 md:mx-0 md:overflow-x-hidden"
        >
          <div className="flex gap-5 md:gap-6 px-4 md:px-0 pb-2" style={{ width: 'max-content' }}>
            {resources.map((r: any, i) => {
              const tm = typeMap[r.type as keyof typeof typeMap] || typeMap.pdf;
              const Icon = tm.icon;
              return (
                <ScrollReveal
                  key={r.id || i}
                  delay={i * 60}
                  className="snap-start w-[280px] sm:w-[320px] shrink-0"
                >
                  <div className="group h-full glass-card glass-card-hover rounded-3xl overflow-hidden flex flex-col">
                    <div className={`relative h-44 bg-gradient-to-br ${tm.bg} flex items-center justify-center overflow-hidden cursor-pointer`}
                      onClick={() => setPreview(r)}
                    >
                      <div className="absolute inset-0 bg-grid opacity-30" />
                      <div className={`relative w-24 h-24 rounded-3xl bg-gradient-to-br ${tm.color} flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500`}>
                        <span className="text-5xl group-hover:scale-110 transition duration-300">{r.thumbnail || '📄'}</span>
                      </div>
                      <div className="absolute top-3 left-3">
                        <span className={`tag-pill bg-slate-950/70 backdrop-blur border border-white/10 text-white whitespace-nowrap`}>
                          <Icon className="w-3 h-3 mr-1" />
                          {tm.label}
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-slate-950/70 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <Eye className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <h4 className="font-semibold text-white leading-snug mb-3 line-clamp-2 min-h-[3rem] group-hover:text-signal-300 transition-colors">
                        {r.title}
                      </h4>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-4 mt-auto">
                        <span className="flex items-center gap-1">
                          <Download className="w-3.5 h-3.5" />
                          {(r.downloads || 0).toLocaleString('zh-CN')} 次下载
                        </span>
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5" />
                          更新于 {r.year || '2026'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setPreview(r)}
                          className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 transition whitespace-nowrap"
                        >
                          预览
                        </button>
                        <button
                          onClick={() => handleDownload(r)}
                          disabled={downloading === r.id}
                          className={`flex-1 px-3 py-2 rounded-xl text-xs font-semibold text-white transition bg-gradient-to-r ${tm.color} hover:opacity-90 inline-flex items-center justify-center gap-1.5 disabled:opacity-60 whitespace-nowrap`}
                        >
                          {downloading === r.id ? (
                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> 下载中</>
                          ) : (
                            <><Download className="w-3.5 h-3.5" /> 下载</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}

            <div className="snap-start w-[280px] sm:w-[320px] shrink-0">
              <div
                onClick={() => showToast('📚 资源中心正在建设中，敬请期待！')}
                className="h-full rounded-3xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center p-6 text-center hover:border-signal-500/40 hover:bg-signal-500/5 transition cursor-pointer min-h-[448px]"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-signal-400" />
                </div>
                <div className="font-semibold text-white mb-2">查看全部资源库</div>
                <div className="text-sm text-slate-400 mb-5">
                  120+ 教学视频<br />300+ 配套资料<br />全部分类整理
                </div>
                <button className="btn-secondary !py-2 text-sm whitespace-nowrap">
                  进入资源中心 →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 资源预览弹窗 */}
      {preview && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" />
          <div
            className="relative w-full max-w-2xl glass-card rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`relative h-48 bg-gradient-to-br ${typeMap[preview.type as keyof typeof typeMap]?.bg || typeMap.pdf.bg} flex items-center justify-center`}>
              <button
                onClick={() => setPreview(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${typeMap[preview.type as keyof typeof typeMap]?.color || typeMap.pdf.color} flex items-center justify-center shadow-2xl`}>
                <span className="text-5xl">{preview.thumbnail || '📄'}</span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="tag-pill bg-signal-500/15 text-signal-300 border border-signal-500/25">
                  {typeMap[preview.type as keyof typeof typeMap]?.label || '文档'}
                </span>
                {preview.chapterId && (
                  <span className="tag-pill bg-white/5 text-slate-400 border border-white/10">
                    第{preview.chapterId}章
                  </span>
                )}
                <span className="tag-pill bg-white/5 text-slate-400 border border-white/10">
                  <Download className="w-3 h-3 mr-1" /> {(preview.downloads || 0).toLocaleString('zh-CN')} 次下载
                </span>
              </div>
              <h3 className="font-serif font-bold text-xl text-white mb-3">{preview.title}</h3>
              {preview.description && (
                <p className="text-sm text-slate-300 leading-relaxed mb-4">{preview.description}</p>
              )}
              <div className="p-4 rounded-xl bg-slate-900/50 border border-white/5 text-sm text-slate-400 mb-5">
                📋 资源简介：这是一个高质量的教学资源，涵盖了自动控制原理的核心知识点。登录后可在线查看完整内容或下载到本地学习。
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDownload(preview)}
                  disabled={downloading === preview.id}
                  className="flex-1 btn-primary !py-3 disabled:opacity-60"
                >
                  {downloading === preview.id ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> 下载中...</>
                  ) : (
                    <><Download className="w-4 h-4" /> 下载资源</>
                  )}
                </button>
                <button
                  onClick={() => setPreview(null)}
                  className="px-5 py-3 rounded-xl font-semibold text-slate-300 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 transition whitespace-nowrap"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl bg-signal-500/90 border border-signal-400/40 text-white shadow-2xl text-sm font-medium animate-[fadeIn_.2s_ease]">
          {toast}
        </div>
      )}
    </section>
  );
}
