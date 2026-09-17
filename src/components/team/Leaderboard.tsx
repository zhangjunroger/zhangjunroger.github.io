import { useState } from 'react';
import SectionTitle from '@/components/common/SectionTitle';
import ScrollReveal from '@/components/common/ScrollReveal';
import { mockStudents, currentStudent } from '@/data/mockStudents';
import { useLearningStore } from '@/store/useLearningStore';
import { Trophy, Medal, Clock, Zap, Flame, TrendingUp, Star, Crown, CheckCircle2 } from 'lucide-react';

const rankStyle = [
  'bg-gradient-to-br from-amber-400 to-yellow-600',
  'bg-gradient-to-br from-slate-300 to-slate-500',
  'bg-gradient-to-br from-orange-400 to-amber-700',
];

export default function Leaderboard() {
  const me = useLearningStore((s) => s.currentStudent);
  const leaderboard = useLearningStore((s) => s.leaderboard);
  const [challengeJoined, setChallengeJoined] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // 优先使用后端排行榜数据，兜底用 mock 数据
  const top = leaderboard && leaderboard.length > 0
    ? leaderboard.map((e, i) => ({
        ...e,
        name: e.realName || e.username,
        id: e.userId,
        rank: i + 1,
        totalHours: e.totalHours,
      }))
    : mockStudents;

  const totalScore = ((top[0] as any)?.score || (top[0] as any)?.totalScore || 10000) + 2000;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const joinChallenge = () => {
    setChallengeJoined(true);
    showToast('🎉 已加入挑战！完成指定任务即可获得 5000 额外积分');
  };

  return (
    <section id="leaderboard" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-1/4 right-0 w-[560px] h-[560px] rounded-full bg-amber-500/8 blur-[140px]" />
      <div className="container relative">
        <ScrollReveal>
          <SectionTitle
            eyebrow="Leaderboard"
            title="学习排行榜 · 与优秀者同行"
            subtitle="比学赶帮超，让学习更有动力！每周一凌晨重置，前十名同学获得专属徽章奖励，期末直接计入平时成绩。"
            align="center"
            icon={<Trophy className="w-3.5 h-3.5" />}
          />
        </ScrollReveal>

        <div className="grid gap-8 lg:grid-cols-12">
          <ScrollReveal className="lg:col-span-7" delay={80}>
            <div className="glass-card rounded-3xl p-6 md:p-7 overflow-hidden relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-xl text-white">本周学习风云榜</h3>
                    <div className="text-xs text-slate-400">实时更新 · 每周一 00:00 重置</div>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-1.5 text-xs">
                  <span className="tag-pill bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap">🔥 实时更新</span>
                </div>
              </div>

              <div className="relative mb-10 pt-8">
                {top.length >= 3 && (
                  <div className="grid grid-cols-3 items-end gap-3 md:gap-5">
                    {[top[1], top[0], top[2]].map((u: any, i) => {
                      const realRank = i === 0 ? 2 : i === 1 ? 1 : 3;
                      const height = [72, 96, 56][i];
                      return (
                        <div key={u.id || i} className="flex flex-col items-center" style={{ animation: `podium 0.8s ${i * 120}ms cubic-bezier(.2,.9,.3,1.2) both` }}>
                          <div className="relative mb-3">
                            {realRank === 1 && (
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-3xl animate-bounce">
                                <Crown className="w-7 h-7 text-amber-400" />
                              </div>
                            )}
                            <div className={`absolute -inset-1.5 rounded-full ${rankStyle[realRank - 1]} opacity-70 blur-sm`} />
                            <img src={u.avatar} alt="" className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-800 border-4 border-slate-900" />
                            <div className={`absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-xl ${rankStyle[realRank - 1]} text-white font-black flex items-center justify-center shadow-lg text-sm`}>
                              {realRank}
                            </div>
                          </div>
                          <div className="text-sm md:text-base font-semibold text-white mb-0.5 truncate max-w-full">{u.name || u.realName}</div>
                          <div className="text-xs text-slate-400 mb-3 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-400" /> {(u.score || u.totalScore || 0).toLocaleString()} 积分
                          </div>
                          <div
                            className={`w-full rounded-t-2xl rounded-b-lg ${rankStyle[realRank - 1]} opacity-80 relative overflow-hidden`}
                            style={{ height: `${height}px` }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-white/10" />
                            <div className="absolute inset-x-0 top-2 flex justify-center">
                              <div className="flex flex-col items-center text-white/95 mix-blend-overlay">
                                <div className="text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{(u.totalHours || 0).toFixed(0)}h</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2.5">
                {top.slice(3).map((u: any, i) => {
                  const rank = i + 4;
                  const score = u.score || u.totalScore || 0;
                  const pct = totalScore > 0 ? Math.min(100, (score / totalScore) * 100) : 0;
                  return (
                    <div
                      key={u.id || i}
                      className="flex items-center gap-4 p-3.5 rounded-2xl hover:bg-white/5 transition group"
                      style={{ animation: `fadeUp 0.5s ${300 + i * 60}ms ease both` }}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm
                        ${rank < 10 ? 'bg-white/5 text-slate-300' : 'bg-slate-800/50 text-slate-500'}`}>
                        {rank}
                      </div>
                      <img src={u.avatar} alt="" className="w-11 h-11 rounded-xl bg-slate-800 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white text-sm truncate">{u.name || u.realName}</span>
                          {rank <= 10 && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-500 via-signal-500 to-cyan-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold text-white">{score.toLocaleString()}</div>
                        <div className="text-[11px] text-slate-400 flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" /> {(u.totalHours || 0).toFixed(0)}h
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* 当前用户 */}
                <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-signal-500/15 via-brand-600/15 to-transparent border border-signal-500/30 relative overflow-hidden">
                  <div className="absolute inset-y-0 right-0 w-2 bg-gradient-to-b from-signal-400 to-brand-500 rounded-r-2xl" />
                  <div className="absolute -top-1 right-6 tag-pill bg-signal-500/20 text-signal-300 text-[10px] border border-signal-500/30 animate-pulse whitespace-nowrap">
                    👤 当前用户
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-signal-500 to-brand-600 text-white font-black flex items-center justify-center text-sm">
                      {me.rank}
                    </div>
                    <img src={currentStudent.avatar} alt="" className="w-11 h-11 rounded-xl bg-slate-800 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-sm mb-1">{me.name}</div>
                      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-signal-400 via-brand-400 to-violet-400"
                          style={{ width: `${(me.score / totalScore) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-white">{me.score.toLocaleString()}</div>
                      <div className="text-[11px] text-emerald-400 flex items-center justify-end gap-1">
                        <TrendingUp className="w-3 h-3" /> ↑12
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <div className="lg:col-span-5 space-y-6">
            <ScrollReveal delay={100}>
              <div className="glass-card rounded-3xl p-6 md:p-7 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-signal-500/20 blur-3xl" />
                <div className="flex items-center gap-3 mb-5 relative">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-xl text-white">我的学习档案</h3>
                    <div className="text-xs text-slate-400">保持连续学习，冲击更高名次！</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { l: '累计学习', v: `${me.totalHours}`, s: '小时', c: 'text-signal-300' },
                    { l: '积分总数', v: me.score.toLocaleString(), s: '分', c: 'text-amber-300' },
                    { l: '连续打卡', v: '18', s: '天', c: 'text-rose-300' },
                  ].map((k, i) => (
                    <div key={i} className="rounded-2xl bg-slate-900/60 p-3 text-center border border-white/5">
                      <div className={`text-2xl font-serif font-black ${k.c}`}>
                        {k.v}<span className="text-xs ml-0.5">{k.s}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">{k.l}</div>
                    </div>
                  ))}
                </div>

                <div className="mb-5">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">知识点掌握度</span>
                    <span className="text-signal-300 font-medium">综合 65%</span>
                  </div>
                  <div className="space-y-2.5">
                    {Object.entries(me.mastery).map(([k, v]) => (
                      <div key={k}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-300">{k}</span>
                          <span className={`font-mono ${v >= 80 ? 'text-emerald-400' : v >= 50 ? 'text-signal-300' : 'text-amber-400'}`}>{v}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${v >= 80 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                                                             v >= 50 ? 'bg-gradient-to-r from-signal-500 to-cyan-400' :
                                                                       'bg-gradient-to-r from-amber-500 to-orange-400'}`}
                            style={{ width: `${v}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5">
                  <div className="flex items-center gap-2 mb-2 text-sm">
                    <Medal className="w-4 h-4 text-amber-400" />
                    <span className="text-white font-semibold">徽章成就</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { e: '🎯', t: '入门学者', g: true },
                      { e: '⚡', t: '坚持之星', g: true },
                      { e: '🧠', t: '数学达人', g: true },
                      { e: '🔬', t: '实验能手', g: false },
                      { e: '🏆', t: '满分学员', g: false },
                    ].map((b, i) => (
                      <div key={i} className={`aspect-square rounded-xl flex flex-col items-center justify-center text-center p-1.5 transition
                        ${b.g ? 'bg-gradient-to-br from-amber-500/15 to-amber-600/10 border border-amber-500/25' : 'bg-slate-800/40 grayscale opacity-50'}`}
                        title={b.t}
                      >
                        <div className="text-2xl md:text-3xl">{b.e}</div>
                        <div className="text-[9px] text-slate-400 mt-0.5 truncate w-full">{b.t}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={300}>
              <div className="glass-card rounded-3xl p-6 md:p-7 relative overflow-hidden">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-signal-400 font-semibold mb-1">Weekly Challenge</div>
                    <h3 className="font-serif font-bold text-xl text-white">每周挑战 · 双倍积分周</h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/25 flex items-center justify-center">
                    <Flame className="w-5 h-5 text-rose-400" />
                  </div>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed mb-5">
                  <strong className="text-rose-300">限时 7 天</strong>：完成第3-5章所有视频 + 仿真实验 + 单元测验，即可获得 <strong className="text-amber-300">5,000 额外积分</strong> 和「进阶学霸」专属徽章。
                </p>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-signal-400 animate-pulse-slow" style={{ width: challengeJoined ? '42%' : '38%' }} />
                  </div>
                  <span className="text-sm font-semibold text-amber-300 whitespace-nowrap">{challengeJoined ? '42%' : '38%'}</span>
                </div>
                <button
                  onClick={joinChallenge}
                  disabled={challengeJoined}
                  className="w-full btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {challengeJoined ? (
                    <><CheckCircle2 className="w-4 h-4" /> 已加入挑战 · 剩余 4 天 12h</>
                  ) : (
                    <>立即参与挑战 · 剩余 4 天 12h</>
                  )}
                </button>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl bg-emerald-500/90 border border-emerald-400/40 text-white shadow-2xl text-sm font-medium animate-[fadeIn_.2s_ease]">
          {toast}
        </div>
      )}

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px);} to { opacity:1; transform: translateY(0); } }
        @keyframes podium { from { opacity:0; transform: translateY(40px) scale(0.8); } to { opacity:1; transform: none; } }
      `}</style>
    </section>
  );
}
