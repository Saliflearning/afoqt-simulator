import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Session, SectionId, SectionPerf, WeakTopic, QuestionAttempt } from "./types";
import { QUESTIONS } from "./questions";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(sec: number): string {
  if (sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatMs(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Generate a short random ID */
export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Returns 0-100 percent string */
export function pct(correct: number, total: number): number {
  if (!total) return 0;
  return Math.round((correct / total) * 100);
}

/** Compute per-section performance from sessions */
export function computeSectionPerf(sessions: Session[]): SectionPerf[] {
  const map: Record<string, { correct: number; total: number; times: number[] }> = {};
  for (const s of sessions) {
    for (const a of s.attempts) {
      const q = QUESTIONS.find((q) => q.id === a.questionId);
      if (!q) continue;
      if (!map[q.section]) map[q.section] = { correct: 0, total: 0, times: [] };
      map[q.section].total += 1;
      if (a.correct) map[q.section].correct += 1;
      map[q.section].times.push(a.timeMs);
    }
  }
  return Object.entries(map).map(([section, d]) => ({
    section: section as SectionId,
    correct: d.correct,
    total: d.total,
    avgTimeMs: d.times.length ? d.times.reduce((a, b) => a + b, 0) / d.times.length : 0,
    pct: pct(d.correct, d.total),
  }));
}

/** Compute weak topics (bottom 3 by pct with >=3 attempts) */
export function computeWeakTopics(sessions: Session[]): WeakTopic[] {
  const map: Record<string, { section: SectionId; correct: number; total: number }> = {};
  for (const s of sessions) {
    for (const a of s.attempts) {
      const q = QUESTIONS.find((q) => q.id === a.questionId);
      if (!q) continue;
      const key = `${q.section}::${q.topic}`;
      if (!map[key]) map[key] = { section: q.section, correct: 0, total: 0 };
      map[key].total += 1;
      if (a.correct) map[key].correct += 1;
    }
  }
  return Object.entries(map)
    .filter(([, d]) => d.total >= 2)
    .map(([key, d]) => ({
      section: d.section,
      topic: key.split("::")[1],
      correct: d.correct,
      total: d.total,
      pct: pct(d.correct, d.total),
    }))
    .sort((a, b) => a.pct - b.pct);
}

/** Rolling 7-day score for line chart */
export function rollingScores(sessions: Session[]): { date: string; score: number }[] {
  const byDay: Record<string, { correct: number; total: number }> = {};
  for (const s of sessions) {
    const day = new Date(s.date).toISOString().slice(0, 10);
    if (!byDay[day]) byDay[day] = { correct: 0, total: 0 };
    byDay[day].correct += s.score;
    byDay[day].total += s.total;
  }
  return Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, d]) => ({ date, score: pct(d.correct, d.total) }));
}

export function gradeLabel(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "Elite", color: "text-green-400" };
  if (score >= 75) return { label: "Proficient", color: "text-blue-400" };
  if (score >= 60) return { label: "Developing", color: "text-amber-400" };
  return { label: "Needs Work", color: "text-red-400" };
}

export function timerColor(ratio: number): string {
  // ratio = timeLeft / totalTime (1 = full, 0 = expired)
  if (ratio > 0.5) return "text-green-400";
  if (ratio > 0.25) return "text-amber-400";
  return "text-red-400";
}

export function timerBg(ratio: number): string {
  if (ratio > 0.5) return "bg-green-500";
  if (ratio > 0.25) return "bg-amber-500";
  return "bg-red-500";
}
