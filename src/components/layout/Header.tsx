import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Menu, X, Sparkles, User, BookOpen, LayoutGrid, FlaskConical, Bot, Trophy, LogOut, Award, GraduationCap, Signal } from 'lucide-react';
import { useLearningStore } from '@/store/useLearningStore';
import AuthModal from '@/components/auth/AuthModal';

const navItems = [
  { label: '课程亮点', href: '#highlights', icon: Sparkles },
  { label: '课程大纲', href: '#syllabus', icon: BookOpen },
  { label: 'AI助教', href: '#ai-tutor', icon: Bot },
  { label: '仿真实验', href: '#simulation', icon: FlaskConical },
  { label: '学习资源', href: '#resources', icon: LayoutGrid },
  { label: '师资团队', href: '#team', icon: User },
  { label: '学习排行', href: '#leaderboard', icon: Trophy },
];

const routerItems = [
  { label: '实验平台', to: '/lab', icon: FlaskConical, accent: true },
  { label: '智慧课堂', to: '/classroom', icon: Signal },
];

function roleLabel(role: string) {
  if (role === 'admin') return { label: '管理员', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/25' };
  if (role === 'teacher') return { label: '教师', cls: 'bg-brand-500/15 text-brand-300 border-brand-500/25' };
  return { label: '学生', cls: 'bg-signal-500/15 text-signal-300 border-signal-500/25' };
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const auth = useLearningStore((s) => s.auth);
  const logout = useLearningStore((s) => s.logout);
  const progress = useLearningStore((s) => s.userProgress);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const rl = roleLabel(auth.user.role);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300
        ${scrolled ? 'bg-slate-950/75 backdrop-blur-xl border-b border-white/5 py-3' : 'bg-transparent py-5'}`}
    >
      <div className="container flex items-center justify-between">
        <a href="#top" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-brand-500 via-signal-500 to-cyan-400 blur opacity-70 group-hover:opacity-100 transition-opacity" />
            <div className="relative w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center">
              <Activity className="w-6 h-6 text-signal-400" />
            </div>
          </div>
          <div className="leading-tight">
            <div className="font-serif font-bold text-white text-lg tracking-wide">
              自动控制原理
            </div>
            <div className="text-[11px] text-slate-400 tracking-[0.2em] uppercase font-medium">
              Principles of Auto.Control
            </div>
          </div>
        </a>

        <nav className="hidden xl:flex items-center gap-0.5">
          {routerItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`group flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border ${
                item.accent
                  ? 'text-amber-300 bg-amber-500/10 border-amber-500/25 hover:bg-amber-500/20'
                  : 'text-signal-300 bg-signal-500/10 border-signal-500/25 hover:bg-signal-500/20'
              }`}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </Link>
          ))}
          <span className="w-px h-5 bg-white/10 mx-1.5" />
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group flex items-center gap-1.5 whitespace-nowrap px-2.5 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200"
            >
              <item.icon className="w-3.5 h-3.5 text-signal-400/80 group-hover:text-signal-400 transition-colors" />
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden xl:flex items-center gap-2.5">
          {!auth.isLoggedIn ? (
            <>
              <button className="btn-ghost text-sm" onClick={() => setAuthOpen(true)}>
                <User className="w-4 h-4" /> 登录
              </button>
              <button className="btn-primary !py-2 !px-4 text-sm" onClick={() => { setAuthOpen(true); }}>
                立即学习
                <span aria-hidden>→</span>
              </button>
            </>
          ) : (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-signal-500 to-cyan-500 overflow-hidden flex items-center justify-center ring-2 ring-white/10">
                  <img src={auth.user.avatar} alt={auth.user.realName} className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as any).remove(); }} />
                </div>
                <div className="text-left leading-tight">
                  <div className="text-sm font-medium text-white whitespace-nowrap">{auth.user.realName || auth.user.username}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{auth.user.studentId || auth.user.username}</div>
                </div>
                <span className={`tag-pill border ${rl.cls}`}>{rl.label}</span>
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-3 w-72 glass-card rounded-2xl p-3 shadow-2xl z-20 border border-white/10 animate-[fadeIn_.2s_ease]">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-signal-500/10 via-brand-500/10 to-cyan-500/10 border border-white/5 mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-signal-500 to-cyan-500 overflow-hidden flex items-center justify-center ring-2 ring-white/20">
                          <img src={auth.user.avatar} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as any).remove(); }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-white truncate">{auth.user.realName || auth.user.username}</div>
                          <div className="text-xs text-slate-400 truncate flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" />
                            {auth.user.college} · {auth.user.major}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 px-1 pt-1 pb-2 mb-1">
                      <div className="text-center">
                        <div className="text-lg font-bold text-signal-300">{progress.totalScore || 0}</div>
                        <div className="text-[10px] text-slate-500">积分</div>
                      </div>
                      <div className="text-center border-x border-white/5">
                        <div className="text-lg font-bold text-brand-300">{progress.totalHours || 0}</div>
                        <div className="text-[10px] text-slate-500">学时</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-amber-300">{progress.streakDays || 0}</div>
                        <div className="text-[10px] text-slate-500">连学</div>
                      </div>
                    </div>
                    {progress.badges && progress.badges.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 px-1 pb-2 mb-1">
                        {progress.badges.slice(0, 6).map((b: any, i: number) => (
                          <span key={i} className="tag-pill bg-white/5 text-amber-300/80 border-amber-400/10 text-[10px]">
                            <Award className="w-3 h-3 mr-1 inline-block align-[-2px]" />
                            {typeof b === 'string' ? b : b.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={async () => { await logout(); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-rose-300 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                    >
                      <LogOut className="w-4 h-4" /> 退出登录
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden btn-ghost !p-2"
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden mt-3 container">
          <nav className="glass-card rounded-2xl p-3 flex flex-col gap-1">
            {routerItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold ${
                  item.accent ? 'text-amber-300 bg-amber-500/10' : 'text-signal-300 bg-signal-500/10'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            <div className="border-t border-white/10 my-1" />
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/5"
              >
                <item.icon className="w-4 h-4 text-signal-400" />
                {item.label}
              </a>
            ))}
            <div className="flex gap-2 pt-2 mt-1 border-t border-white/10">
              {auth.isLoggedIn ? (
                <>
                  <div className="flex-1 text-xs text-slate-400 px-3 py-2 rounded-xl bg-white/5">
                    {auth.user.realName} · {roleLabel(auth.user.role).label}
                  </div>
                  <button
                    onClick={async () => { await logout(); setOpen(false); }}
                    className="btn-ghost text-sm !text-rose-300"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-ghost text-sm flex-1" onClick={() => { setAuthOpen(true); setOpen(false); }}>登录</button>
                  <button className="btn-primary !py-2.5 text-sm flex-1" onClick={() => { setAuthOpen(true); setOpen(false); }}>立即学习</button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </header>
  );
}
