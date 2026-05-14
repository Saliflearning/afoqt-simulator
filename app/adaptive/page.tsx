"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, RotateCcw, ChevronRight, CheckCircle2, XCircle, Zap, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { QuestionCard } from "@/components/QuestionCard";
import { loadState, saveState, saveSession } from "@/lib/storage";
import { sm2Update, qualityFromResult, isDue, urgency } from "@/lib/sm2";
import { QUESTIONS } from "@/lib/questions";
import { uid, pct, gradeLabel } from "@/lib/utils";
import type { QuestionAttempt, Session, Question } from "@/lib/types";

const TIME_PER_Q_MS = 45000; // 45 seconds per question in adaptive

function buildAdaptiveQueue(cardStates: Record<string, { nextReview: number; lastQuality: number; repetitions: number; easeFactor: number; interval: number; questionId: string }>): Question[] {
  const scored = QUESTIONS.map(q => {
    const cs = cardStates[q.id];
    if (!cs) return { q, score: 100 }; // unseen = highest priority
    if (isDue(cs)) return { q, score: 50 + urgency(cs) };
    return { q, score: -1 }; // not due
  });

  const due = scored.filter(x => x.score >= 0).sort((a, b) => b.score - a.score);
  // Mix in some not-due questions if queue is short
  const notDue = scored.filter(x => x.score < 0).sort(() => Math.random() - 0.5).slice(0, 5);
  return [...due, ...notDue].slice(0, 20).map(x => x.q);
}

