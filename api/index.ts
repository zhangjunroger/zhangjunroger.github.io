import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

import { config } from './lib/config.js';
import { logger } from './lib/logger.js';
import { db } from './lib/db.js';
import { errorHandler, notFound, ok, created, fail, wrap, AppError } from './lib/error.js';
import { requireAuth, requireRole, optionalAuth, hashPassword, verifyPassword, signToken } from './lib/auth.js';

import {
  CHAPTERS,
  KNOWLEDGE_POINTS,
  QUESTIONS,
  SIMULATIONS,
  RESOURCES,
  TEACHERS,
  SEED_USERS,
} from '../shared/seed.js';
import type {
  SafeUser,
  UserProgress,
  UserSubmission,
  SimRecord,
  ChatSession,
  ChatMessage,
  LeaderboardEntry,
  ClassSession,
  ClassSessionType,
  ClassEvent,
  ClassResults,
  RosterEntry,
} from '../shared/types.js';

import os from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set('trust proxy', true);
app.use(helmet({
  contentSecurityPolicy: config.isProd ? undefined : false,
  crossOriginOpenerPolicy: false,
}));
app.use(cors({
  origin: config.auth.allowedOrigins,
  credentials: true,
  maxAge: 86400,
}));
app.use(compression({ level: 6, threshold: 1024 }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

app.use((req, _res, next) => {
  const t0 = Date.now();
  _res.on('finish', () => {
    const dt = Date.now() - t0;
    logger.info(`${req.method} ${req.originalUrl} ${_res.statusCode} ${dt}ms`);
  });
  next();
});

// ========= 静态数据只读接口（无需认证） =========
app.get('/api/health', (_req, res) => {
  ok(res, {
    status: 'ok',
    env: config.nodeEnv,
    timestamp: Date.now(),
    uptime: process.uptime(),
    memory: process.memoryUsage().heapUsed,
  });
});

app.get('/api/course/chapters', wrap(async (_req, res) => {
  ok(res, CHAPTERS);
}));

app.get('/api/course/chapters/:id', wrap(async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  const ch = CHAPTERS.find(c => c.id === id);
  if (!ch) throw new AppError('章节不存在', 404);
  ok(res, ch);
}));

app.get('/api/course/knowledge-points', wrap(async (req, res) => {
  const chapterId = req.query.chapterId ? parseInt(String(req.query.chapterId), 10) : undefined;
  const list = chapterId ? KNOWLEDGE_POINTS.filter(k => k.chapterId === chapterId) : KNOWLEDGE_POINTS;
  ok(res, list);
}));

app.get('/api/course/knowledge-points/:id', wrap(async (req, res) => {
  const kp = KNOWLEDGE_POINTS.find(k => k.id === req.params.id);
  if (!kp) throw new AppError('知识点不存在', 404);
  ok(res, kp);
}));

app.get('/api/course/questions', wrap(async (req, res) => {
  const chapterId = req.query.chapterId ? parseInt(String(req.query.chapterId), 10) : undefined;
  const kpId = req.query.knowledgePointId ? String(req.query.knowledgePointId) : undefined;
  const source = req.query.source as string | undefined;
  let list = QUESTIONS;
  if (chapterId) list = list.filter(q => q.chapterId === chapterId);
  if (kpId) list = list.filter(q => q.knowledgePointId === kpId);
  if (source) list = list.filter(q => q.source === source);
  const page = parseInt(String(req.query.page || '1'), 10);
  const pageSize = Math.min(parseInt(String(req.query.pageSize || '50'), 10), 200);
  const total = list.length;
  const totalPages = Math.ceil(total / pageSize);
  const items = list.slice((page - 1) * pageSize, page * pageSize);
  ok(res, { items, page, pageSize, total, totalPages });
}));

app.get('/api/course/questions/:id', wrap(async (req, res) => {
  const q = QUESTIONS.find(x => x.id === req.params.id);
  if (!q) throw new AppError('题目不存在', 404);
  ok(res, q);
}));

app.get('/api/course/simulations', wrap(async (_req, res) => {
  ok(res, SIMULATIONS);
}));

app.get('/api/course/simulations/:id', wrap(async (req, res) => {
  const s = SIMULATIONS.find(x => x.id === req.params.id || x.slug === req.params.id);
  if (!s) throw new AppError('仿真实验不存在', 404);
  ok(res, s);
}));

app.get('/api/course/resources', wrap(async (req, res) => {
  const chapterId = req.query.chapterId ? parseInt(String(req.query.chapterId), 10) : undefined;
  const type = req.query.type as string | undefined;
  let list = RESOURCES;
  if (chapterId) list = list.filter(r => r.chapterId === chapterId);
  if (type) list = list.filter(r => r.type === type);
  ok(res, list);
}));

app.get('/api/course/teachers', wrap(async (_req, res) => {
  ok(res, TEACHERS);
}));

// ========= 认证接口 =========
const LoginSchema = z.object({
  username: z.string().min(1).max(64),
  password: z.string().min(1).max(128),
});

const RegisterSchema = z.object({
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email().max(128),
  password: z.string().min(6).max(128),
  realName: z.string().min(1).max(32),
  studentId: z.string().max(32).optional(),
  role: z.enum(['student', 'teacher']).default('student'),
});

app.post('/api/auth/login', wrap(async (req, res) => {
  const body = LoginSchema.parse(req.body);
  const user = db.find('users', u => u.username === body.username);
  if (!user) throw new AppError('用户不存在或密码错误', 401);
  if (!user.isActive) throw new AppError('用户已被停用', 403);
  if (!verifyPassword(body.password, user.passwordHash)) {
    throw new AppError('用户不存在或密码错误', 401);
  }
  db.update('users', u => u.id === user.id, u => ({ ...u, lastLoginAt: Date.now() }));
  const { passwordHash, ...safe } = user;
  const token = signToken({ sub: user.id, role: user.role });
  const seconds = parseInt(config.auth.jwtExpiresIn.replace(/\D/g, ''), 10) * 86400 || 604800;
  ok(res, { token, tokenType: 'Bearer' as const, expiresIn: seconds, user: safe }, '登录成功');
}));

app.post('/api/auth/register', wrap(async (req, res) => {
  const body = RegisterSchema.parse(req.body);
  if (db.find('users', u => u.username === body.username)) {
    throw new AppError('用户名已存在', 400);
  }
  if (db.find('users', u => u.email === body.email)) {
    throw new AppError('邮箱已被注册', 400);
  }
  const now = Date.now();
  const user = db.insert('users', {
    username: body.username,
    email: body.email,
    passwordHash: hashPassword(body.password),
    role: body.role,
    realName: body.realName,
    studentId: body.studentId,
    avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(body.username)}`,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
  db.insert('progress', {
    userId: user.id,
    totalHours: 0,
    totalScore: 0,
    streakDays: 0,
    lastActiveAt: now,
    completedLessons: [],
    completedExercises: [],
    completedExperiments: [],
    mastery: {},
    badges: [],
    dailyProgress: [],
    updatedAt: now,
  });
  const { passwordHash, ...safe } = user;
  const token = signToken({ sub: user.id, role: user.role });
  created(res, { token, tokenType: 'Bearer' as const, expiresIn: 604800, user: safe }, '注册成功');
}));

app.get('/api/auth/me', requireAuth, wrap(async (req, res) => {
  ok(res, req.currentUser);
}));

app.post('/api/auth/logout', requireAuth, wrap(async (_req, res) => {
  ok(res, null, '已退出登录');
}));

// ========= 用户进度接口 =========
app.get('/api/user/progress', requireAuth, wrap(async (req, res) => {
  let p = db.find('progress', x => x.userId === req.auth!.userId);
  if (!p) {
    p = db.insert('progress', {
      userId: req.auth!.userId,
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
    });
  }
  ok(res, p as UserProgress);
}));

app.post('/api/user/progress/lessons/:lessonId', requireAuth, wrap(async (req, res) => {
  const lessonId = req.params.lessonId;
  let changed = false;
  const p = db.upsert('progress', 'userId', {
    userId: req.auth!.userId,
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
  } as UserProgress);
  if (!p.completedLessons.includes(lessonId)) {
    p.completedLessons.push(lessonId);
    p.totalScore += 50;
    changed = true;
  }
  p.lastActiveAt = Date.now();
  if (changed) {
    db.update('progress', x => x.userId === req.auth!.userId, () => p);
  }
  ok(res, { completedLessons: p.completedLessons, totalScore: p.totalScore });
}));

// ========= 习题作答与自动批改 =========
const SubmitSchema = z.object({
  exerciseSetId: z.string().default('custom'),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
  durationUsed: z.number().int().nonnegative().default(0),
});

app.post('/api/user/submissions', requireAuth, wrap(async (req, res) => {
  const body = SubmitSchema.parse(req.body);
  const qids = Object.keys(body.answers);
  let correctCount = 0;
  const wrongQuestionIds: string[] = [];
  let totalScore = 0;
  let score = 0;
  for (const qid of qids) {
    const q = QUESTIONS.find(x => x.id === qid);
    if (!q) continue;
    totalScore += q.score;
    const userAns = body.answers[qid];
    let correct = false;
    if (Array.isArray(q.answer)) {
      if (Array.isArray(userAns)) {
        const s1 = [...q.answer].sort().join('|');
        const s2 = [...userAns].map(String).sort().join('|');
        correct = s1 === s2;
      }
    } else {
      correct = String(userAns).trim().toLowerCase() === String(q.answer).trim().toLowerCase();
    }
    if (correct) {
      correctCount++;
      score += q.score;
    } else {
      wrongQuestionIds.push(qid);
    }
  }
  const sub = db.insert('submissions', {
    userId: req.auth!.userId,
    exerciseSetId: body.exerciseSetId,
    answers: body.answers,
    score,
    totalScore,
    correctCount,
    totalCount: qids.length,
    wrongQuestionIds,
    submittedAt: Date.now(),
    durationUsed: body.durationUsed,
    attempt: 1,
  });
  db.update('progress', x => x.userId === req.auth!.userId, (p: UserProgress) => ({
    ...p,
    totalScore: p.totalScore + Math.round(score / Math.max(1, totalScore) * 30),
    completedExercises: [...new Set([...p.completedExercises, ...qids.filter(id => !wrongQuestionIds.includes(id))])],
    updatedAt: Date.now(),
  }));
  created(res, sub);
}));

app.get('/api/user/submissions', requireAuth, wrap(async (req, res) => {
  const list = db.filter('submissions', s => s.userId === req.auth!.userId)
    .sort((a: any, b: any) => b.submittedAt - a.submittedAt);
  ok(res, list);
}));

// ========= 仿真实验记录 =========
app.get('/api/user/sim-records', requireAuth, wrap(async (req, res) => {
  const simId = req.query.simulationId as string | undefined;
  let list = db.filter('simRecords', s => s.userId === req.auth!.userId);
  if (simId) list = list.filter(s => s.simulationId === simId);
  list.sort((a: any, b: any) => b.createdAt - a.createdAt);
  ok(res, list);
}));

app.post('/api/user/sim-records', requireAuth, wrap(async (req, res) => {
  const body = z.object({
    simulationId: z.string(),
    params: z.record(z.string(), z.number()),
    metrics: z.record(z.string(), z.union([z.number(), z.string()])),
    notes: z.string().max(500).optional(),
  }).parse(req.body);
  const rec = db.insert('simRecords', {
    userId: req.auth!.userId,
    ...body,
    createdAt: Date.now(),
    exported: false,
  });
  created(res, rec);
}));

// ========= 排行榜 =========
app.get('/api/leaderboard', optionalAuth, wrap(async (_req, res) => {
  const progresses: UserProgress[] = db.all('progress') as any;
  const users = db.all('users');
  const entries: LeaderboardEntry[] = progresses
    .map(p => {
      const u = users.find(x => x.id === p.userId);
      if (!u || !u.isActive) return null;
      const masteryVals: number[] = Object.values(p.mastery || {});
      const masteryAvg = masteryVals.length
        ? masteryVals.reduce((a, b) => a + (b as number), 0) / masteryVals.length
        : 0;
      return {
        userId: p.userId,
        rank: 0,
        username: u.username,
        realName: u.realName,
        avatar: u.avatar,
        totalScore: p.totalScore,
        totalHours: p.totalHours,
        streakDays: p.streakDays,
        completedLessons: p.completedLessons.length,
        masteryAvg: Math.round(masteryAvg),
      };
    })
    .filter((x): x is LeaderboardEntry => x !== null)
    .sort((a, b) => b.totalScore - a.totalScore || b.completedLessons - a.completedLessons)
    .slice(0, 50)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  const demoEntries = SEED_USERS
    .filter(u => u.role === 'student')
    .slice(0, Math.max(0, 10 - entries.length))
    .map((u, i) => ({
      userId: u.id,
      rank: entries.length + i + 1,
      username: u.username,
      realName: u.realName,
      avatar: u.avatar,
      totalScore: u._demo?.score || 5000 - i * 300,
      totalHours: u._demo?.hours || 200 - i * 12,
      streakDays: u._demo?.streak || 60 - i * 4,
      completedLessons: u._demo?.lessons || 40 - i * 2,
      masteryAvg: u._demo?.mastery || 88 - i * 3,
    }));

  ok(res, [...entries, ...demoEntries].slice(0, 30));
}));

// ========= AI 助教（本地规则引擎 + 知识库） =========
import { aiTutorReply } from '../shared/seed.js';

app.get('/api/ai/sessions', requireAuth, wrap(async (req, res) => {
  const list = db.filter('chatSessions', s => s.userId === req.auth!.userId)
    .sort((a: any, b: any) => b.updatedAt - a.updatedAt);
  ok(res, list);
}));

app.post('/api/ai/sessions', requireAuth, wrap(async (req, res) => {
  const body = z.object({ title: z.string().max(100).default('新对话'), tags: z.array(z.string()).default([]) }).parse(req.body);
  const now = Date.now();
  const s = db.insert('chatSessions', {
    userId: req.auth!.userId,
    title: body.title,
    createdAt: now,
    updatedAt: now,
    messageCount: 0,
    tags: body.tags,
  });
  created(res, s);
}));

app.get('/api/ai/sessions/:sessionId/messages', requireAuth, wrap(async (req, res) => {
  const sessionId = req.params.sessionId;
  const sess = db.find('chatSessions', s => s.id === sessionId);
  if (!sess || sess.userId !== req.auth!.userId) throw new AppError('会话不存在', 404);
  const list = db.filter('chatMessages', m => m.sessionId === sessionId)
    .sort((a: any, b: any) => a.timestamp - b.timestamp);
  ok(res, list);
}));

app.post('/api/ai/sessions/:sessionId/messages', requireAuth, wrap(async (req, res) => {
  const sessionId = req.params.sessionId;
  const sess = db.find('chatSessions', s => s.id === sessionId);
  if (!sess || sess.userId !== req.auth!.userId) throw new AppError('会话不存在', 404);
  const body = z.object({ content: z.string().min(1).max(2000) }).parse(req.body);

  const now = Date.now();
  db.insert('chatMessages', {
    userId: req.auth!.userId,
    sessionId,
    role: 'user',
    content: body.content,
    timestamp: now,
  });

  const reply = aiTutorReply(body.content);
  const aiMsg = db.insert('chatMessages', {
    userId: req.auth!.userId,
    sessionId,
    role: 'assistant',
    content: reply.content,
    formattedContent: reply.formattedContent,
    timestamp: Date.now(),
    relatedKPs: reply.relatedKPs,
    suggestedQuestions: reply.suggestedQuestions,
  });

  db.update('chatSessions', s => s.id === sessionId, (s: ChatSession) => ({
    ...s,
    updatedAt: Date.now(),
    messageCount: s.messageCount + 2,
    title: s.messageCount === 0 ? body.content.slice(0, 30) : s.title,
  }));

  ok(res, aiMsg);
}));

// ========= 管理员：用户管理 =========
app.get('/api/admin/users', requireAuth, requireRole('admin', 'teacher'), wrap(async (_req, res) => {
  const users = db.all('users').map((u: any) => {
    const { passwordHash, ...safe } = u;
    return safe;
  });
  ok(res, users);
}));

// ========= 服务器信息（供二维码生成局域网地址） =========
app.get('/api/server-info', wrap(async (_req, res) => {
  const ifaces = os.networkInterfaces();
  const lanIps: string[] = [];
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) lanIps.push(iface.address);
    }
  }
  ok(res, {
    lanIps,
    port: config.server.port,
    nodeEnv: config.nodeEnv,
  });
}));

// ========= 智慧课堂：签到 / 答题 / 投票 / 弹幕 / 评价 =========
const genJoinCode = (): string => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 去除易混淆字符
  let c = '';
  for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
  return c;
};

const parseRoster = (raw: string): RosterEntry[] => {
  const list: RosterEntry[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const s = line.trim();
    if (!s) continue;
    const parts = s.split(/[,，\t ]+/);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      list.push({ name: parts[0], studentId: parts[1], className: parts[2] });
    } else if (parts.length === 1 && parts[0]) {
      list.push({ name: parts[0], studentId: '' });
    }
  }
  return list;
};

const wordFreqOf = (texts: string[]): { word: string; count: number }[] => {
  // 中文按 2 字词滑窗 + 英文按单词，统计词频（轻量分词，足够课堂词云使用）
  const freq = new Map<string, number>();
  const bump = (w: string) => {
    w = w.trim();
    if (w.length < 1) return;
    if (/^[\d\W_]+$/.test(w) && w.length < 2) return;
    freq.set(w, (freq.get(w) || 0) + 1);
  };
  for (const raw of texts) {
    const t = (raw || '').trim();
    if (!t) continue;
    if (/^[\u4e00-\u9fa5]+$/.test(t)) {
      if (t.length <= 6) { bump(t); continue; }
      for (let i = 0; i + 2 <= t.length; i++) bump(t.slice(i, i + 2));
    } else {
      t.split(/[\s,，.。!！?？;；、]+/).forEach(bump);
    }
  }
  return [...freq.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 80);
};

const computeResults = (session: ClassSession): ClassResults => {
  const events = db.filter('classEvents', (e: ClassEvent) => e.sessionId === session.id)
    .sort((a: ClassEvent, b: ClassEvent) => a.at - b.at);
  const summary = {
    checkinCount: 0,
    absentList: [] as RosterEntry[],
    unregistered: 0,
    optionCounts: {} as Record<string, number>,
    correctCount: 0,
    answeredCount: 0,
    correctRate: 0,
    avgRating: 0,
    voteCounts: [] as number[],
    wordFreq: [] as { word: string; count: number }[],
  };

  if (session.type === 'attendance') {
    const seen = new Set<string>();
    for (const e of events) {
      if (e.type !== 'checkin') continue;
      summary.checkinCount++;
      if (e.studentId && session.roster.some(r => r.studentId && r.studentId === e.studentId)) {
        seen.add(e.studentId);
      } else if (!e.studentId && session.roster.some(r => r.name === e.name)) {
        seen.add(e.name);
      } else {
        summary.unregistered++;
      }
    }
    summary.absentList = session.roster.filter(
      r => !seen.has(r.studentId) && !seen.has(r.name)
    );
  } else if (session.type === 'quiz') {
    const q = session.config.question;
    if (q) {
      for (const key of q.options.map(o => o.key)) summary.optionCounts[key] = 0;
      const answers = events.filter(e => e.type === 'answer');
      summary.answeredCount = answers.length;
      for (const e of answers) {
        if (q.options.some(o => o.key === e.payload)) {
          summary.optionCounts[e.payload] = (summary.optionCounts[e.payload] || 0) + 1;
        }
        if (q.answer != null && q.type !== 'short') {
          const ans = q.answer;
          const isCorrect = Array.isArray(ans)
            ? [...String(e.payload)].sort().join('|') === [...ans.map(String)].sort().join('|')
            : String(e.payload).trim().toLowerCase() === String(ans).trim().toLowerCase();
          if (isCorrect) summary.correctCount++;
        }
      }
      summary.correctRate = summary.answeredCount
        ? Math.round((summary.correctCount / summary.answeredCount) * 100) : 0;
      if (q.type === 'short') {
        summary.wordFreq = wordFreqOf(answers.map(e => e.payload));
      }
    }
  } else if (session.type === 'poll') {
    const opts = session.config.options || [];
    summary.voteCounts = opts.map(() => 0);
    for (const e of events) {
      if (e.type !== 'vote') continue;
      const idx = parseInt(e.payload, 10);
      if (idx >= 0 && idx < summary.voteCounts.length) summary.voteCounts[idx]++;
    }
  } else if (session.type === 'rating') {
    const ratings = events.filter(e => e.type === 'rating').map(e => parseFloat(e.payload)).filter(v => !isNaN(v));
    summary.avgRating = ratings.length
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 100) / 100 : 0;
  } else if (session.type === 'danmaku') {
    summary.wordFreq = wordFreqOf(events.filter(e => e.type === 'danmaku').map(e => e.payload));
  }
  return { session, events, summary };
};

const CreateSessionSchema = z.object({
  type: z.enum(['attendance', 'quiz', 'poll', 'danmaku', 'rating']),
  title: z.string().min(1).max(80),
  courseName: z.string().max(80).optional(),
  teacherName: z.string().max(40).optional(),
  className: z.string().max(80).optional(),
  durationMin: z.number().int().min(0).max(720).default(0),
  rosterRaw: z.string().max(20000).optional(),
  question: z.object({
    content: z.string().min(1).max(1000),
    type: z.enum(['choice', 'multiple', 'truefalse', 'short']),
    options: z.array(z.object({ key: z.string().max(4), content: z.string().max(200) })).max(8).default([]),
    answer: z.union([z.string(), z.array(z.string())]).nullable().optional(),
    analysis: z.string().max(2000).optional(),
    durationSec: z.number().int().min(0).max(3600).default(0),
  }).optional(),
  options: z.array(z.string().max(100)).max(8).optional(),
  ratingLabels: z.array(z.string().max(20)).max(8).optional(),
});

app.get('/api/classroom/sessions', requireAuth, wrap(async (_req, res) => {
  const list = db.filter('classSessions', (s: ClassSession) => true)
    .sort((a: ClassSession, b: ClassSession) => b.createdAt - a.createdAt)
    .slice(0, 100);
  ok(res, list);
}));

app.post('/api/classroom/sessions', requireAuth, wrap(async (req, res) => {
  const body = CreateSessionSchema.parse(req.body);
  const now = Date.now();
  const session = db.insert('classSessions', {
    code: genJoinCode(),
    type: body.type as ClassSessionType,
    title: body.title,
    courseName: body.courseName,
    teacherName: body.teacherName || req.currentUser?.realName,
    className: body.className,
    createdAt: now,
    expiresAt: body.durationMin > 0 ? now + body.durationMin * 60_000 : undefined,
    closed: false,
    roster: parseRoster(body.rosterRaw || ''),
    config: {
      question: body.question,
      options: body.options,
      ratingLabels: body.ratingLabels,
    },
  } as ClassSession);
  created(res, session);
}));

app.get('/api/classroom/sessions/:id', requireAuth, wrap(async (req, res) => {
  const s = db.find('classSessions', (x: ClassSession) => x.id === req.params.id);
  if (!s) throw new AppError('课堂会话不存在', 404);
  ok(res, computeResults(s));
}));

app.post('/api/classroom/sessions/:id/close', requireAuth, wrap(async (req, res) => {
  const n = db.update('classSessions', (x: ClassSession) => x.id === req.params.id,
    (s: ClassSession) => ({ ...s, closed: true }));
  if (!n) throw new AppError('课堂会话不存在', 404);
  ok(res, null, '已结束本次课堂互动');
}));

app.delete('/api/classroom/sessions/:id', requireAuth, wrap(async (req, res) => {
  const n = db.remove('classSessions', (x: ClassSession) => x.id === req.params.id);
  db.remove('classEvents', (e: ClassEvent) => e.sessionId === req.params.id);
  if (!n) throw new AppError('课堂会话不存在', 404);
  ok(res, null, '已删除');
}));

// 学生端（免登录，扫码进入）
app.get('/api/classroom/join/:code', wrap(async (req, res) => {
  const code = String(req.params.code).trim().toUpperCase();
  const s = db.find('classSessions', (x: ClassSession) => x.code === code);
  if (!s) throw new AppError('加入码无效或活动已过期', 404);
  if (s.closed) throw new AppError('该互动已结束', 410);
  if (s.expiresAt && s.expiresAt < Date.now()) throw new AppError('该互动已超时结束', 410);
  // 返回学生端需要的公开信息（隐藏答案）
  const pub = { ...s };
  if (pub.config?.question) {
    pub.config = { ...pub.config, question: { ...pub.config.question, answer: null, analysis: undefined } };
  }
  ok(res, pub);
}));

const JoinEventSchema = z.object({
  type: z.enum(['checkin', 'answer', 'vote', 'danmaku', 'rating']),
  name: z.string().min(1).max(32),
  studentId: z.string().max(32).optional(),
  className: z.string().max(40).optional(),
  payload: z.string().max(500),
});

app.post('/api/classroom/join/:code/events', wrap(async (req, res) => {
  const code = String(req.params.code).trim().toUpperCase();
  const s = db.find('classSessions', (x: ClassSession) => x.code === code);
  if (!s) throw new AppError('加入码无效或活动已过期', 404);
  if (s.closed) throw new AppError('该互动已结束', 410);
  if (s.expiresAt && s.expiresAt < Date.now()) throw new AppError('该互动已超时结束', 410);
  const body = JoinEventSchema.parse(req.body);
  // 会话类型 → 期望的事件类型映射
  const expectedEvent: Record<ClassSessionType, string> = {
    attendance: 'checkin', quiz: 'answer', poll: 'vote', danmaku: 'danmaku', rating: 'rating',
  };
  if (body.type !== expectedEvent[s.type as ClassSessionType]) throw new AppError('互动类型不匹配', 400);

  // 签到防重复
  if (body.type === 'checkin' && body.studentId) {
    const dup = db.find('classEvents',
      (e: ClassEvent) => e.sessionId === s.id && e.type === 'checkin' && e.studentId === body.studentId);
    if (dup) throw new AppError('该学号已签到，请勿重复提交', 409);
  }

  const ev = db.insert('classEvents', {
    sessionId: s.id,
    type: body.type,
    name: body.name,
    studentId: body.studentId,
    className: body.className,
    payload: body.payload,
    at: Date.now(),
  } as ClassEvent);

  let correct: boolean | undefined = undefined;
  let correctAnswer: string | string[] | null | undefined = undefined;
  if (body.type === 'answer' && s.config?.question) {
    const q = s.config.question;
    correctAnswer = q.answer;
    if (q.answer != null && q.type !== 'short') {
      const ans = q.answer;
      correct = Array.isArray(ans)
        ? [...body.payload].sort().join('|') === [...ans.map(String)].sort().join('|')
        : body.payload.trim().toLowerCase() === String(ans).trim().toLowerCase();
    }
  }
  created(res, { eventId: ev.id, correct, correctAnswer });
}));

// ========= 生产环境：托管前端静态资源 =========
if (config.isProd) {
  if (fs.existsSync(config.app.clientDist)) {
    logger.info(`Serving static assets from ${config.app.clientDist}`);
    app.use(express.static(config.app.clientDist, {
      setHeaders: (res, fpath) => {
        if (fpath.endsWith('index.html') || fpath.endsWith('.html')) {
          // SPA 入口不缓存，确保发版后立即生效
          res.setHeader('Cache-Control', 'no-cache');
        } else if (/\.(js|css|svg|png|jpg|woff2?)$/i.test(fpath)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }));
    app.get(/^\/(?!api\/).*/, (_req, res) => {
      res.sendFile(path.join(config.app.clientDist, 'index.html'));
    });
  } else {
    logger.warn('Production mode but client dist not found. Run: npm run build');
  }
}

app.use(notFound);
app.use(errorHandler);

const PORT = config.server.port;
const HOST = config.server.host;
app.listen(PORT, HOST, () => {
  const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
  logger.info(`🚀 Server running on http://${displayHost}:${PORT} [${config.nodeEnv}]`);
  if (HOST === '0.0.0.0') logger.info(`📡 Also accessible on LAN: http://<your-ip>:${PORT}`);
  logger.info(`📚 Course data: ${CHAPTERS.length} chapters, ${KNOWLEDGE_POINTS.length} KPs, ${QUESTIONS.length} questions, ${SIMULATIONS.length} sims`);
  db.meta('bootAt', Date.now());
});

export default app;
