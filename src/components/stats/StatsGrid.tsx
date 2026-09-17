import CountUpNumber from '@/components/common/CountUpNumber';
import ScrollReveal from '@/components/common/ScrollReveal';
import { Users, BookOpenCheck, Trophy, MessageCircleHeart } from 'lucide-react';

const stats = [
  {
    icon: Users,
    label: '累计选课人数',
    value: 12580,
    suffix: '+',
    color: 'from-brand-500 to-cyan-400',
    bg: 'from-brand-500/20 to-brand-600/10',
    border: 'border-brand-500/25',
  },
  {
    icon: BookOpenCheck,
    label: '完成课时总数',
    value: 386400,
    prefix: '',
    color: 'from-signal-500 to-emerald-400',
    bg: 'from-signal-500/20 to-emerald-500/10',
    border: 'border-signal-500/25',
  },
  {
    icon: Trophy,
    label: '学员平均成绩',
    value: 87.6,
    decimals: 1,
    suffix: '分',
    color: 'from-amber-500 to-orange-400',
    bg: 'from-amber-500/20 to-orange-500/10',
    border: 'border-amber-500/25',
  },
  {
    icon: MessageCircleHeart,
    label: '课程好评率',
    value: 98.4,
    decimals: 1,
    suffix: '%',
    color: 'from-rose-500 to-pink-400',
    bg: 'from-rose-500/20 to-pink-500/10',
    border: 'border-rose-500/25',
  },
];

export default function StatsGrid() {
  return (
    <section className="relative -mt-16 lg:-mt-20 z-20">
      <div className="container">
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((s, i) => (
            <ScrollReveal key={s.label} delay={i * 80}>
              <div className={`glass-card glass-card-hover rounded-2xl p-6 border ${s.border} overflow-hidden relative group`}>
                <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${s.bg} blur-2xl group-hover:scale-125 transition-transform duration-500`} />
                <div className="relative">
                  <div className={`inline-flex w-12 h-12 rounded-xl bg-gradient-to-br ${s.bg} border ${s.border} items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                    <s.icon className={`w-6 h-6 bg-gradient-to-br ${s.color} bg-clip-text text-transparent`} />
                  </div>
                  <div className="text-3xl md:text-4xl font-serif font-bold text-white mb-1.5 tracking-tight">
                    <CountUpNumber
                      end={s.value}
                      decimals={s.decimals || 0}
                      suffix={s.suffix}
                      prefix={s.prefix}
                    />
                  </div>
                  <div className="text-sm text-slate-400">{s.label}</div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
