// 前后端共享类型定义 - 生产环境数据模型

export type Role = 'student' | 'teacher' | 'admin';
export type LessonType = 'video' | 'ppt' | 'experiment' | 'exercise';
export type ResourceType = 'pdf' | 'video' | 'ppt' | 'reference';
export type SimType = 'first-order' | 'second-order' | 'pole-zero' | 'bode' | 'nyquist' | 'root-locus' | 'pid' | 'steady-error' | 'nonlinear' | 'sampling';

export interface ApiResponse<T = unknown> {
  success: boolean;
  code: number;
  message: string;
  data?: T;
  timestamp: number;
  trace?: string;
  details?: ValidationError[];
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// --- 用户模型 ---
export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash?: string;           // 仅后端存储,不返回前端
  role: Role;
  realName: string;
  studentId?: string;              // 学号
  avatar: string;
  college?: string;                // 学院
  major?: string;                  // 专业
  className?: string;              // 班级
  createdAt: number;
  updatedAt: number;
  lastLoginAt?: number;
  isActive: boolean;
}

export interface SafeUser extends Omit<User, 'passwordHash'> {}

export interface UserProgress {
  userId: string;
  totalHours: number;              // 累计学习时长 (分钟)
  totalScore: number;              // 总积分
  streakDays: number;              // 连续打卡
  lastActiveAt: number;
  completedLessons: string[];      // 完成的课时ID
  completedExercises: string[];    // 完成的习题ID
  completedExperiments: string[];  // 完成的实验ID
  mastery: Record<string, number>; // 知识点掌握度 0-100
  badges: string[];                // 获得的徽章
  dailyProgress: Array<{ date: string; minutes: number; score: number }>;
  updatedAt: number;
}

// --- 课程数据模型 ---
export interface KnowledgePoint {
  id: string;
  chapterId: number;
  code: string;                    // e.g. "2.3.1"
  name: string;
  description: string;
  importance: 1 | 2 | 3;          // 1-了解 2-理解 3-掌握/重点/考研
  difficulty: 1 | 2 | 3 | 4 | 5;  // 难度
  prerequisites: string[];         // 前置知识点ID
  kaoyan: boolean;                 // 是否考研常考
  questionCount: number;           // 相关题目数
}

export interface Lesson {
  id: string;
  chapterId: number;
  index: number;
  title: string;
  type: LessonType;
  durationMinutes: number;         // 预计时长
  description: string;
  objectives: string[];            // 学习目标
  resourceUrl?: string;
  videoLength?: number;            // 秒
  knowledgePoints: string[];       // 覆盖知识点
  exerciseIds?: string[];
  experimentId?: string;
}

export interface Chapter {
  id: number;
  title: string;
  subtitle?: string;
  description: string;
  overview: string;                // 章节概述
  durationLabel: string;
  tags: string[];
  textbookSections: string[];      // 对应教材章节
  learningObjectives: string[];    // 学习目标
  keyPoints: string[];             // 重点
  difficultPoints: string[];       // 难点
  kaoyanWeight: number;            // 考研权重 0-100
  lessons: Lesson[];
}

// --- 习题与测验 ---
export type QuestionType = 'single' | 'multiple' | 'truefalse' | 'fill' | 'short' | 'calc';

export interface QuestionOption {
  key: string;                     // A/B/C/D
  content: string;
}

export interface Question {
  id: string;
  chapterId: number;
  knowledgePointId: string;
  type: QuestionType;
  difficulty: 1 | 2 | 3 | 4 | 5;
  content: string;                 // 题干,支持LaTeX
  options?: QuestionOption[];
  answer: string | string[];       // 标准答案
  analysis: string;                // 解析
  score: number;                   // 默认分值
  source: 'textbook' | 'kaoyan' | 'midterm' | 'final' | 'created';
  kaoyanYears?: number[];          // 考过的考研年份
  tags: string[];
}

export interface QuestionAnswerType {
  answer: string | string[];
}

// Question中的answer允许为 string | string[]
// （类型已在上方定义完成,保持兼容即可）

export interface ExerciseSet {
  id: string;
  name: string;
  chapterId?: number;
  type: 'inclass' | 'homework' | 'quiz' | 'midterm' | 'final' | 'kaoyan';
  questionIds: string[];
  duration: number;                // 分钟
  totalScore: number;
  passScore: number;
  startAt?: number;                // 开始时间(限时测验)
  endAt?: number;
  allowRetake: boolean;
  maxAttempts: number;             // 最大尝试次数
}

