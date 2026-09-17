import SectionTitle from '@/components/common/SectionTitle';
import ScrollReveal from '@/components/common/ScrollReveal';
import { highlights } from '@/data/mockResources';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export default function HighlightsGrid() {
  return (
    <section id="highlights" className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-glow-blue opacity-60 pointer-events-none" />
      <div className="container relative">
        <ScrollReveal>
          <SectionTitle
            eyebrow="Why This Course"
            title="6大核心特色，让控制理论不再难学"
            subtitle="从数学公式到工程实践，从传统课堂到AI赋能 — 我们重新设计了控制理论的学习体验"
            icon={<Icons.Sparkles className="w-3.5 h-3.5" />}
          />
        </ScrollReveal>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {highlights.map((h, i) => {
            const Icon = (Icons as unknown as Record<string, LucideIcon>)[h.icon] || Icons.Box;
            return (
              <ScrollReveal key={h.id} delay={i * 90}>
                <div className="group relative h-full glass-card glass-card-hover rounded-3xl p-7 overflow-hidden">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${h.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
                  />
                  <div className="relative">
                    <div
                      className={`w-16 h-16 rounded-2xl mb-6 bg-slate-900/80 border border-white/10
                                flex items-center justify-center group-hover:rotate-[14deg] group-hover:scale-110 transition-all duration-400
                                shadow-lg group-hover:shadow-glow-cyan`}
                    >
                      <Icon className={`w-8 h-8 bg-gradient-to-br ${h.iconColor} bg-clip-text text-transparent drop-shadow`} />
                    </div>
                    <h3 className="font-serif font-bold text-xl text-white mb-3 tracking-wide">
                      {h.title}
                    </h3>
                    <p className="text-slate-400 leading-[1.8] text-[15px]">{h.description}</p>
                    <div className="mt-6 flex items-center gap-1 text-sm text-signal-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-400">
                      了解更多 <span className="transition-transform group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
