import { useState } from 'react';
import SectionTitle from '@/components/common/SectionTitle';
import ScrollReveal from '@/components/common/ScrollReveal';
import { useLearningStore, type UILesson } from '@/store/useLearningStore';
import LessonDetailModal from './LessonDetailModal';
import {
  ChevronDown, CheckCircle2, CirclePlay, FileText, FlaskConical,
  ClipboardList, BookOpenCheck, Lock, Clock
} from 'lucide-react';

const lessonIcon = {
  video: CirclePlay,
  ppt: FileText,
  experiment: FlaskConical,
  exercise: ClipboardList,
};

const tagColors = [
  'bg-brand-500/15 text-brand-300 border-brand-500/25',
  'bg-signal-500/15 text-signal-300 border-signal-500/25',
  'bg-amber-500/15 text-amber-300 border-amber-500/25',
  'bg-violet-500/15 text-violet-300 border-violet-500/25',
  'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  'bg-rose-500/15 text-rose-300 border-rose-500/25',
];

export default function SyllabusAccordion() {
  const chapters = useLearningStore((s) => s.chapters);
  const [openId, setOpenId] = useState<number>(2);
  const [activeLesson, setActiveLesson] = useState<{ lesson: UILesson; chapterTitle: string } | null>(null);
  const toggle = (id: number) => setOpenId((o) => (o === id ? -1 : id));

  const totalLessons = chapters.reduce((n, c) => n + c.lessons.length, 0);
  const doneLessons = chapters.reduce((n, c) => n + c.lessons.filter(l => l.isCompleted).length, 0);
  const overall = Math.round((doneLessons / totalLessons) * 100);

  // 找到第一个未完成的课时作为"继续学习"
  const nextLesson: { lesson: UILesson; chapterTitle: string } | null = (() => {
    for (const ch of chapters) {
      for (const l of ch.lessons) {
        if (!l.isCompleted) return { lesson: l, chapterTitle: `第${ch.id}章 ${ch.title}` };
      }
    }
    return null;
  })();

  const openLesson = (lesson: UILesson, chapterTitle: string, locked: boolean) => {
    if (locked) return;
    setActiveLesson({ lesson, chapterTitle });
  };

  return (
    <section id="syllabus" className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-grid opacity-40 mask-fade-b" />
      <div className="container relative">
        <ScrollReveal>
          <SectionTitle
            eyebrow="Course Syllabus"
            title="8大章节 · 72课时完整知识体系"
            subtitle="严格遵循国内经典教材章节结构，循序渐进建立完整的控制理论知识框架，每一章都配视频、课件、实验、练习"
            icon={<BookOpenCheck className="w-3.5 h-3.5" />}
          />
        </ScrollReveal>

        <div className="grid lg:grid-cols-12 gap-8">
          <ScrollReveal className="lg:col-span-4" delay={100}>
            <div className="glass-card rounded-3xl p-7 sticky top-28 h-fit">
              <div className="text-sm text-slate-400 mb-2">整体学习进度</div>
              <div className="flex items-end gap-3 mb-4">
                <div className="text-5xl font-serif font-black text-white tracking-tight">
                  {overall}
                  <span className="text-2xl text-signal-400 align-top">%</span>
                </div>
                <div className="text-sm text-emerald-400 pb-1.5">↗ 本周 +6%</div>
              </div>
              <div className="progress-bar-track mb-6 h-2.5">
                <div className="progress-bar-fill" style={{ width: `${overall}%` }} />
              </div>

              <div className="grid grid-cols-3 gap-3 mb-7">
                <div className="rounded-xl bg-slate-800/50 p-3 text-center">
                  <div className="text-xl font-bold text-white">{chapters.length}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">章</div>
                </div>
                <div className="rounded-xl bg-slate-800/50 p-3 text-center">
                  <div className="text-xl font-bold text-white">{totalLessons}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">小节</div>
                </div>
                <div className="rounded-xl bg-slate-800/50 p-3 text-center">
                  <div className="text-xl font-bold text-white">
                    {chapters.filter(c => c.isCompleted).length}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">已完成</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-signal-500/10 to-brand-600/10 border border-signal-500/20">
                <div className="flex items-center gap-2 text-sm font-medium text-signal-300 mb-2">
                  📍 继续学习
                  {nextLesson && <span className="text-xs text-slate-400 font-normal">· {nextLesson.chapterTitle}</span>}
                </div>
                <div className="text-sm text-slate-400 mb-4 truncate">
                  {nextLesson ? nextLesson.lesson.title : '🎉 全部课时已完成！'}
                </div>
                <button
                  onClick={() => nextLesson && setActiveLesson(nextLesson)}
                  disabled={!nextLesson}
                  className="w-full btn-primary !py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CirclePlay className="w-4 h-4" /> {nextLesson ? `继续学习 (${nextLesson.lesson.durationMinutes}:00)` : '已完成全部课时'}
                </button>
              </div>
            </div>
          </ScrollReveal>

          <div className="lg:col-span-8 space-y-4">
            {chapters.map((ch, idx) => {
              const open = openId === ch.id;
              return (
                <ScrollReveal key={ch.id} delay={idx * 60}>
                  <div
                    className={`glass-card rounded-2xl overflow-hidden transition-all duration-300
                      ${open ? 'border-signal-500/40 shadow-glow' : ''}`}
                  >
                    <button
                      onClick={() => toggle(ch.id)}
                      className="w-full p-5 md:p-6 flex items-center gap-4 md:gap-6 text-left group"
                    >
                      <div
                        className={`relative w-14 h-14 md:w-16 md:h-16 rounded-2xl flex-shrink-0
                          flex items-center justify-center border
                          ${ch.isCompleted
                            ? 'bg-emerald-500/15 border-emerald-500/30'
                            : ch.progress > 0
                              ? 'bg-signal-500/15 border-signal-500/30'
                              : 'bg-slate-800/70 border-white/10'}`}
                      >
                        <span className={`text-lg md:text-xl font-serif font-black
                          ${ch.isCompleted ? 'text-emerald-300' : ch.progress > 0 ? 'text-signal-300' : 'text-slate-400'}`}>
                          {String(ch.id).padStart(2, '0')}
                        </span>
                        {ch.isCompleted && (
                          <CheckCircle2 className="absolute -right-1 -bottom-1 w-6 h-6 text-emerald-400 bg-slate-900 rounded-full p-0.5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <h3 className="font-serif font-bold text-lg md:text-xl text-white group-hover:text-signal-300 transition-colors truncate">
                            {ch.title}
                          </h3>
                          <span className="tag-pill bg-white/5 text-slate-400 border border-white/10 whitespace-nowrap">
                            <Clock className="w-3 h-3 mr-1" /> {ch.durationLabel}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 line-clamp-1 mb-2">{ch.description}</p>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {ch.tags.map((t, ti) => (
                            <span
                              key={t}
                              className={`tag-pill border ${tagColors[ti % tagColors.length]}`}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="progress-bar-track flex-1 max-w-xs">
                            <div className="progress-bar-fill" style={{ width: `${ch.progress}%` }} />
                          </div>
                          <span className={`text-xs font-semibold ${ch.progress === 100 ? 'text-emerald-400' : ch.progress > 0 ? 'text-signal-300' : 'text-slate-500'}`}>
                            {ch.progress}%
                          </span>
                        </div>
                      </div>

                      <div className={`w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0
                        transition-transform duration-300 ${open ? 'rotate-180 bg-signal-500/15 text-signal-300' : 'text-slate-400'}`}>
                        <ChevronDown className="w-4.5 h-4.5" />
                      </div>
                    </button>

                    <div
                      className={`grid transition-all duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-5 md:px-6 pb-5 md:pb-6 pt-0 border-t border-white/5 space-y-2">
                          {ch.lessons.map((l, li) => {
                            const Icon = lessonIcon[l.type];
                            const locked = ch.progress === 0 && li > 0 && !l.isCompleted;
                            const chapterTitle = `第${ch.id}章 ${ch.title}`;
                            return (
                              <div
                                key={l.id}
                                onClick={() => openLesson(l, chapterTitle, locked)}
                                className={`flex items-center gap-4 p-3 rounded-xl group cursor-pointer
                                  ${l.isCompleted
                                    ? 'bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10'
                                    : locked
                                      ? 'opacity-50 cursor-not-allowed border border-transparent'
                                      : 'hover:bg-white/5 border border-transparent hover:border-white/10'}
                                  transition`}
                              >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                                  ${l.isCompleted
                                    ? 'bg-emerald-500/15 text-emerald-300'
                                    : 'bg-slate-800/70 text-slate-400 group-hover:text-signal-300'}`}
                                >
                                  {locked ? (
                                    <Lock className="w-4 h-4" />
                                  ) : (
                                    <Icon className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className={`text-sm md:text-[15px] font-medium truncate ${l.isCompleted ? 'text-slate-300' : 'text-white'}`}>
                                    {l.title}
                                  </div>
                                  <div className="text-xs text-slate-500 mt-0.5">
                                    {l.type === 'video' ? '视频' : l.type === 'ppt' ? '课件' : l.type === 'experiment' ? '仿真实验' : '练习/测验'}
                                    {' · '}{l.durationMinutes} 分钟
                                  </div>
                                </div>
                                {l.isCompleted ? (
                                  <span className="tag-pill bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 whitespace-nowrap">
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> 已完成
                                  </span>
                                ) : locked ? (
                                  <span className="tag-pill bg-white/5 text-slate-500 border border-white/10 whitespace-nowrap">待解锁</span>
                                ) : (
                                  <span className="tag-pill bg-signal-500/15 text-signal-300 border border-signal-500/25 hover:bg-signal-500/25 transition whitespace-nowrap">
                                    开始学习
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </div>

      <LessonDetailModal
        lesson={activeLesson?.lesson ?? null}
        chapterTitle={activeLesson?.chapterTitle ?? ''}
        onClose={() => setActiveLesson(null)}
      />
    </section>
  );
}
