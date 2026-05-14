export type SectionId =
  | "verbal"
  | "arithmetic"
  | "word"
  | "math"
  | "science"
  | "table"
  | "aviation";

export interface Question {
  id: string;
  section: SectionId;
  topic: string;
  q: string;
  choices: string[];
  answer: number;
  why: string;
  difficulty: 1 | 2 | 3;
  tags: string[];
  // Table reading section extras
  x?: string;
  y?: string;
}

export interface SectionMeta {
  id: SectionId;
  title: string;
  icon: string;
  timeSeconds: number;
  description: string;
  tips: string;
  officialCount: number;
}

// SM-2 spaced repetition card state
export interface CardState {
  questionId: string;
  repetitions: number;
  easeFactor: number;
  interval: number; // days
  nextReview: number; // timestamp ms
  lastQuality: number; // 0-5
}

export interface QuestionAttempt {
  questionId: string;
  correct: boolean;
  timeMs: number;
  timestamp: number;
  mode: "drill" | "adaptive" | "exam";
}

export interface Session {
  id: string;
  date: number;
  mode: "drill" | "adaptive" | "exam";
  section: SectionId | "mixed" | "full";
  score: number;
  total: number;
  timeUsedSeconds: number;
  attempts: QuestionAttempt[];
}

export interface AppState {
  sessions: Session[];
  cardStates: Record<string, CardState>;
  streak: number;
  lastPracticeDate: string; // YYYY-MM-DD
  totalMinutesPracticed: number;
}

export interface SectionPerf {
  section: SectionId;
  correct: number;
  total: number;
  avgTimeMs: number;
  pct: number;
}

export interface WeakTopic {
  section: SectionId;
  topic: string;
  correct: number;
  total: number;
  pct: number;
}