export default function AdaptivePage() {
  const [queue, setQueue] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showReview, setShowReview] = useState(false);
  const [ready, setReady] = useState(false);
  const sessionStartRef = useRef(0);
  const questionStartRef = useRef(0);
  const attemptTimesRef = useRef<number[]>([]);

  useEffect(() => {
    const state = loadState();
    const q = buildAdaptiveQueue(state.cardStates as any);
    setQueue(q);
    setReady(true);
  }, []);

  const q = queue[index];

  const handleStart = () => { sessionStartRef.current = Date.now(); questionStartRef.current = Date.now(); };

  const handleChoose = useCallback((choiceIdx: number) => {
    if (!q || answers[index] !== undefined) return;
    const elapsed = Date.now() - questionStartRef.current;
    attemptTimesRef.current[index] = elapsed;
    setAnswers(prev => ({ ...prev, [index]: choiceIdx }));
  }, [q, answers, index]);

  const handleNext = () => {
    if (index < queue.length - 1) { setIndex(i => i + 1); questionStartRef.current = Date.now(); }
    else finish();
  };

  const finish = () => {
    setShowReview(true);
    const appState = loadState();
    const attempts: QuestionAttempt[] = queue.map((item, i) => ({
      questionId: item.id, correct: answers[i] === item.answer,
      timeMs: attemptTimesRef.current[i] ?? 0, timestamp: Date.now(), mode: "adaptive",
    }));
    const sessionScore = attempts.filter(a => a.correct).length;
    const timeUsed = Math.round((Date.now() - sessionStartRef.current) / 1000);
    const session: Session = { id: uid(), date: Date.now(), mode: "adaptive", section: "mixed", score: sessionScore, total: queue.length, timeUsedSeconds: timeUsed, attempts };

    let newState = { ...appState };
    for (const attempt of attempts) {
      const cs = newState.cardStates[attempt.questionId] ?? { questionId: attempt.questionId, repetitions: 0, easeFactor: 2.5, interval: 0, nextReview: 0, lastQuality: -1 };
      const quality = qualityFromResult(attempt.correct, attempt.timeMs, TIME_PER_Q_MS);
      newState.cardStates = { ...newState.cardStates, [attempt.questionId]: sm2Update(cs, quality) };
    }
    newState = saveSession(newState, session);
    saveState(newState);
  };

  const handleReset = () => {
    const state = loadState();
    const q = buildAdaptiveQueue(state.cardStates as any);
    setQueue(q); setIndex(0); setAnswers({}); setShowReview(false);
    attemptTimesRef.current = []; handleStart();
  };

  if (!ready) return <div className="flex items-center justify-center min-h-screen text-slate-400">Analyzing your weak areas...</div>;

  if (queue.length === 0) return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card><CardContent className="p-8 text-center space-y-4">
        <Brain className="w-12 h-12 text-purple-400 mx-auto" />
        <h2 className="text-2xl font-bold">No Questions Due</h2>
        <p className="text-slate-400">Complete some drill sessions first, then the SM-2 engine will queue your weak questions here.</p>
        <Button asChild><a href="/drill">Start a Drill</a></Button>
      </CardContent></Card>
    </div>
  );

  if (showReview) {
    const score = queue.filter((item, i) => answers[i] === item.answer).length;
    const { label, color } = gradeLabel(pct(score, queue.length));
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-5">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-400" />
              <div><h2 className="text-2xl font-bold">Adaptive Session Complete</h2><p className="text-slate-400 text-sm">SM-2 card states updated — review intervals recalculated.</p></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-800 text-center"><div className="text-2xl font-bold tabular-nums">{pct(score, queue.length)}%</div><div className="text-xs text-slate-400">Score</div></div>
              <div className="p-3 rounded-xl bg-slate-800 text-center"><div className={`text-2xl font-bold ${color}`}>{label}</div><div className="text-xs text-slate-400">Grade</div></div>
              <div className="p-3 rounded-xl bg-slate-800 text-center"><div className="text-2xl font-bold">{queue.length}</div><div className="text-xs text-slate-400">Questions</div></div>
            </div>
            <Progress value={pct(score, queue.length)} indicatorClassName={pct(score, queue.length) >= 75 ? "bg-green-500" : "bg-red-500"} className="h-3" />
          </CardContent>
        </Card>
        <div className="space-y-3">
          {queue.map((item, i) => {
            const ok = answers[i] === item.answer;
            return (
              <Card key={item.id} className={ok ? "border-green-900/50" : "border-red-900/50"}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {ok ? <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />}
                    <div>
                      <div className="text-sm font-medium">{item.q}</div>
                      <div className="text-xs text-slate-400 mt-1 flex gap-2 flex-wrap">
                        <span>Yours: <span className={ok ? "text-green-400" : "text-red-400"}>{answers[i] !== undefined ? item.choices[answers[i]] : "Blank"}</span></span>
                        {!ok && <span>Correct: <span className="text-green-400">{item.choices[item.answer]}</span></span>}
                        <Badge variant="secondary" className="text-[10px]">{item.section}</Badge>
                      </div>
                      {!ok && <p className="text-xs text-slate-300 mt-2 p-2 bg-slate-800 rounded-lg">{item.why}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="flex gap-3">
          <Button onClick={handleReset} className="bg-purple-600 hover:bg-purple-700 flex-1"><RotateCcw className="w-4 h-4" /> New Adaptive Session</Button>
          <Button asChild variant="outline"><a href="/analytics"><TrendingUp className="w-4 h-4" /> Analytics</a></Button>
        </div>
      </div>
    );
  }

  const answered = answers[index] !== undefined;
  const stats = { done: Object.keys(answers).length, correct: queue.slice(0, index + 1).filter((_, i) => answers[i] === queue[i]?.answer).length };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-900/40"><Brain className="w-5 h-5 text-purple-300" /></div>
          <div>
            <h2 className="font-bold text-lg">Adaptive Mode</h2>
            <p className="text-xs text-slate-400">SM-2 targeting your weakest questions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="purple" className="flex items-center gap-1"><Zap className="w-3 h-3" /> {stats.done}/{queue.length}</Badge>
          <Badge variant={stats.done > 0 ? "success" : "secondary"}>{stats.done > 0 ? `${Math.round(stats.correct / stats.done * 100)}%` : "—"}</Badge>
        </div>
      </div>

      <Progress value={(index / queue.length) * 100} indicatorClassName="bg-purple-500" />

      <Card>
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            {q && (
              <QuestionCard key={q.id} question={q} index={index} total={queue.length} selected={answers[index]} showFeedback={true} onChoose={handleChoose} />
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        {!answered ? (
          <p className="text-sm text-slate-500">Select an answer to continue</p>
        ) : index < queue.length - 1 ? (
          <Button onClick={handleNext}>Next <ChevronRight className="w-4 h-4" /></Button>
        ) : (
          <Button onClick={finish} className="bg-purple-600 hover:bg-purple-700">Finish Session</Button>
        )}
      </div>
    </div>
  );
}