export interface UserSubmission {
  id?: string;
  userId: string;
  exerciseSetId: string;
  answers: Record<string, string | string[]>;
  score: number;
  totalScore: number;
  correctCount: number;
  totalCount: number;
  wrongQuestionIds: string[];
  submittedAt: number;
  durationUsed: number;            // 秒
  attempt: number;                 // 第几次尝试
}

// --- 仿真实验 ---
export interface SimParamDef {
  key: string;
  label: string;
  min: number;
  max: number;
  default: number;
  step: number;
  unit?: string;
}

export interface SimulationDef {
  id: string;
  slug: SimType;
  title: string;
  subtitle: string;
  description: string;
  objectives: string[];
  parameters: SimParamDef[];
  theory: string;                 // 实验原理
  procedure: string[];             // 实验步骤
  questions: string[];             // 思考题
  reportTemplate: string;          // 实验报告模板
  textbookRef: string;
}

export interface SimRecord {
  id?: string;
  userId: string;
  simulationId: string;
  params: Record<string, number>;
  metrics: Record<string, number | string>;
  notes?: string;
  createdAt: number;
  exported?: boolean;
}

// --- AI助教 ---
export interface ChatMessage {
  id?: string;
  userId?: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  formattedContent?: string;       // LaTeX渲染后的内容
  timestamp: number;
  tokens?: number;
  relatedKPs?: string[];           // 关联的知识点ID
  suggestedQuestions?: string[];
  feedback?: -1 | 0 | 1;           // 用户反馈:踩/无/赞
}

export interface ChatSession {
  id?: string;
  userId: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  tags: string[];
}

// --- 资源 ---
export interface ResourceItem {
  id: string;
  title: string;
  type: ResourceType;
  chapterId: number;
  description: string;
  url: string;
  fileSizeBytes?: number;
  downloads: number;
  views: number;
  tags: string[];
  uploadedBy: string;
  uploadedAt: number;
}

// --- 排行榜 ---
export interface LeaderboardEntry {
  userId: string;
  rank: number;
  username: string;
  realName: string;
  avatar: string;
  totalScore: number;
  totalHours: number;
  streakDays: number;
  completedLessons: number;
  masteryAvg: number;
}

// --- 认证 ---
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email?: string;
  password: string;
  realName?: string;
  studentId?: string;
  role?: Role;
}

export interface AuthResponse {
  token: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: SafeUser;
  progress?: UserProgress;
}

// --- 验证 ---
export interface ValidationError {
  field: string;
  message: string;
}

// ========= 智慧课堂（签到 / 答题 / 弹幕 / 投票 / 评价）=========
export type ClassSessionType = 'attendance' | 'quiz' | 'poll' | 'danmaku' | 'rating';
export type ClassEventType = 'checkin' | 'answer' | 'vote' | 'danmaku' | 'rating';

export interface RosterEntry {
  name: string;
  studentId: string;
  className?: string;
}

export interface QuizQuestionDef {
  content: string;
  type: 'choice' | 'multiple' | 'truefalse' | 'short';
  options: { key: string; content: string }[];   // 客观题选项
  answer: string | string[] | null;              // 标准答案(可选)
  analysis?: string;                             // 答案解析
  durationSec?: number;                          // 限时(秒),0=不限时
}

export interface ClassSession {
  id: string;
  code: string;                    // 6位加入码(学生输入或扫码)
  type: ClassSessionType;
  title: string;
  courseName?: string;
  teacherName?: string;
  className?: string;              // 授课班级
  createdAt: number;
  expiresAt?: number;              // 截止时间
  closed: boolean;
  roster: RosterEntry[];           // 花名册(可为空)
  config: {
    question?: QuizQuestionDef;    // quiz
    options?: string[];            // poll
    ratingLabels?: string[];       // rating
  };
}

export interface ClassEvent {
  id: string;
  sessionId: string;
  type: ClassEventType;
  name: string;
  studentId?: string;
  className?: string;
  payload: string;                 // 选项key/答案文本/弹幕内容/评分值
  at: number;
}

export interface ClassResults {
  session: ClassSession;
  events: ClassEvent[];
  summary: {
    checkinCount: number;
    absentList: RosterEntry[];     // 花名册内未签到者
    unregistered: number;          // 非花名册签到者
    optionCounts: Record<string, number>;
    correctCount: number;
    answeredCount: number;
    correctRate: number;           // 0-100
    avgRating: number;
    voteCounts: number[];
    wordFreq: { word: string; count: number }[];  // 弹幕/短答案词频
  };
}

export interface ServerInfo {
  lanIps: string[];
  port: number;
  nodeEnv: string;
}
