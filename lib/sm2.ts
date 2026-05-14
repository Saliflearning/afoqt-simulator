import type { CardState } from "./types";

/** SM-2 quality: 0=blackout, 1=wrong, 2=wrong-hint, 3=correct-hard, 4=correct, 5=perfect */
export function sm2Update(state: CardState, quality: 0 | 1 | 2 | 3 | 4 | 5): CardState {
  let { repetitions, easeFactor, interval } = state;

  if (quality >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  easeFactor = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
  );

  const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;

  return {
    questionId: state.questionId,
    repetitions,
    easeFactor,
    interval,
    nextReview,
    lastQuality: quality,
  };
}

export function defaultCardState(questionId: string): CardState {
  return {
    questionId,
    repetitions: 0,
    easeFactor: 2.5,
    interval: 0,
    nextReview: 0, // due immediately
    lastQuality: -1,
  };
}

/** Map correctness + time ratio to SM-2 quality */
export function qualityFromResult(correct: boolean, timeMs: number, timeLimitMs: number): 0 | 1 | 2 | 3 | 4 | 5 {
  if (!correct) {
    // Used more than half the time but still wrong = quality 1; quick wrong = 0
    return timeMs > timeLimitMs * 0.5 ? 1 : 0;
  }
  const ratio = timeMs / timeLimitMs;
  if (ratio < 0.25) return 5;
  if (ratio < 0.5) return 4;
  return 3;
}

export function isDue(state: CardState): boolean {
  return Date.now() >= state.nextReview;
}

export function urgency(state: CardState): number {
  // Higher = more urgent to review
  const overdue = Math.max(0, Date.now() - state.nextReview) / 86400000;
  const weakness = 5 - state.lastQuality; // last quality inverted
  return overdue * 2 + weakness;
}
