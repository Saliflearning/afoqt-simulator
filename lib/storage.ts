"use client";
import type { AppState, Session, CardState, QuestionAttempt } from "./types";
import { defaultCardState } from "./sm2";

const KEY = "afoqt_state_v2";

export function loadState(): AppState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    return JSON.parse(raw) as AppState;
  } catch {
    return emptyState();
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
}

function emptyState(): AppState {
  return {
    sessions: [],
    cardStates: {},
    streak: 0,
    lastPracticeDate: "",
    totalMinutesPracticed: 0,
  };
}

export function getCardState(state: AppState, questionId: string): CardState {
  return state.cardStates[questionId] ?? defaultCardState(questionId);
}

export function saveSession(state: AppState, session: Session): AppState {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let streak = state.streak;
  if (state.lastPracticeDate === today) {
    // same day, no streak change
  } else if (state.lastPracticeDate === yesterday) {
    streak += 1;
  } else {
    streak = 1;
  }

  const timeMins = Math.round(session.timeUsedSeconds / 60);

  return {
    ...state,
    sessions: [...state.sessions, session],
    streak,
    lastPracticeDate: today,
    totalMinutesPracticed: state.totalMinutesPracticed + timeMins,
  };
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
