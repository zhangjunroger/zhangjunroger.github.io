import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SafeUser, UserProgress, LeaderboardEntry } from '@shared/types.js';
import type { Chapter } from '@shared/types.js';
import { authApi, progressApi, leaderboardApi } from '@/lib/api.js';

// ===== 引入内置静态数据 (生产环境无后端时直接可用) =====
import {
  CHAPTERS as STATIC_CHAPTERS,
  TEACHERS as STATIC_TEACHERS,
  SIMULATIONS as STATIC_SIMS,
  RESOURCES as STATIC_RESOURCES,
  QUESTIONS as STATIC_QUESTIONS,
  SEED_USERS as STATIC_USERS,
} from '@shared/seed.js';

// 适配前端内部展示章节结构 (保持兼容)
export interface UILesson {
  id: string;
  chapterId: number;
  title: string;
  type: 'video' | 'ppt' | 'experiment' | 'exercise';
  durationMinutes: number;
  description: string;
  objectives: string[];
  knowledgePoints: string[];
  isCompleted: boolean;
}

export interface UIChapter extends Omit<Chapter, 'lessons'> {
  lessons: UILesson[];
  progress: number;
  isCompleted: boolean;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  formattedContent?: string;
  timestamp: number;
  suggestions?: string[];
  relatedKPs?: string[];
}

export interface StudentProgress {
  id: string;
  name: string;
  realName: string;
  avatar: string;
  totalHours: number;
  score: number;
  streakDays: number;
  rank: number;
  completedLessons: number;
  mastery: Record<string, number>;
  masteryAvg: number;
}

function chaptersToUI(chapters: Chapter[], completedIds: Set<string>): UIChapter[] {
  return chapters.map(ch => {
    const lessons: UILesson[] = ch.lessons.map(l => ({
      id: l.id,
      chapterId: ch.id,
      title: l.title,
      type: l.type,
      durationMinutes: l.durationMinutes,
      description: l.description,
      objectives: l.objectives,
      knowledgePoints: l.knowledgePoints,
      isCompleted: completedIds.has(l.id),
    }));
    const done = lessons.filter(l => l.isCompleted).length;
    const progress = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
    return {
      ...ch,
      lessons,
      progress,
      isCompleted: progress === 100,
    };
  });
}

const DEMO_USER: SafeUser = {
  id: 'demo-user',
  username: '访客',
  email: 'guest@zdkzyl.edu',
  role: 'student',
  realName: '学习体验者',
  studentId: 'GUEST-0001',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zdkzyl-guest',
  college: '自动化学院',
  major: '自动化',
  className: '体验班',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  isActive: true,
};

export interface LearningState {
  // 认证与用户
  auth: {
    token: string | null;
    user: SafeUser;
    isLoggedIn: boolean;
  };
  login: (username: string, password: string) => Promise<void>;
  register: (payload: { username: string; password: string; realName?: string; email?: string }) => Promise<void>;
  logout: () => Promise<void>;
  _setAuth: (token: string, user: SafeUser) => void;
  updateUser: (patch: Partial<SafeUser>) => void;

  // 学习进度
  userProgress: UserProgress;
  setProgress: (p: Partial<UserProgress>) => void;
  completedLessonIds: string[];
  markLessonCompleted: (lessonId: string) => void;
  fetchProgress: () => Promise<void>;

  // 章节与课程
  chapters: UIChapter[];
  refreshChapters: () => void;

  // AI 对话
  aiMessages: AIMessage[];
  addAIMessage: (msg: AIMessage) => void;
  clearAIMessages: () => void;

  // 仿真实验
  currentSimParams: Record<string, number>;
  setSimParam: (key: string, value: number) => void;
  resetSimParams: () => void;

  // 排行榜 (缓存)
  leaderboard: LeaderboardEntry[];
  setLeaderboard: (list: LeaderboardEntry[]) => void;
  fetchLeaderboard: () => Promise<void>;

  // 当前学生演示信息
  currentStudent: StudentProgress;
}

const defaultSimParams = {
  wn: 2,
  zeta: 0.5,
  K: 10,
  T1: 0.5,
  T2: 0.1,
  p1: -1,
  p2: -2,
  z1: 5,
};

const defaultProgress: UserProgress = {
  userId: DEMO_USER.id,
  totalHours: 0,
  totalScore: 0,
  streakDays: 0,
  lastActiveAt: Date.now(),
  completedLessons: [],
  completedExercises: [],
  completedExperiments: [],
  mastery: {},
  badges: [],
  dailyProgress: [],
  updatedAt: Date.now(),
};

const initialCompleted: string[] = [];

