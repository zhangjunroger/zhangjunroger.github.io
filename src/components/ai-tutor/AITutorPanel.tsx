import { useState, useRef, useEffect } from 'react';
import SectionTitle from '@/components/common/SectionTitle';
import ScrollReveal from '@/components/common/ScrollReveal';
import LatexContent from '@/components/common/LatexContent';
import { useLearningStore } from '@/store/useLearningStore';
import { aiApi } from '@/lib/api';
import {
  Bot, Send, Sparkles, Brain, Lightbulb, Target, BookA,
  ClipboardCheck, Network, Zap, User, Loader2, AlertCircle
} from 'lucide-react';

const aiTools = [
  { icon: Brain, title: '知识图谱生成', desc: '自动绘制关联图，发现学习盲区' },
  { icon: ClipboardCheck, title: '错题智能分析', desc: '溯源错误根源，针对强化训练' },
  { icon: Lightbulb, title: '个性化推荐', desc: '根据掌握度推荐最优学习路径' },
  { icon: Target, title: '考研考点预测', desc: '历年数据训练，重点考题智能标' },
  { icon: Network, title: '公式推导助手', desc: 'LaTeX 可视化，推导步步清晰' },
  { icon: Zap, title: '秒级答疑响应', desc: '1.2 秒平均响应，24h 全天在线' },
];

const quickQuestions = [
  '什么是劳斯判据？怎么用？',
  '二阶系统的时域性能指标有哪些？',
  '伯德图渐近线的绘制步骤',
  '根轨迹法和频率法的区别？',
  'PID三个参数各起什么作用？',
  '给我出5道第三章练习题',
];

