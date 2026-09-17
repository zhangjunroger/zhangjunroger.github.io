export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'ppt' | 'experiment' | 'exercise';
  duration: number;
  isCompleted: boolean;
}

export interface Chapter {
  id: number;
  title: string;
  description: string;
  duration: string;
  lessons: Lesson[];
  tags: string[];
  progress: number;
  isCompleted: boolean;
}

export interface Teacher {
  id: number;
  name: string;
  title: string;
  avatar: string;
  research: string[];
  chapters: number[];
}

export interface StudentProgress {
  id: string;
  name: string;
  avatar: string;
  totalHours: number;
  score: number;
  rank: number;
  mastery: Record<string, number>;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  suggestions?: string[];
}

export interface SimParam {
  key: string;
  label: string;
  min: number;
  max: number;
  default: number;
  step: number;
}

export interface Simulation {
  id: string;
  title: string;
  description: string;
  type: 'step' | 'bode' | 'rootlocus';
  parameters: SimParam[];
  preview: string;
}

export interface Resource {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'ppt' | 'reference';
  thumbnail: string;
  downloads: number;
  chapterId: number;
}

export interface Highlight {
  id: string;
  icon: string;
  title: string;
  description: string;
  gradient: string;
  iconColor: string;
}

export interface LearningStore {
  currentStudent: StudentProgress;
  chapters: Chapter[];
  completedLessons: string[];
  aiMessages: AIMessage[];
  currentSimParams: Record<string, number>;
  incrementProgress: (lessonId: string) => void;
  addAIMessage: (msg: AIMessage) => void;
  setSimParam: (key: string, value: number) => void;
}
