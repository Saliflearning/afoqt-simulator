export type SectionId =
  | "verbal"
  | "arithmetic"
  | "word"
  | "math"
  | "reading"
  | "judgment"
  | "science"
  | "table"
  | "instrument"
  | "block"
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
  referenceCount: number;
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

export const COMPOSITE_DEFS = [
  {
    key: "pilot",
    name: "Pilot-oriented practice",
    sections: ["verbal","arithmetic","table","instrument","math","aviation"] as SectionId[],
    description: "A local grouping of verbal, math, table, instrument, and aviation practice results.",
  },
  {
    key: "cso",
    name: "CSO-oriented practice",
    sections: ["verbal","arithmetic","math","table","block"] as SectionId[],
    description: "A local grouping of verbal, math, table, and spatial practice results.",
  },
  {
    key: "abm",
    name: "ABM-oriented practice",
    sections: ["verbal","arithmetic","math","table","science"] as SectionId[],
    description: "A local grouping of verbal, quantitative, science, and table practice results.",
  },
  {
    key: "verbal",
    name: "Verbal practice",
    sections: ["verbal","reading","word","judgment"] as SectionId[],
    description: "A local summary of the app's verbal, reading, word, and judgment sections.",
  },
  {
    key: "quant",
    name: "Quantitative practice",
    sections: ["arithmetic","math"] as SectionId[],
    description: "A local summary of arithmetic and mathematics practice.",
  },
] as const;

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
