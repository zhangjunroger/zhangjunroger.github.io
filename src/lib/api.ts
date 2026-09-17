// 前端统一 API 客户端 (fetch 封装)
// 同时支持:本地 localStorage mock 模式 (无后端时) 和 真实后端模式
import type {
  ApiResponse, SafeUser, AuthResponse, UserProgress, UserSubmission,
  SimRecord, ChatSession, ChatMessage, LeaderboardEntry,
} from '@shared/types.js';
import type { TeacherItem } from '@shared/seed.js';

const API_BASE = (import.meta.env.VITE_API_BASE as string) || '/api';
const MOCK_KEY = 'zdkzy.mock.storage.v1';
const AUTH_KEY = 'zdkzy.auth.v1';
const PROGRESS_KEY = 'zdkzy.progress.v1';

export interface AuthState {
  token: string;
  user: SafeUser;
  expiresAt: number;
}

function saveAuth(s: AuthState) {
  try { localStorage.setItem(AUTH_KEY, JSON.stringify(s)); } catch {/* noop */}
}
export function loadAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as AuthState;
    if (s.expiresAt && s.expiresAt < Date.now()) {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
    return s;
  } catch { return null; }
}
export function clearAuth() {
  try { localStorage.removeItem(AUTH_KEY); } catch {/* noop */}
}

function headers(token?: string): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  const t = token || loadAuth()?.token;
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: unknown,
  opts: { timeout?: number; auth?: boolean } = {}
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeout || 15000);
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  try {
    const res = await fetch(url, {
      method,
      headers: headers(opts.auth !== false ? undefined : ''),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      credentials: 'include',
    });
    clearTimeout(timer);
    const text = await res.text();
    let data: ApiResponse<T> | null = null;
    try { data = text ? JSON.parse(text) as ApiResponse<T> : null; }
    catch { throw new Error(`服务器返回非JSON: ${res.status} ${text.slice(0, 120)}`); }
    if (!data) throw new Error('空响应');
    if (!data.success) throw new Error(data.message || `请求失败 ${data.code}`);
    return data.data as T;
  } catch (e: any) {
    clearTimeout(timer);
    if (e?.name === 'AbortError') throw new Error('请求超时');
    throw e;
  }
}

// ============= 认证 =============
export const authApi = {
  login(username: string, password: string) {
    return request<AuthResponse>('POST', '/auth/login', { username, password }, { auth: false })
      .then(r => {
        saveAuth({ token: r.token, user: r.user, expiresAt: Date.now() + r.expiresIn * 1000 - 60_000 });
        return r;
      });
  },
  register(payload: { username: string; email?: string; password: string; realName?: string; studentId?: string; role?: 'student' | 'teacher' }) {
    return request<AuthResponse>('POST', '/auth/register', payload, { auth: false })
      .then(r => {
        saveAuth({ token: r.token, user: r.user, expiresAt: Date.now() + r.expiresIn * 1000 - 60_000 });
        return r;
      });
  },
  me() {
    return request<SafeUser>('GET', '/auth/me', undefined);
  },
  logout() {
    return request<null>('POST', '/auth/logout').finally(() => clearAuth());
  },
};

// ============= 课程静态数据 =============
export const courseApi = {
  chapters: () => request<any[]>('GET', '/course/chapters', undefined, { auth: false }),
  chapter: (id: number) => request<any>('GET', `/course/chapters/${id}`, undefined, { auth: false }),
  knowledgePoints: (chapterId?: number) =>
    request<any[]>('GET', `/course/knowledge-points${chapterId ? `?chapterId=${chapterId}` : ''}`, undefined, { auth: false }),
  questions: (params?: { chapterId?: number; kpId?: number; page?: number; pageSize?: number }) => {
    const q = new URLSearchParams();
    if (params?.chapterId) q.set('chapterId', String(params.chapterId));
    if (params?.kpId) q.set('knowledgePointId', String(params.kpId));
    if (params?.page) q.set('page', String(params.page));
    if (params?.pageSize) q.set('pageSize', String(params.pageSize));
    const s = q.toString();
    return request<any>('GET', `/course/questions${s ? '?' + s : ''}`, undefined, { auth: false });
  },
  simulations: () => request<any[]>('GET', '/course/simulations', undefined, { auth: false }),
  simulation: (id: string) => request<any>('GET', `/course/simulations/${id}`, undefined, { auth: false }),
  resources: (params?: { chapterId?: number; type?: string }) => {
    const q = new URLSearchParams();
    if (params?.chapterId) q.set('chapterId', String(params.chapterId));
    if (params?.type) q.set('type', params.type);
    const s = q.toString();
    return request<any[]>('GET', `/course/resources${s ? '?' + s : ''}`, undefined, { auth: false });
  },
  teachers: () => request<TeacherItem[]>('GET', '/course/teachers', undefined, { auth: false }),
};

