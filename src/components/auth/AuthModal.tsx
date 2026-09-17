import { useState } from 'react';
import { X, Eye, EyeOff, Loader2, Sparkles, ShieldCheck, Award } from 'lucide-react';
import { useLearningStore } from '@/store/useLearningStore';

type Mode = 'login' | 'register';

interface Props {
  open: boolean;
  onClose: () => void;
  defaultMode?: Mode;
}

export default function AuthModal({ open, onClose, defaultMode = 'login' }: Props) {
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [showPwd, setShowPwd] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [realName, setRealName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const login = useLearningStore((s) => s.login);
  const register = useLearningStore((s) => s.register);

  if (!open) return null;

  const reset = () => {
    setUsername('');
    setPassword('');
    setRealName('');
    setEmail('');
    setError(null);
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    reset();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(username.trim(), password);
      } else {
        await register({
          username: username.trim(),
          password,
          realName: realName.trim() || username.trim(),
          email: email.trim() || undefined,
        });
      }
      onClose();
      reset();
    } catch (err: any) {
      setError(err?.message || '操作失败，请检查输入');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role: 'admin' | 'teacher' | 'student') => {
    if (role === 'admin') { setUsername('admin'); setPassword('admin123'); }
    else if (role === 'teacher') { setUsername('teacher'); setPassword('teacher123'); }
    else { setUsername('student'); setPassword('student123'); }
    setMode('login');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md glass-card rounded-3xl p-7 shadow-2xl animate-[fadeIn_.25s_ease] border border-white/10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 via-signal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-signal-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-xl text-white">
              {mode === 'login' ? '欢迎回来 👋' : '加入学习计划 🚀'}
            </h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {mode === 'login' ? '登录后同步所有学习进度' : '立即开启你的自控原理之旅'}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-2xl border border-white/5">
          {(['login', 'register'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                mode === m
                  ? 'bg-gradient-to-r from-brand-500/90 to-signal-500/90 text-white shadow-md shadow-signal-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {m === 'login' ? '登 录' : '注 册'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">学号/用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={2}
              maxLength={32}
              placeholder="请输入用户名"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-signal-500/50 focus:border-signal-500/50 transition-all"
            />
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">真实姓名（可选）</label>
                <input
                  type="text"
                  value={realName}
                  onChange={(e) => setRealName(e.target.value)}
                  maxLength={32}
                  placeholder="例如：李同学"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-signal-500/50 focus:border-signal-500/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">邮箱（可选）</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={128}
                  placeholder="you@school.edu.cn"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-signal-500/50 focus:border-signal-500/50 transition-all"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5 ml-1">密码</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                maxLength={128}
                placeholder="请输入密码（≥6位）"
                className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-signal-500/50 focus:border-signal-500/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-sm px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-brand-500 via-signal-500 to-cyan-400 hover:shadow-lg hover:shadow-signal-500/30 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> 处理中...
              </>
            ) : mode === 'login' ? '登 录' : '创建账号并登录'}
          </button>
        </form>

        {mode === 'login' && (
          <div className="mt-6 pt-5 border-t border-white/5">
            <p className="text-xs text-slate-500 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-signal-400/70" />
              快速体验（预注册演示账号）
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => fillDemo('admin')} className="group p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-amber-400/30 transition-all">
                <div className="text-xs font-medium text-amber-300/90 group-hover:text-amber-200 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" /> 管理员
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">admin123</div>
              </button>
              <button onClick={() => fillDemo('teacher')} className="group p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-brand-400/30 transition-all">
                <div className="text-xs font-medium text-brand-300/90 group-hover:text-brand-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> 教师
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">teacher123</div>
              </button>
              <button onClick={() => fillDemo('student')} className="group p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-signal-400/30 transition-all">
                <div className="text-xs font-medium text-signal-300/90 group-hover:text-signal-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> 学生
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-mono">student123</div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
