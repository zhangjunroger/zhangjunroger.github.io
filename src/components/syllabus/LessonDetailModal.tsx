import { useState, useEffect } from 'react';
import {
  X, CirclePlay, FileText, FlaskConical, ClipboardList,
  CheckCircle2, Lock, Clock, BookOpen, Target,
  Loader2, ArrowRight, Award, Upload, BookMarked,
  Lightbulb, Zap, AlertCircle, Info
} from 'lucide-react';
import { useLearningStore, type UILesson } from '@/store/useLearningStore';
import ExercisePanel from './ExercisePanel';
import LatexContent from '@/components/common/LatexContent';
import { getLessonContent, type LessonContentSection } from '@/data/lessonContents';

interface Props {
  lesson: UILesson | null;
  chapterTitle: string;
  onClose: () => void;
}

const typeMeta = {
  video: { icon: CirclePlay, label: '视频课程', color: 'from-violet-500 to-fuchsia-500', bg: 'bg-violet-500/10' },
  ppt: { icon: FileText, label: '课件PPT', color: 'from-amber-500 to-orange-500', bg: 'bg-amber-500/10' },
  experiment: { icon: FlaskConical, label: '仿真实验', color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-500/10' },
  exercise: { icon: ClipboardList, label: '练习测验', color: 'from-signal-500 to-cyan-500', bg: 'bg-signal-500/10' },
};

const sectionStyle: Record<string, { icon: typeof BookOpen; label: string; color: string; bg: string; border: string }> = {
  definition: { icon: BookMarked, label: '定义', color: 'text-signal-300', bg: 'bg-signal-500/8', border: 'border-signal-500/20' },
  theorem: { icon: Lightbulb, label: '定理', color: 'text-amber-300', bg: 'bg-amber-500/8', border: 'border-amber-500/20' },
  formula: { icon: Zap, label: '公式', color: 'text-violet-300', bg: 'bg-violet-500/8', border: 'border-violet-500/20' },
  example: { icon: Target, label: '例题', color: 'text-emerald-300', bg: 'bg-emerald-500/8', border: 'border-emerald-500/20' },
  note: { icon: Info, label: '要点', color: 'text-cyan-300', bg: 'bg-cyan-500/8', border: 'border-cyan-500/20' },
  summary: { icon: BookOpen, label: '小结', color: 'text-rose-300', bg: 'bg-rose-500/8', border: 'border-rose-500/20' },
};

export default function LessonDetailModal({ lesson, chapterTitle, onClose }: Props) {
  const markLessonCompleted = useLearningStore((s) => s.markLessonCompleted);
  const isLoggedIn = useLearningStore((s) => s.auth.isLoggedIn);
  const userRole = useLearningStore((s) => s.auth.user?.role);
  const [completing, setCompleting] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (lesson) {
      setJustCompleted(false);
      setUploadedFile(null);
      setShowUploadArea(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [lesson]);

  if (!lesson) return null;

  const meta = typeMeta[lesson.type];
  const Icon = meta.icon;

  // 从 lesson.id (格式: lesson-{chapterId}-{index}) 中解析
  const idMatch = lesson.id.match(/lesson-(\d+)-(\d+)/);
  const chapterId = idMatch ? parseInt(idMatch[1]) : lesson.chapterId || 0;
  const lessonIndex = idMatch ? parseInt(idMatch[2]) - 1 : 0;
  const lessonContent = getLessonContent(chapterId, lessonIndex);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleComplete = async () => {
    if (!isLoggedIn) {
      showToast('请先登录后再标记完成');
      return;
    }
    if (lesson.isCompleted || justCompleted) return;
    setCompleting(true);
    try {
      markLessonCompleted(lesson.id);
      setJustCompleted(true);
      showToast('✅ 已标记完成，获得 +50 积分');
    } finally {
      setCompleting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileSize = (file.size / 1024 / 1024).toFixed(1);
    setUploadedFile(`${file.name} (${fileSize} MB)`);
    showToast(`📁 文件 "${file.name}" 已选择，上传功能演示`);
  };

  const isDone = lesson.isCompleted || justCompleted;
  const isTeacher = userRole === 'teacher' || userRole === 'admin';

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 md:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md" />

      <div
        className="relative w-full max-w-4xl max-h-[92vh] overflow-auto glass-card rounded-3xl border border-signal-500/20 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`relative ${meta.bg} border-b border-white/10 p-6 md:p-7 sticky top-0 z-10 backdrop-blur-xl`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4 pr-10">
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${meta.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className={`tag-pill ${meta.bg} text-white border border-white/10`}>{meta.label}</span>
                <span className="tag-pill bg-white/5 text-slate-300 border border-white/10">
                  <Clock className="w-3 h-3 mr-1" /> {lesson.durationMinutes} 分钟
                </span>
                {isDone && (
                  <span className="tag-pill bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> 已完成
                  </span>
                )}
              </div>
              <h2 className="font-serif font-bold text-xl md:text-2xl text-white leading-tight">
                {lesson.title}
              </h2>
              <p className="text-sm text-slate-400 mt-1">{chapterTitle}</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 md:p-7 space-y-6">
          {/* 学习目标 */}
          {lesson.objectives && lesson.objectives.length > 0 && (
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-signal-400" />
                <h3 className="font-semibold text-white text-sm">学习目标</h3>
              </div>
              <ul className="space-y-2">
                {lesson.objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <span className="w-5 h-5 rounded-md bg-signal-500/15 text-signal-300 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {obj}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* === 视频区域 === */}
          {lesson.type === 'video' && (
            <div className="glass-card rounded-2xl overflow-hidden border border-white/5">
              <div className="aspect-video bg-slate-900 flex items-center justify-center relative group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5" />
                {uploadedFile ? (
                  <div className="relative text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <CirclePlay className="w-10 h-10 text-white ml-1" />
                    </div>
                    <div className="text-white font-medium">{uploadedFile}</div>
                    <div className="text-sm text-slate-400 mt-1">点击播放</div>
                  </div>
                ) : (
                  <div className="relative text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/30 group-hover:scale-110 transition-transform">
                      <CirclePlay className="w-10 h-10 text-white ml-1" />
                    </div>
                    <div className="text-white font-medium">{lesson.title}</div>
                    <div className="text-sm text-slate-400 mt-1">时长 {lesson.durationMinutes} 分钟</div>
                    {isTeacher && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowUploadArea(true); }}
                        className="mt-3 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium flex items-center gap-2 mx-auto transition"
                      >
                        <Upload className="w-4 h-4" /> 上传视频文件
                      </button>
                    )}
                    {!isTeacher && (
                      <div className="text-xs text-slate-500 mt-3">暂无视频资源，请联系教师上传</div>
                    )}
                  </div>
                )}
              </div>
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <BookOpen className="w-3.5 h-3.5" />
                  涉及 {lesson.knowledgePoints?.length || 3} 个知识点
                </div>
                <button className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition flex items-center gap-1.5">
                  1.0x 倍速
                </button>
              </div>

              {/* 上传区域 */}
              {showUploadArea && isTeacher && (
                <div className="p-4 border-t border-white/5 bg-slate-950/40">
                  <label className="block">
                    <div className="border-2 border-dashed border-signal-500/30 rounded-xl p-6 text-center hover:bg-signal-500/5 transition cursor-pointer">
                      <Upload className="w-8 h-8 text-signal-400 mx-auto mb-2" />
                      <div className="text-sm text-slate-300 font-medium">点击选择视频文件</div>
                      <div className="text-xs text-slate-500 mt-1">支持 MP4 / WebM / MOV 格式，建议 &lt; 500MB</div>
                    </div>
                    <input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                  <div className="text-xs text-slate-500 mt-2 flex items-start gap-1.5">
                    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    上传的文件将保存在服务器 public/uploads/ 目录，部署后可通过此入口管理课程资源
                  </div>
                </div>
              )}
            </div>
          )}

          {/* === PPT 课件区域 === */}
          {lesson.type === 'ppt' && (
            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white">{lesson.title} · 课件</div>
                  <div className="text-xs text-slate-400">共 32 页 · 支持在线翻阅</div>
                </div>
                {isTeacher && !uploadedFile && (
                  <button
                    onClick={() => setShowUploadArea(!showUploadArea)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition"
                  >
                    <Upload className="w-3.5 h-3.5" /> 上传课件
                  </button>
                )}
              </div>

              {uploadedFile ? (
                <div className="aspect-[16/10] rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center">
                  <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-amber-400" />
                    <div className="text-sm text-white">{uploadedFile}</div>
                    <button className="mt-3 px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 text-sm">查看课件</button>
                  </div>
                </div>
              ) : (
                <div className="aspect-[16/10] rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center">
                  <div className="text-center text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <div className="text-sm">课件预览区域</div>
                    <div className="text-xs mt-1">{isTeacher ? '请点击"上传课件"按钮添加PPT文件' : '暂无课件资源'}</div>
                  </div>
                </div>
              )}

              {showUploadArea && isTeacher && (
                <div className="mt-4">
                  <label className="block">
                    <div className="border-2 border-dashed border-amber-500/30 rounded-xl p-6 text-center hover:bg-amber-500/5 transition cursor-pointer">
                      <Upload className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                      <div className="text-sm text-slate-300 font-medium">点击选择PPT文件</div>
                      <div className="text-xs text-slate-500 mt-1">支持 PPT / PPTX / PDF 格式</div>
                    </div>
                    <input type="file" accept=".ppt,.pptx,.pdf" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              )}
            </div>
          )}

          {/* === 仿真实验区域 === */}
          {lesson.type === 'experiment' && (
            <div className="glass-card rounded-2xl p-6 border border-white/5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <FlaskConical className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-white">{lesson.title}</div>
                  <div className="text-xs text-slate-400">交互式仿真实验</div>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-sm text-slate-300 leading-relaxed">
                本课时为仿真实验，请在下方"仿真实验"模块中操作。你可以调整系统参数，观察阶跃响应、伯德图和根轨迹的变化，深入理解控制理论的物理意义。
              </div>
              <button
                onClick={() => {
                  onClose();
                  setTimeout(() => {
                    document.getElementById('simulation')?.scrollIntoView({ behavior: 'smooth' });
                  }, 200);
                }}
                className="mt-4 w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:shadow-lg hover:shadow-emerald-500/25 transition flex items-center justify-center gap-2"
              >
                <FlaskConical className="w-4 h-4" /> 前往仿真实验台
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* === 练习测验区域 === */}
          {lesson.type === 'exercise' && (
            <ExercisePanel lessonId={lesson.id} chapterId={chapterId} onComplete={handleComplete} />
          )}

          {/* === 详细知识点内容（LaTeX渲染）=== */}
          {lessonContent && lessonContent.sections.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pt-2">
                <BookOpen className="w-5 h-5 text-signal-400" />
                <h3 className="font-serif font-bold text-lg text-white">本节知识点详解</h3>
                <span className="text-xs text-slate-500">· 共 {lessonContent.sections.length} 个知识点</span>
              </div>

              {lessonContent.sections.map((sec: LessonContentSection, idx: number) => {
                const ss = sectionStyle[sec.type] || sectionStyle.note;
                const SecIcon = ss.icon;
                return (
                  <div
                    key={idx}
                    className={`glass-card rounded-2xl p-5 border ${ss.border} ${ss.bg}`}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0`}>
                        <SecIcon className={`w-4 h-4 ${ss.color}`} />
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-wider ${ss.color}`}>
                        {ss.label}
                      </span>
                      <span className="text-xs text-slate-500">#{idx + 1}</span>
                      <h4 className="font-semibold text-white text-[15px] ml-1">{sec.title}</h4>
                    </div>
                    <LatexContent
                      content={sec.body}
                      className="text-sm text-slate-200 leading-relaxed"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* 知识点标签 */}
          {lesson.knowledgePoints && lesson.knowledgePoints.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
              <span className="text-xs text-slate-500 self-center">关联知识点：</span>
              {lesson.knowledgePoints.map((kp, i) => (
                <span key={i} className="tag-pill bg-white/5 text-slate-400 border border-white/10 text-xs">
                  {kp}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {lesson.type !== 'exercise' && (
          <div className="p-5 md:p-6 border-t border-white/5 bg-slate-950/40 sticky bottom-0 backdrop-blur-xl flex items-center justify-between gap-3">
            <div className="text-xs text-slate-400">
              {isDone ? (
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> 本课时已完成，获得 +50 积分
                </span>
              ) : isLoggedIn ? (
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> 学习完毕后点击右侧按钮标记
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-amber-400">
                  <Lock className="w-3.5 h-3.5" /> 请先登录后学习
                </span>
              )}
            </div>
            <button
              onClick={handleComplete}
              disabled={isDone || completing}
              className="px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-signal-500 to-brand-500 hover:shadow-lg hover:shadow-signal-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
            >
              {completing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> 处理中...</>
              ) : isDone ? (
                <><CheckCircle2 className="w-4 h-4" /> 已完成</>
              ) : (
                <><Award className="w-4 h-4" /> 标记为已完成</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-2xl bg-signal-500/90 border border-signal-400/40 text-white shadow-2xl text-sm font-medium animate-[fadeIn_.2s_ease]">
          {toast}
        </div>
      )}
    </div>
  );
}
