import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, CheckCircle2, XCircle, ChevronRight, RotateCcw,
  Award, Clock, AlertCircle, Trophy
} from 'lucide-react';
import { courseApi, submissionApi } from '@/lib/api';
import { useLearningStore } from '@/store/useLearningStore';

interface Props {
  lessonId: string;
  chapterId: number;
  onComplete: () => void;
}

interface Question {
  id: string;
  type: 'single' | 'multiple' | 'truefalse' | 'fill' | 'short' | 'calc';
  content: string;
  options?: { key: string; content: string }[];
  answer: string | string[];
  analysis: string;
  score: number;
  difficulty: number;
  source: string;
}

type Phase = 'loading' | 'answering' | 'submitted';

export default function ExercisePanel({ lessonId, chapterId, onComplete }: Props) {
  const isLoggedIn = useLearningStore((s) => s.auth.isLoggedIn);
  const [phase, setPhase] = useState<Phase>('loading');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ score: number; totalScore: number; correct: number; total: number } | null>(null);

  const loadQuestions = useCallback(async () => {
    setPhase('loading');
    setError(null);
    try {
      const res = await courseApi.questions({ chapterId, pageSize: 5 });
      const qs = (res.items || []).slice(0, 5);
      if (qs.length === 0) {
        setError('本章暂无习题');
        setPhase('answering');
        return;
      }
      setQuestions(qs);
      setPhase('answering');
    } catch (err: any) {
      setError(err?.message || '加载习题失败');
      setPhase('answering');
    }
  }, [chapterId]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const q = questions[current];

  const setAnswer = (val: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [q.id]: val }));
  };

  const toggleMulti = (key: string) => {
    const prev = (answers[q.id] as string[]) || [];
    const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
    setAnswer(next);
  };

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      setError('请先登录后再提交答案');
      return;
    }
    const unanswered = questions.filter(qx => !answers[qx.id]);
    if (unanswered.length > 0) {
      setError(`还有 ${unanswered.length} 道题未作答`);
      return;
    }
    setPhase('loading');
    try {
      const sub = await submissionApi.submit({ exerciseSetId: lessonId, answers, durationUsed: 0 });
      setResult({
        score: sub.score || 0,
        totalScore: sub.totalScore || 0,
        correct: sub.correctCount || 0,
        total: sub.totalCount || questions.length,
      });
      setPhase('submitted');
      onComplete();
    } catch (err: any) {
      setError(err?.message || '提交失败');
      setPhase('answering');
    }
  };

  const retry = () => {
    setAnswers({});
    setResult(null);
    setCurrent(0);
    setPhase('answering');
    setError(null);
  };

  if (phase === 'loading' && questions.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 border border-white/5 flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-6 h-6 animate-spin text-signal-400" />
        <span className="ml-3 text-sm text-slate-400">加载习题中...</span>
      </div>
    );
  }

  // 提交结果
  if (phase === 'submitted' && result) {
    const pct = result.totalScore > 0 ? Math.round((result.score / result.totalScore) * 100) : 0;
    const passed = pct >= 60;
    return (
      <div className="glass-card rounded-2xl p-6 border border-white/5 text-center">
        <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${passed ? 'bg-emerald-500/15' : 'bg-amber-500/15'}`}>
          <Trophy className={`w-8 h-8 ${passed ? 'text-emerald-400' : 'text-amber-400'}`} />
        </div>
        <h3 className="font-serif font-bold text-xl text-white mb-2">
          {passed ? '🎉 恭喜通过！' : '继续努力！'}
        </h3>
        <div className="flex justify-center gap-6 my-5">
          <div>
            <div className="text-3xl font-serif font-black text-signal-300">{result.score}</div>
            <div className="text-xs text-slate-400 mt-0.5">得分 / {result.totalScore}</div>
          </div>
          <div className="border-l border-white/10" />
          <div>
            <div className="text-3xl font-serif font-black text-emerald-300">{result.correct}</div>
            <div className="text-xs text-slate-400 mt-0.5">正确 / {result.total}</div>
          </div>
          <div className="border-l border-white/10" />
          <div>
            <div className={`text-3xl font-serif font-black ${passed ? 'text-emerald-300' : 'text-amber-300'}`}>{pct}%</div>
            <div className="text-xs text-slate-400 mt-0.5">正确率</div>
          </div>
        </div>

        {/* 逐题查看 */}
        <div className="text-left space-y-3 mt-6">
          {questions.map((qx, i) => {
            const userAns = answers[qx.id];
            const userStr = Array.isArray(userAns) ? userAns.sort().join('|') : String(userAns).trim().toLowerCase();
            const correctStr = Array.isArray(qx.answer) ? [...qx.answer].sort().join('|') : String(qx.answer).trim().toLowerCase();
            const isCorrect = userStr === correctStr;
            return (
              <div key={qx.id} className={`p-4 rounded-xl border ${isCorrect ? 'bg-emerald-500/5 border-emerald-500/15' : 'bg-rose-500/5 border-rose-500/15'}`}>
                <div className="flex items-start gap-3">
                  {isCorrect
                    ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    : <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-200 mb-2">{i + 1}. {qx.content}</div>
                    <div className="text-xs text-slate-400">
                      你的答案: <span className={isCorrect ? 'text-emerald-300' : 'text-rose-300'}>{userStr || '未作答'}</span>
                    </div>
                    {!isCorrect && (
                      <div className="text-xs text-slate-400 mt-1">
                        正确答案: <span className="text-emerald-300">{correctStr}</span>
                      </div>
                    )}
                    {qx.analysis && (
                      <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-white/5">
                        💡 {qx.analysis}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={retry} className="mt-6 px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-signal-500 to-brand-500 hover:shadow-lg transition flex items-center gap-2 mx-auto">
          <RotateCcw className="w-4 h-4" /> 再做一遍
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 border border-white/5 text-center">
        <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
        <div className="text-slate-400 text-sm">{error || '本章暂无习题'}</div>
      </div>
    );
  }

  const typeLabel = { single: '单选题', multiple: '多选题', truefalse: '判断题', fill: '填空题', short: '简答题', calc: '计算题' };
  const diffStars = '★'.repeat(q.difficulty) + '☆'.repeat(5 - q.difficulty);

  return (
    <div className="glass-card rounded-2xl p-5 md:p-6 border border-white/5">
      {/* 进度条 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === current ? 'w-8 bg-signal-400' : i < current ? 'w-4 bg-signal-500/50' : 'w-4 bg-slate-700'}`}
            />
          ))}
        </div>
        <span className="text-xs text-slate-400 font-mono whitespace-nowrap">
          {current + 1} / {questions.length}
        </span>
      </div>

      {/* 题目 */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="tag-pill bg-signal-500/15 text-signal-300 border border-signal-500/25 text-xs">
            {typeLabel[q.type]}
          </span>
          <span className="tag-pill bg-amber-500/10 text-amber-300 border border-amber-500/20 text-xs">
            {diffStars}
          </span>
          <span className="tag-pill bg-white/5 text-slate-400 border border-white/10 text-xs">
            {q.score} 分
          </span>
          {q.source === 'kaoyan' && (
            <span className="tag-pill bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs">
              考研真题
            </span>
          )}
        </div>
        <div className="text-slate-100 text-[15px] leading-relaxed whitespace-pre-line">
          {q.content}
        </div>
      </div>

      {/* 选项 / 填空 */}
      {q.type === 'single' || q.type === 'truefalse' ? (
        <div className="space-y-2.5">
          {q.options?.map((opt) => {
            const selected = answers[q.id] === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => setAnswer(opt.key)}
                className={`w-full text-left p-3.5 rounded-xl border transition flex items-center gap-3 ${
                  selected
                    ? 'bg-signal-500/15 border-signal-500/40 text-white'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/8'
                }`}
              >
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  selected ? 'bg-signal-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {opt.key}
                </span>
                <span className="text-sm">{opt.content}</span>
              </button>
            );
          })}
        </div>
      ) : q.type === 'multiple' ? (
        <div className="space-y-2.5">
          <div className="text-xs text-slate-400 mb-2">⚠️ 多选题，选择所有正确选项</div>
          {q.options?.map((opt) => {
            const sel = (answers[q.id] as string[]) || [];
            const selected = sel.includes(opt.key);
            return (
              <button
                key={opt.key}
                onClick={() => toggleMulti(opt.key)}
                className={`w-full text-left p-3.5 rounded-xl border transition flex items-center gap-3 ${
                  selected
                    ? 'bg-signal-500/15 border-signal-500/40 text-white'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20 hover:bg-white/8'
                }`}
              >
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  selected ? 'bg-signal-500 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {opt.key}
                </span>
                <span className="text-sm">{opt.content}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div>
          <input
            type="text"
            value={(answers[q.id] as string) || ''}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="请输入你的答案..."
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-signal-500/50 focus:border-signal-500/50 transition"
          />
        </div>
      )}

      {error && (
        <div className="mt-4 text-sm px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
        <button
          onClick={() => setCurrent(c => Math.max(0, c - 1))}
          disabled={current === 0}
          className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          上一题
        </button>

        {current < questions.length - 1 ? (
          <button
            onClick={() => setCurrent(c => c + 1)}
            disabled={!answers[q.id]}
            className="px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-signal-500 to-brand-500 hover:shadow-lg transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            下一题 <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!isLoggedIn || phase === 'loading'}
            className="px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {phase === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
            提交答卷
          </button>
        )}
      </div>
    </div>
  );
}