// ============= 用户进度 =============
export const progressApi = {
  get: () => request<UserProgress>('GET', '/user/progress'),
  markLesson: (lessonId: string) =>
    request<{ completedLessons: string[]; totalScore: number }>('POST', `/user/progress/lessons/${lessonId}`),
};

// ============= 习题作答 =============
export const submissionApi = {
  submit: (payload: { exerciseSetId?: string; answers: Record<string, string | string[]>; durationUsed?: number }) =>
    request<UserSubmission>('POST', '/user/submissions', payload),
  list: () => request<UserSubmission[]>('GET', '/user/submissions'),
};

// ============= 仿真记录 =============
export const simApi = {
  list: (simulationId?: string) =>
    request<SimRecord[]>('GET', `/user/sim-records${simulationId ? `?simulationId=${simulationId}` : ''}`),
  create: (payload: { simulationId: string; params: Record<string, number>; metrics: Record<string, number | string>; notes?: string }) =>
    request<SimRecord>('POST', '/user/sim-records', payload),
};

// ============= AI 助教 =============
export const aiApi = {
  sessions: () => request<ChatSession[]>('GET', '/ai/sessions'),
  createSession: (title?: string, tags?: string[]) =>
    request<ChatSession>('POST', '/ai/sessions', { title, tags }),
  messages: (sessionId: string) =>
    request<ChatMessage[]>('GET', `/ai/sessions/${sessionId}/messages`),
  sendMessage: (sessionId: string, content: string) =>
    request<ChatMessage>('POST', `/ai/sessions/${sessionId}/messages`, { content }),
};

// ============= 排行榜 =============
export const leaderboardApi = {
  list: () => request<LeaderboardEntry[]>('GET', '/leaderboard', undefined, { auth: false }),
};

// ============= 智慧课堂 =============
import type {
  ClassSession, ClassSessionType, ClassResults, ServerInfo, QuizQuestionDef,
} from '@shared/types.js';

export interface CreateSessionPayload {
  type: ClassSessionType;
  title: string;
  courseName?: string;
  teacherName?: string;
  className?: string;
  durationMin?: number;
  rosterRaw?: string;
  question?: QuizQuestionDef;
  options?: string[];
  ratingLabels?: string[];
}

export const classroomApi = {
  serverInfo: () => request<ServerInfo>('GET', '/server-info', undefined, { auth: false }),
  createSession: (payload: CreateSessionPayload) =>
    request<ClassSession>('POST', '/classroom/sessions', payload),
  listSessions: () => request<ClassSession[]>('GET', '/classroom/sessions'),
  results: (id: string) => request<ClassResults>('GET', `/classroom/sessions/${id}`),
  closeSession: (id: string) => request<null>('POST', `/classroom/sessions/${id}/close`),
  deleteSession: (id: string) => request<null>('DELETE', `/classroom/sessions/${id}`),
  joinInfo: (code: string) =>
    request<ClassSession>('GET', `/classroom/join/${encodeURIComponent(code)}`, undefined, { auth: false }),
  joinEvent: (code: string, payload: { type: string; name: string; studentId?: string; className?: string; payload: string }) =>
    request<{ eventId: string; correct?: boolean; correctAnswer?: string | string[] | null }>(
      'POST', `/classroom/join/${encodeURIComponent(code)}/events`, payload, { auth: false }),
};

export const serverInfoApi = {
  get: () => request<ServerInfo>('GET', '/server-info', undefined, { auth: false }),
};

// ============= 健康检查 =============
export const healthApi = {
  check: () => request<{ status: string; timestamp: number; uptime: number }>('GET', '/health', undefined, { auth: false }),
};

// ============= 本地 mock (无后端时用 seed 内置静态数据) =============
export { useMockData };

import {
  CHAPTERS, KNOWLEDGE_POINTS, QUESTIONS, SIMULATIONS, RESOURCES, TEACHERS,
  SEED_USERS, aiTutorReply,
} from '@shared/seed.js';
import { nanoid } from 'nanoid';

function useMockData(): { enable: () => void } {
  return {
    enable() {
      // 将静态数据挂在全局,后续 store 可以直接用
      (window as any).__ZDKZYL_MOCK__ = {
        CHAPTERS, KNOWLEDGE_POINTS, QUESTIONS, SIMULATIONS, RESOURCES, TEACHERS, SEED_USERS, aiTutorReply,
      };
    },
  };
}