export default function AITutorPanel() {
  const messages = useLearningStore((s) => s.aiMessages);
  const addMsg = useLearningStore((s) => s.addAIMessage);
  const clearMsgs = useLearningStore((s) => s.clearAIMessages);
  const isLoggedIn = useLearningStore((s) => s.auth.isLoggedIn);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;

    setError(null);
    addMsg({
      id: 'u' + Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    });
    setInput('');
    setLoading(true);

    try {
      let sid = sessionId;
      if (!sid) {
        const sess = await aiApi.createSession(text.slice(0, 30));
        sid = sess.id;
        setSessionId(sid);
      }
      const reply = await aiApi.sendMessage(sid, text);
      addMsg({
        id: 'a' + Date.now(),
        role: 'assistant',
        content: reply.content,
        timestamp: reply.timestamp || Date.now(),
        suggestions: (reply as any).suggestions || ['详细展开概念', '生成专项练习', '关联考研真题'],
      });
    } catch (err: any) {
      // 后端不可用时使用本地知识库兜底
      const fallback = generateFallback(text);
      addMsg({
        id: 'a' + Date.now(),
        role: 'assistant',
        content: fallback,
        timestamp: Date.now(),
        suggestions: ['超调量怎么计算？', '给我讲劳斯判据', 'PID怎么整定？'],
      });
      if (isLoggedIn) setError('AI服务暂时不可用，使用本地知识库回复');
    } finally {
      setLoading(false);
    }
  };

  const clickQuick = (q: string) => {
    setInput(q);
    handleSend(q);
  };

  return (
    <section id="ai-tutor" className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-brand-950/30 to-slate-950" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full bg-signal-500/5 blur-[180px] pointer-events-none" />

      <div className="container relative">
        <ScrollReveal>
          <SectionTitle
            eyebrow="AI Wisdom Tutor"
            title="AI智能助教 · 懂你学习的每一步"
            subtitle="基于大语言模型 + 控制领域知识库训练的专属助教，从概念讲解到公式推导，从错题分析到真题模拟，随时为你服务"
            align="center"
            icon={<Sparkles className="w-3.5 h-3.5" />}
          />
        </ScrollReveal>

        <div className="grid lg:grid-cols-12 gap-8">
          <ScrollReveal className="lg:col-span-7" delay={100}>
            <div className="glass-card rounded-3xl flex flex-col h-[620px] shadow-glow overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-950/50">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-2xl bg-signal-400/30 blur-md animate-pulse-slow" />
                    <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-signal-500 via-brand-500 to-violet-600 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold text-white flex items-center gap-2">
                      小控 AI 助教 · 专业版
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950">PRO</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      控制理论知识库 · 智能问答模式
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {messages.length > 1 && (
                    <button
                      onClick={() => { clearMsgs(); setSessionId(null); }}
                      className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition"
                    >
                      清空对话
                    </button>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>
                </div>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4 scrollbar-hidden">
                {messages.map((m, idx) => (
                  <div
                    key={m.id}
                    className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                    style={{ animation: `fadeUp 0.5s ${idx * 60}ms ease both` }}
                  >
                    <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center
                      ${m.role === 'user'
                        ? 'bg-slate-800 border border-white/10'
                        : 'bg-gradient-to-br from-signal-500 to-brand-600'}`}
                    >
                      {m.role === 'user'
                        ? <User className="w-4 h-4 text-slate-300" />
                        : <Bot className="w-4 h-4 text-white" />}
                    </div>
                    <div className={`max-w-[82%] ${m.role === 'user' ? 'items-end' : ''}`}>
                      <div className={`px-4 py-3 rounded-2xl text-[14.5px] leading-relaxed
                        ${m.role === 'user'
                          ? 'rounded-tr-md bg-gradient-to-br from-signal-500 to-brand-600 text-white whitespace-pre-line'
                          : 'rounded-tl-md bg-slate-800/60 border border-white/5 text-slate-100'}`}
                      >
                        {m.role === 'user'
                          ? m.content
                          : <LatexContent content={m.content} />}
                      </div>
                      {m.suggestions && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {m.suggestions.map((s) => (
                            <button
                              key={s}
                              onClick={() => clickQuick(s)}
                              className="text-xs px-3 py-1.5 rounded-full border border-signal-500/30 text-signal-300 hover:bg-signal-500/10 hover:text-white transition whitespace-nowrap"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-3" style={{ animation: 'fadeUp 0.3s ease both' }}>
                    <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-signal-500 to-brand-600">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-slate-800/60 border border-white/5">
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        正在检索知识库...
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="text-xs px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {error}
                  </div>
                )}
              </div>

              <div className="p-4 md:p-5 border-t border-white/5 bg-slate-950/40">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {quickQuestions.slice(0, 4).map((q) => (
                    <button
                      key={q}
                      onClick={() => clickQuick(q)}
                      className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:border-signal-500/40 hover:bg-signal-500/5 transition line-clamp-1 whitespace-nowrap"
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-white/10 focus-within:border-signal-500/50 transition">
                  <BookA className="w-5 h-5 text-slate-500 ml-3" />
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="输入你的问题，回车发送... 支持数学公式 LaTeX"
                    className="flex-1 bg-transparent outline-none px-2 py-2.5 text-sm text-slate-200 placeholder:text-slate-500"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={loading || !input.trim()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-signal-500 via-brand-500 to-violet-600 text-white text-sm font-medium hover:opacity-90 active:scale-95 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    发送
                  </button>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <div className="lg:col-span-5 space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              {aiTools.map((t, i) => (
                <ScrollReveal key={t.title} delay={i * 70}>
                  <div
                    onClick={() => clickQuick(`请介绍一下：${t.title}`)}
                    className="h-full glass-card glass-card-hover rounded-2xl p-5 group cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-xl bg-slate-800/70 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                      <t.icon className="w-5 h-5 text-signal-400" />
                    </div>
                    <h4 className="font-semibold text-white mb-1.5">{t.title}</h4>
                    <p className="text-sm text-slate-400 leading-relaxed">{t.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>

            <ScrollReveal delay={450}>
              <div className="glass-card rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl" />
                <div className="flex items-center gap-3 mb-3 relative">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                    <Target className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">本周学习任务 · 智能规划</h4>
                    <div className="text-xs text-slate-400">AI 为你量身定制 · 预计 8.5 小时完成</div>
                  </div>
                </div>
                <ul className="space-y-3 relative">
                  {[
                    { t: '第3章 3.4 动态性能指标计算', s: '进行中', c: 'text-signal-400', p: 62, href: '#syllabus' },
                    { t: 'AI 生成 3 道典型例题 + 解析', s: '待完成', c: 'text-amber-400', p: 0, href: '#ai-tutor' },
                    { t: '第3章 仿真实验：二阶系统调参', s: '待完成', c: 'text-slate-400', p: 0, href: '#simulation' },
                    { t: '第3章 单元测验（限时60分钟）', s: '待解锁', c: 'text-slate-500', p: 0, href: '#syllabus' },
                  ].map((it, i) => (
                    <li
                      key={i}
                      onClick={() => {
                        if (it.href) document.querySelector(it.href)?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900/30 hover:bg-slate-900/60 transition cursor-pointer"
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold
                        ${i === 0 ? 'bg-signal-500/20 text-signal-300' : 'bg-slate-800 text-slate-400'}`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-slate-200 truncate">{it.t}</div>
                        {it.p > 0 && (
                          <div className="mt-1.5 h-1 rounded-full bg-slate-800 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-signal-500 to-cyan-400" style={{ width: `${it.p}%` }} />
                          </div>
                        )}
                      </div>
                      <span className={`text-xs font-medium ${it.c} flex-shrink-0 whitespace-nowrap`}>{it.s}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => document.querySelector('#syllabus')?.scrollIntoView({ behavior: 'smooth' })}
                  className="mt-5 w-full btn-secondary !py-2.5 text-sm"
                >
                  接受 AI 建议并开始 →
                </button>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}

// 本地兜底知识库（后端不可用时使用）
function generateFallback(text: string): string {
  const lower = text.toLowerCase();
  if (/劳斯/.test(text)) {
    return `**劳斯判据 (Routh Criterion)**\n\n劳斯判据用于判断线性系统稳定性，无需求解特征方程的根。\n\n**步骤：**\n1. 写出系统特征方程：$a_n s^n + a_{n-1} s^{n-1} + ... + a_1 s + a_0 = 0$\n2. 构造劳斯表：第一行为偶数项系数，第二行为奇数项系数\n3. 递推计算各行元素\n4. **判据**：劳斯表第一列元素变号次数 = 右半平面根的个数\n\n**稳定性条件**：第一列全部同号（通常为正）→ 系统稳定\n\n**两种特殊情况：**\n- 第一列出现零：用小正数 ε 替代继续计算\n- 整行全零：用上一行构造辅助多项式，求导后继续\n\n需要我举一个具体例题吗？`;
  }
  if (/超调量| overshoot|σ%/.test(text)) {
    return `**超调量 σ%**\n\n超调量是衡量系统平稳性的重要指标。\n\n**公式（二阶系统）：**\n$$\\sigma\\% = e^{-\\frac{\\zeta\\pi}{\\sqrt{1-\\zeta^2}}} \\times 100\\%$$\n\n**关键结论：**\n- 超调量仅与阻尼比 ζ 有关，与无阻尼自然频率 ωn 无关\n- ζ 越大 → σ% 越小 → 平稳性越好\n- ζ = 0.707 时，σ% ≈ 4.3%（工程最优阻尼）\n- ζ = 0.5 时，σ% ≈ 16.3%\n- ζ = 0.25 时，σ% ≈ 44%\n\n**常考题型**：已知 σ% 反推 ζ，或已知 ζ 求 σ%。`;
  }
  if (/pid/i.test(text) || /比例积分微分/.test(text)) {
    return `**PID 控制器**\n\n$$u(t) = K_p e(t) + K_i \\int_0^t e(\\tau)d\\tau + K_d \\frac{de(t)}{dt}$$\n\n**三参数作用口诀：**\n- **P（比例）**：提高响应速度，减小稳态误差，但无法消除；过大引起振荡\n- **I（积分）**：消除稳态误差，但降低稳定性，增加超调\n- **D（微分）**：改善动态性能，抑制超调，提前"预见"变化；对噪声敏感\n\n**整定方法：**\n1. **Ziegler-Nichols 法**：先纯 P 控制找临界增益 Ku 和临界周期 Tu\n2. **经验试凑法**：先 P 后 I 再 D，逐步调优\n\n需要更详细的整定步骤吗？`;
  }
  if (/伯德图|bode/i.test(text)) {
    return `**伯德图绘制步骤**\n\n**四步法：**\n1. **化标准形式**：将 G(s) 写成常数 K 与典型环节乘积\n2. **找转折频率**：各环节的 1/T 频率，按从小到大排列\n3. **画幅频特性**：低频段确定初始斜率和高度；每经过一个转折频率，斜率变化\n   - 惯性环节：斜率 -20dB/dec\n   - 一阶微分：斜率 +20dB/dec\n   - 振荡环节：斜率 -40dB/dec\n4. **画相频特性**：逐个环节叠加相角\n\n**关键指标：**\n- 截止频率 ωc（幅值=0dB 处）\n- 相角裕度 γ = 180° + ∠G(jωc)\n- 幅值裕度 Kg = -20log|G(jωg)|（ωg 为相角=-180° 处）`;
  }
  if (/根轨迹|root locus/i.test(text)) {
    return `**根轨迹法**\n\n根轨迹是开环增益 K 从 0→∞ 变化时，闭环极点在 s 平面的移动轨迹。\n\n**8条基本法则：**\n1. 根轨迹对称于实轴\n2. 起点=开环极点，终点=开环零点（或∞）\n3. 实轴上的根轨迹：右侧奇数个零极点\n4. 渐近线倾角：φa = (2k+1)π/(n-m)\n5. 渐近线交点：σa = (Σpi - Σzi)/(n-m)\n6. 分离点：dK/ds = 0\n7. 出射角/入射角：由相角条件确定\n8. 与虚轴交点：s = jω 代入特征方程\n\n**相角条件**：∠G(s)H(s) = (2k+1)π\n**幅值条件**：|G(s)H(s)| = 1`;
  }
  if (/你好|您好|hi|hello/i.test(lower)) {
    return `你好！👋 我是**自动控制原理AI助教小控**，全程陪伴你学习本课程。\n\n我可以帮你做这些事情：\n- 📚 **知识点答疑**：劳斯判据、伯德图、根轨迹、PID...\n- 🎯 **考研指导**：高频考点、解题套路、真题推荐\n- 💻 **仿真实验辅助**：参数调节建议\n- ✅ **作业与习题**：逐步讲解思路\n\n试试问我："什么是超调量？""给我讲劳斯判据""PID怎么整定？"`;
  }
  return `收到你的问题："${text}"。\n\n这是一个很好的问题。我可以从以下几个角度为你解析：\n1️⃣ 核心概念与定义\n2️⃣ 数学推导与物理意义\n3️⃣ 典型例题讲解\n4️⃣ 常见错误与易混点\n\n📌 你可以尝试以下高频问题获得详细解答：\n- 什么是劳斯判据？怎么用？\n- 超调量怎么计算？\n- PID三个参数各起什么作用？\n- 伯德图怎么画？\n- 根轨迹的绘制法则？`;
}