export const useLearningStore = create<LearningState>()(
  persist(
    (set, get) => ({
      // ===== 认证 =====
      auth: {
        token: null,
        user: DEMO_USER,
        isLoggedIn: false,
      },
      _setAuth: (token: string, user: SafeUser) => {
        set({
          auth: { token, user, isLoggedIn: true },
          userProgress: { ...defaultProgress, userId: user.id },
        });
      },
      login: async (username: string, password: string) => {
        try {
          const res = await authApi.login(username, password);
          set({
            auth: { token: res.token, user: res.user, isLoggedIn: true },
            userProgress: res.progress ? { ...res.progress, userId: res.user.id } : { ...defaultProgress, userId: res.user.id },
            completedLessonIds: res.progress?.completedLessons || [],
          });
          try { get().fetchLeaderboard().catch(() => {}); } catch { /* noop */ }
        } catch (err: any) {
          throw new Error(err?.message || '登录失败，请检查账号密码');
        }
      },
      register: async (payload) => {
        const res = await authApi.register(payload);
        set({
          auth: { token: res.token, user: res.user, isLoggedIn: true },
          userProgress: res.progress || { ...defaultProgress, userId: res.user.id },
          completedLessonIds: [],
        });
        try { get().fetchLeaderboard().catch(() => {}); } catch { /* noop */ }
      },
      logout: async () => {
        try { await authApi.logout(); } catch {/* noop */}
        set({
          auth: { token: null, user: DEMO_USER, isLoggedIn: false },
          userProgress: defaultProgress,
          completedLessonIds: [],
          aiMessages: get().aiMessages.slice(0, 1),
        });
      },
      updateUser: (patch) =>
        set((s) => ({ auth: { ...s.auth, user: { ...s.auth.user, ...patch } } })),

      // ===== 学习进度 =====
      userProgress: defaultProgress,
      setProgress: (p) =>
        set((s) => ({ userProgress: { ...s.userProgress, ...p } })),
      completedLessonIds: initialCompleted,
      fetchProgress: async () => {
        if (!get().auth.isLoggedIn) return;
        try {
          const p = await progressApi.get();
          set((s) => ({
            userProgress: p,
            completedLessonIds: p?.completedLessons || s.completedLessonIds,
          }));
        } catch { /* noop */ }
      },
      markLessonCompleted: (lessonId: string) =>
        set((state) => {
          if (state.completedLessonIds.includes(lessonId)) return {};
          const ids = [...state.completedLessonIds, lessonId];
          const chapters = chaptersToUI(STATIC_CHAPTERS as any, new Set(ids));
          const newScore = state.userProgress.totalScore + 50;
          try {
            progressApi.markLesson(lessonId).catch(() => {});
          } catch { /* noop */ }
          return {
            completedLessonIds: ids,
            chapters,
            userProgress: {
              ...state.userProgress,
              completedLessons: ids,
              totalScore: newScore,
              lastActiveAt: Date.now(),
            },
            currentStudent: {
              ...state.currentStudent,
              score: newScore,
              completedLessons: ids.length,
            },
          };
        }),

      // ===== 章节 =====
      chapters: chaptersToUI(STATIC_CHAPTERS as any, new Set(initialCompleted)),
      refreshChapters: () =>
        set((s) => ({
          chapters: chaptersToUI(STATIC_CHAPTERS as any, new Set(s.completedLessonIds)),
        })),

      // ===== AI 对话 =====
      aiMessages: [
        {
          id: 'welcome-001',
          role: 'assistant',
          timestamp: Date.now(),
          content:
            '你好!👋 我是**自动控制原理AI助教小空**。我可以帮你解答:超调量公式、劳斯判据、稳态误差、伯德图、根轨迹、PID整定、校正设计等任意知识点。\n\n试试直接问:"什么是超调量?""给我讲劳斯判据"',
          suggestions: ['超调量怎么计算?', '劳斯判据的两种特殊情况?', '伯德图绘制步骤?', 'PID三个参数作用?'],
        },
      ],
      addAIMessage: (msg) =>
        set((s) => ({ aiMessages: [...s.aiMessages, msg] })),
      clearAIMessages: () =>
        set((s) => ({
          aiMessages: s.aiMessages.slice(0, 1),
        })),

      // ===== 仿真实验 =====
      currentSimParams: defaultSimParams,
      setSimParam: (k, v) =>
        set((s) => ({ currentSimParams: { ...s.currentSimParams, [k]: v } })),
      resetSimParams: () => set({ currentSimParams: defaultSimParams }),

      // ===== 排行榜 =====
      leaderboard: STATIC_USERS
        .filter(u => u.role === 'student' && u._demo)
        .map((u, i) => ({
          userId: u.id,
          rank: i + 1,
          username: u.username,
          realName: u.realName,
          avatar: u.avatar,
          totalScore: u._demo?.score || 0,
          totalHours: u._demo?.hours || 0,
          streakDays: u._demo?.streak || 0,
          completedLessons: u._demo?.lessons || 0,
          masteryAvg: u._demo?.mastery || 0,
        } satisfies LeaderboardEntry)),
      setLeaderboard: (list) => set({ leaderboard: list }),
      fetchLeaderboard: async () => {
        try {
          const list = await leaderboardApi.list();
          if (list && list.length) set({ leaderboard: list });
        } catch { /* noop, keep static fallback */ }
      },

      // ===== 当前演示学生 =====
      currentStudent: {
        id: DEMO_USER.id,
        name: DEMO_USER.username,
        realName: DEMO_USER.realName,
        avatar: DEMO_USER.avatar,
        totalHours: 0,
        score: 0,
        streakDays: 0,
        rank: 0,
        completedLessons: 0,
        mastery: {},
        masteryAvg: 0,
      },
    }),
    {
      name: 'zdkzyl.learning.store.v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        auth: { token: s.auth.token, user: s.auth.user, isLoggedIn: s.auth.isLoggedIn },
        userProgress: s.userProgress,
        completedLessonIds: s.completedLessonIds,
        aiMessages: s.aiMessages.slice(-50),
        currentSimParams: s.currentSimParams,
        leaderboard: s.leaderboard,
      } as Partial<LearningState>),
      version: 2,
      onRehydrateStorage: () => (state) => {
        if (state) {
          // 恢复时同步章节 UI 的完成状态
          const ids = new Set(state.completedLessonIds || []);
          state.chapters = chaptersToUI(STATIC_CHAPTERS as any, ids);
        }
      },
    }
  )
);

// 导出静态数据 (方便组件直接引用)
export { STATIC_CHAPTERS, STATIC_TEACHERS, STATIC_SIMS, STATIC_RESOURCES, STATIC_QUESTIONS };
