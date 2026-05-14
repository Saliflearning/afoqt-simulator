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

export interface CompositeScore {
  name: string;
  score: number;
  min: number; // typical minimum for qualification
  description: string;
}

export const COMPOSITE_DEFS = [
  {
    key: "pilot",
    name: "Pilot",
    sections: ["verbal","arithmetic","table","instrument","math","aviation"] as SectionId[],
    minScore: 25,
    description: "Required for rated pilot training. Combines verbal, math, table reading, instrument comprehension, and aviation subtests.",
  },
  {
    key: "cso",
    name: "Combat Systems Officer",
    sections: ["verbal","arithmetic","math","table","block"] as SectionId[],
    minScore: 25,
    description: "Navigator/CSO track. Heavy on math, spatial reasoning (block counting), and table reading speed.",
  },
  {
    key: "abm",
    name: "Air Battle Manager",
    sections: ["verbal","arithmetic","math","table","science"] as SectionId[],
    minScore: 25,
    description: "ABM composite draws on verbal, quantitative, science, and table reading.",
  },
  {
    key: "verbal",
    name: "Verbal",
    sections: ["verbal","reading","word","judgment"] as SectionId[],
    minScore: null,
    description: "Subcomposite: Verbal Analogies + Reading Comprehension + Word Knowledge + Situational Judgment.",
  },
  {
    key: "quant",
    name: "Quantitative",
    sections: ["arithmetic","math"] as SectionId[],
    minScore: null,
    description: "Subcomposite: Arithmetic Reasoning + Math Knowledge.",
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
