import 'dotenv/config';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { db } from '../lib/db.js';
import { config } from '../lib/config.js';
import { hashPassword } from '../lib/auth.js';
import { logger } from '../lib/logger.js';

import { SEED_USERS, CHAPTERS, KNOWLEDGE_POINTS, QUESTIONS, SIMULATIONS, RESOURCES } from '../../shared/seed.js';
import type { UserProgress } from '../../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function printBanner(title: string) {
  const line = '═'.repeat(60);
  logger.info('');
  logger.info(line);
  logger.info(`  🚀 ${title}`);
  logger.info(line);
}

function bar(n: number, max: number, w = 24) {
  const p = Math.max(0, Math.min(1, n / max));
  const filled = Math.round(p * w);
  return '█'.repeat(filled) + '░'.repeat(w - filled);
}

async function main() {
  const args = process.argv.slice(2);
  const shouldReset = args.includes('--reset') || args.includes('-f');

  printBanner('《自动控制原理》AI智慧课程 数据库初始化脚本');

  logger.info(`数据目录: ${config.storage.dataDir}`);
  logger.info(`环境: ${config.nodeEnv}`);
  logger.info(`存储后端: ${config.storage.backend} (SQLite)`);

  // 确保数据目录
  if (!fs.existsSync(config.storage.dataDir)) {
    fs.mkdirSync(config.storage.dataDir, { recursive: true });
  }

  const existingUsers = db.all('users').length;
  if (existingUsers > 0 && !shouldReset) {
    logger.warn(`检测到已有 ${existingUsers} 个用户数据。`);
    logger.warn('使用 --reset 或 -f 参数强制重建数据库（会清空所有用户、进度、提交记录）。');
    logger.info('保持现有数据不变，仅补充静态课程数据索引信息。');
  } else if (shouldReset) {
    logger.warn('⚠️  强制重建数据库模式，清空所有用户/进度/提交/仿真记录！');
    db.reset();
  } else {
    db.reset();
  }

  // =========================================
  // 1. 写入课程静态元信息（便于前端展示统计）
  // =========================================
  logger.info('① 写入课程静态元信息...');
  db.setMeta('course', {
    title: '自动控制原理',
    edition: '胡寿松第七版',
    chapters: CHAPTERS.length,
    knowledgePoints: KNOWLEDGE_POINTS.length,
    questions: QUESTIONS.length,
    simulations: SIMULATIONS.length,
    resources: RESOURCES.length,
    totalLessons: CHAPTERS.reduce((a, c) => a + c.lessons.length, 0),
    totalKaoyanQuestions: QUESTIONS.filter(q => q.source === 'kaoyan').length,
    teachersCount: 6,
    seedAt: Date.now(),
    version: '1.0.0',
  });

  // =========================================
  // 2. 写入测试用户 (如果不存在)
  // =========================================
  logger.info(`② 写入 ${SEED_USERS.length} 个种子用户账号...`);
  let createdUser = 0;
  for (const su of SEED_USERS) {
    const exist = db.find('users', u => u.username === su.username || u.email === su.email);
    if (exist) {
      logger.debug(`  跳过已存在用户: ${su.username}`);
      continue;
    }
    const { password, _demo, ...userFields } = su;
    const user = db.insert('users', {
      ...userFields,
      passwordHash: hashPassword(password),
      isActive: true,
      updatedAt: Date.now(),
    });

    // 同步写入进度（有演示数据的话注入演示数据）
    const demoProgress: UserProgress = _demo ? {
      userId: user.id,
      totalHours: _demo.hours,
      totalScore: _demo.score,
      streakDays: _demo.streak,
      lastActiveAt: Date.now() - 3600_000,
      completedLessons: Array.from({ length: Math.min(68, _demo.lessons) }, (_, i) => `lesson-${(i % 8) + 1}-${(i % 10) + 1}`),
      completedExercises: QUESTIONS.slice(0, 50).map(q => q.id),
      completedExperiments: SIMULATIONS.map(s => s.id),
      mastery: Object.fromEntries(
        KNOWLEDGE_POINTS.slice(0, 80).map(k => [k.id, Math.round(40 + Math.random() * _demo.mastery * 0.6)])
      ),
      badges: ['first-login', 'first-lesson', 'kaoyan-warrior', 'sim-explorer', 'pid-master'].slice(0, Math.min(5, Math.floor(_demo.mastery / 20))),
      dailyProgress: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 86400_000).toISOString().slice(0, 10),
        minutes: Math.round(60 + Math.random() * 180),
        score: Math.round(20 + Math.random() * 200),
      })),
      updatedAt: Date.now(),
    } : {
      userId: user.id,
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
    db.insert('progress', demoProgress);
    createdUser++;
  }
  logger.info(`  ✔  新建用户 ${createdUser} 个 (已跳过已存在)`);

  // 确保所有用户都有一条进度记录
  for (const u of db.all('users')) {
    if (!db.find('progress', (p: any) => p.userId === u.id)) {
      db.insert('progress', {
        userId: u.id, totalHours: 0, totalScore: 0, streakDays: 0,
        lastActiveAt: Date.now(), completedLessons: [], completedExercises: [],
        completedExperiments: [], mastery: {}, badges: [], dailyProgress: [], updatedAt: Date.now(),
      });
    }
  }

  db.forceFlush();

  // =========================================
  // 3. 统计信息输出
  // =========================================
  const meta: any = db.meta('course') || {};
  printBanner('初始化完成 统计一览');
  const items = [
    ['课程章数', meta.chapters, 8],
    ['知识点总数', meta.knowledgePoints, 108],
    ['总课时数', meta.totalLessons, 72],
    ['题库总量', meta.questions, 100],
    ['   ├ 考研真题', meta.totalKaoyanQuestions, 30],
    ['仿真实验数', meta.simulations, 3],
    ['学习资源', meta.resources, 16],
    ['种子用户', createdUser, SEED_USERS.length],
    ['   ├ 管理员', db.filter('users', (u: any) => u.role === 'admin').length, 1],
    ['   ├ 教师', db.filter('users', (u: any) => u.role === 'teacher').length, 2],
    ['   └ 学生', db.filter('users', (u: any) => u.role === 'student').length, SEED_USERS.length - 3],
  ];
  const maxLabel = Math.max(...items.map(i => String(i[0]).length));
  for (const [label, act, total] of items as any) {
    const pad = ' '.repeat(maxLabel - String(label).length);
    logger.info(`  ${label}${pad} : ${String(act).padStart(5)}  ${bar(act as number, total as number)}  ${total}`);
  }

  printBanner('测试账号清单');
  for (const su of SEED_USERS) {
    const rolePad = su.role.padEnd(7);
    logger.info(`  【${rolePad}】 ${su.username.padEnd(14)} / ${su.password.padEnd(12)}  (${su.realName})`);
  }
  logger.info('');
  logger.info('💡 生产部署请务必修改默认密码,或仅创建学生+教师账号。');
  logger.info('💡 启动全栈开发:  npm run dev:fullstack   (前后端并发启动)');
  logger.info('💡 单独启动后端:  npm run dev:server     (端口 4000)');
  logger.info('💡 启动生产部署:  npm run start          (需先 npm run deploy:prepare)');
  logger.info('');

  process.exit(0);
}

main().catch(e => {
  logger.error('种子脚本执行失败', { message: (e as Error).message, stack: (e as Error).stack });
  process.exit(1);
});
