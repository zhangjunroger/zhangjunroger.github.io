import { useState, useEffect } from 'react';
import SectionTitle from '@/components/common/SectionTitle';
import ScrollReveal from '@/components/common/ScrollReveal';
import { courseApi } from '@/lib/api';
import type { TeacherItem } from '@shared/seed.js';
import { mockTeachers } from '@/data/mockTeachers';
import { mockChapters } from '@/data/mockChapters';
import { Award, Mail, GraduationCap, BookOpenCheck, X, FileText, Users } from 'lucide-react';

export default function TeacherCards() {
  const [teachers, setTeachers] = useState<TeacherItem[]>(mockTeachers as any);
  const [active, setActive] = useState<TeacherItem | null>(null);

  useEffect(() => {
    courseApi.teachers().then(list => {
      if (list && list.length) setTeachers(list as any);
    }).catch(() => {/* 用 mock 兜底 */});
  }, []);

  return (
    <section id="team" className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-glow-blue opacity-40 pointer-events-none" />
      <div className="container relative">
        <ScrollReveal>
          <SectionTitle
            eyebrow="Faculty Team"
            title="资深教授团队 · 数十年教学经验"
            subtitle="深耕控制理论教学与科研数十年，累计指导研究生500+，发表高水平论文300+。他们不仅懂理论，更懂得如何让你听懂。"
            icon={<GraduationCap className="w-3.5 h-3.5" />}
            align="center"
          />
        </ScrollReveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {teachers.map((t: any, i) => {
            const teachingChapters = mockChapters.filter(c => t.chapterIds?.includes(c.id));
            return (
              <ScrollReveal key={t.id || i} delay={i * 90}>
                <div
                  onClick={() => setActive(t)}
                  className="group relative h-full glass-card glass-card-hover rounded-3xl p-6 pt-20 text-center overflow-hidden cursor-pointer"
                >
                  <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b
                    ${i % 4 === 0 ? 'from-brand-600/25' : i % 4 === 1 ? 'from-signal-600/25' : i % 4 === 2 ? 'from-amber-600/25' : 'from-violet-600/25'}
                    to-transparent pointer-events-none`} />
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="relative inline-flex mb-5">
                    <div className={`absolute -inset-1.5 rounded-full bg-gradient-to-br
                      ${i % 4 === 0 ? 'from-brand-500 to-cyan-400' : i % 4 === 1 ? 'from-signal-500 to-emerald-400' : i % 4 === 2 ? 'from-amber-500 to-rose-400' : 'from-violet-500 to-fuchsia-400'}
                      opacity-70 group-hover:opacity-100 group-hover:animate-spin-slow blur-[1px]`} />
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="relative w-24 h-24 rounded-full bg-slate-900 border-4 border-slate-900 object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <h3 className="font-serif font-bold text-xl text-white mb-1">{t.name}</h3>
                  <div className="text-sm text-signal-300 font-medium mb-4">{t.title}</div>

                  <div className="mb-4">
                    <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-center gap-1">
                      <Award className="w-3 h-3" /> 研究方向
                    </div>
                    <div className="flex flex-wrap gap-1.5 justify-center">
                      {t.research?.slice(0, 3).map((r: string, ri: number) => (
                        <span
                          key={r}
                          className={`tag-pill border ${i % 4 === 0 ? 'bg-brand-500/10 text-brand-300 border-brand-500/20' :
                                        i % 4 === 1 ? 'bg-signal-500/10 text-signal-300 border-signal-500/20' :
                                        i % 4 === 2 ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' :
                                                     'bg-violet-500/10 text-violet-300 border-violet-500/20'}`}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <div className="text-[11px] uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-center gap-1">
                      <BookOpenCheck className="w-3 h-3" /> 授课章节
                    </div>
                    <div className="text-sm text-slate-300 space-y-1">
                      {teachingChapters.slice(0, 2).map(c => (
                        <div key={c.id} className="truncate">第{c.id}章 · {c.title.slice(c.title.indexOf(' ') + 1)}</div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); setActive(t); }}
                    className="mt-5 w-full btn-ghost !py-2 text-sm border border-white/10 hover:border-signal-500/40 whitespace-nowrap"
                  >
                    查看教师主页 →
                  </button>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>

      {/* 教师详情弹窗 */}
      {active && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" onClick={() => setActive(null)}>
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" />
          <div
            className="relative w-full max-w-lg glass-card rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-32 bg-gradient-to-br from-signal-600/30 via-brand-600/20 to-violet-600/30">
              <button
                onClick={() => setActive(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 pb-6 -mt-16">
              <div className="flex items-end gap-4 mb-4">
                <img
                  src={active.avatar}
                  alt={active.name}
                  className="w-24 h-24 rounded-2xl bg-slate-900 border-4 border-slate-900 object-cover flex-shrink-0"
                />
                <div className="pb-2">
                  <h3 className="font-serif font-bold text-2xl text-white">{active.name}</h3>
                  <div className="text-sm text-signal-300">{active.title}</div>
                </div>
              </div>

              <div className="space-y-4">
                {active.bio && (
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> 个人简介
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">{active.bio}</p>
                  </div>
                )}

                {active.research && active.research.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Award className="w-3 h-3" /> 研究方向
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {active.research.map((r: string) => (
                        <span key={r} className="tag-pill bg-signal-500/10 text-signal-300 border border-signal-500/20">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(active as any).achievements && (active as any).achievements.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Award className="w-3 h-3" /> 主要成果
                    </div>
                    <ul className="space-y-1.5">
                      {(active as any).achievements.map((a: string, i: number) => (
                        <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-signal-400 mt-1.5 flex-shrink-0" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {active.chapterIds && active.chapterIds.length > 0 && (
                  <div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <BookOpenCheck className="w-3 h-3" /> 授课章节
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {active.chapterIds.map((cid: number) => {
                        const ch = mockChapters.find(c => c.id === cid);
                        return ch ? (
                          <a
                            key={cid}
                            href="#syllabus"
                            onClick={() => setActive(null)}
                            className="tag-pill bg-white/5 text-slate-300 border border-white/10 hover:border-signal-500/30 transition cursor-pointer"
                          >
                            第{cid}章 · {ch.title.slice(ch.title.indexOf(' ') + 1)}
                          </a>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  window.location.href = `mailto:${(active as any).email || 'teacher@example.edu.cn'}`;
                }}
                className="mt-6 w-full btn-primary !py-2.5 text-sm"
              >
                <Mail className="w-4 h-4" /> 联系教师
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
