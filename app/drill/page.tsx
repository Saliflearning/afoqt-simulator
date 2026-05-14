"use client";
import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Calculator, BookOpen, Target, Zap, Table2, Plane, RotateCcw, ChevronLeft, ChevronRight, CheckCircle2, XCircle, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TimerDisplay } from "@/components/TimerDisplay";
import { QuestionCard } from "@/components/QuestionCard";
import { loadState, saveState, saveSession } from "@/lib/storage";
import { sm2Update, qualityFromResult } from "@/lib/sm2";
import { getSectionQuestions, SECTION_META } from "@/lib/questions";
import { uid, pct, gradeLabel, formatTime } from "@/lib/utils";
import type { QuestionAttempt, Session, SectionId } from "@/lib/types";

const ICONS: Record<string, React.ElementType> = { verbal: Brain, arithmetic: Calculator, word: BookOpen, math: Target, science: Zap, table: Table2, aviation: Plane };

type Mode = "practice" | "test";

function DrillContent() {
  const searchParams = useSearchParams();
  const initialSection = (searchParams.get("section") ?? "arithmetic") as SectionId;

  const [sectionId, setSectionId] = useState<SectionId>(initialSection);
  const [mode, setMode] = useState<Mode>("practice");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showReview, setShowReview] = useState(false);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const section = SECTION_META.find(s => s.id === sectionId)!;
  const [timeLeft, setTimeLeft] = useState(section.timeSeconds);
  const startTimeRef = useRef<number>(0);
  const questionStartRef = useRef<number>(0);
  const attemptTimesRef = useRef<number[]>([]);

  const questions = getSectionQuestions(sectionId);
  const q = questions[index];

  useEffect(() => {
    setIndex(0); setAnswers({}); setShowReview(false); setRunning(false); setStarted(false);
    setTimeLeft(section.timeSeconds); attemptTimesRef.current = [];
  }, [sectionId, section.timeSeconds]);

  useEffect(() => {
    if (!running || timeLeft <= 0 || showReview) return;
    const t = setInterval(() => setTimeLeft(v => { if (v <= 1) { setRunning(false); setShowReview(true); return 0; } return v - 1; }), 1000);
    return () => clearInterval(t);
  }, [running, timeLeft, showReview]);

  const handleStart = () => { setRunning(true); setStarted(true); startTimeRef.current = Date.now(); questionStartRef.current = Date.now(); };
  const handlePause = () => setRunning(false);

  const handleChoose = useCallback((choiceIdx: number) => {
    if (answers[index] !== undefined) return;
    const elapsed = Date.now() - questionStartRef.current;
    attemptTimesRef.current[index] = elapsed;
    setAnswers(prev => {
      const next = { ...prev, [index]: choiceIdx };
      if (mode === "test" && index < questions.length - 1) {
        setTimeout(() => { setIndex(i => i + 1); questionStartRef.current = Date.now(); }, 200);
      }
      return next;
    });
  }, [answers, index, mode, questions.length]);

  const handleFinish = () => {
    setRunning(false);
    setShowReview(true);
    persistSession();
  };

  const persistSession = () => {
    const appState = loadState();
    const attempts: QuestionAttempt[] = questions.map((q, i) => ({
      questionId: q.id,
      correct: answers[i] === q.answer,
      timeMs: attemptTimesRef.current[i] ?? 0,
      timestamp: Date.now(),
      mode: "drill",
    }));
    const timeUsed = section.timeSeconds - timeLeft;
    const sessionScore = attempts.filter(a => a.correct).length;
    const session: Session = { id: uid(), date: Date.now(), mode: "drill", section: sectionId, score: sessionScore, total: questions.length, timeUsedSeconds: timeUsed, attempts };

    // Update SM-2 card states
    let newState = { ...appState };
    const timeLimit = (section.timeSeconds / questions.length) * 1000;
    for (const attempt of attempts) {
      const cs = newState.cardStates[attempt.questionId] ?? { questionId: attempt.questionId, repetitions: 0, easeFactor: 2.5, interval: 0, nextReview: 0, lastQuality: -1 };
      const quality = qualityFromResult(attempt.correct, attempt.timeMs, timeLimit);
      newState.cardStates = { ...newState.cardStates, [attempt.questionId]: sm2Update(cs, quality) };
    }
    newState = saveSession(newState, session);
    saveState(newState);
  };

  const handleReset = () => { setIndex(0); setAnswers({}); setShowReview(false); setRunning(false); setStarted(false); setTimeLeft(section.timeSeconds); attemptTimesRef.current = []; };

  const score = questions.filter((q, i) => answers[i] === q.answer).length;
  const { label: gradeStr, color: gradeColor } = gradeLabel(pct(score, questions.length));
  const attempted = Object.keys(answers).length;

  if (!started && !showReview) {
    const Icon = ICONS[sectionId] ?? Target;
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardContent className="p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-2xl bg-blue-600/20"><Icon className="w-8 h-8 text-blue-300" /></div>
              <div>
                <h1 className="text-3xl font-bold">{section.title}</h1>
                <p className="text-slate-400">{section.description}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 rounded-xl bg-slate-800"><div className="text-slate-400">Time Limit</div><div className="font-bold text-lg">{formatTime(section.timeSeconds)}</div></div>
              <div className="p-3 rounded-xl bg-slate-800"><div className="text-slate-400">Questions</div><div className="font-bold text-lg">{questions.length}</div></div>
              <div className="p-3 rounded-xl bg-slate-800"><div className="text-slate-400">Sec/Question</div><div className="font-bold text-lg">{(section.timeSeconds / questions.length).toFixed(0)}s</div></div>
              <div className="p-3 rounded-xl bg-slate-800"><div className="text-slate-400">Official Count</div><div className="font-bold text-lg">{section.officialCount}</div></div>
            </div>
            <div className="p-4 rounded-xl border border-amber-800/50 bg-amber-950/20">
              <p className="text-amber-200 text-sm font-medium">⚡ Tactical Tip</p>
              <p className="text-slate-300 text-sm mt-1">{section.tips}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={() => setMode("practice")} variant={mode === "practice" ? "default" : "outline"}>Practice Mode</Button>
              <Button onClick={() => setMode("test")} variant={mode === "test" ? "default" : "outline"}>Test Mode</Button>
              <span className="text-xs text-slate-400">{mode === "practice" ? "See explanations after each answer" : "No feedback until review"}</span>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleStart} size="lg" className="flex-1 bg-green-600 hover:bg-green-700">Start — {formatTime(section.timeSeconds)}</Button>
            </div>

            {/* Section selector */}
            <div className="border-t border-slate-800 pt-4">
              <p className="text-sm text-slate-400 mb-3">Switch section:</p>
              <div className="flex flex-wrap gap-2">
                {SECTION_META.map(s => {
                  const SIcon = ICONS[s.id] ?? Target;
                  return (
                    <button key={s.id} onClick={() => setSectionId(s.id as SectionId)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${sectionId === s.id ? "bg-blue-600 border-blue-500 text-white" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"}`}>
                      <SIcon className="w-3.5 h-3.5" />{s.title}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showReview) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Session Review</h2>
              <Badge variant={score / questions.length >= 0.75 ? "success" : "destructive"} className="text-sm px-3 py-1">{score}/{questions.length}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-xl bg-slate-800 text-center"><div className="text-2xl font-bold tabular-nums">{pct(score, questions.length)}%</div><div className="text-xs text-slate-400">Score</div></div>
              <div className={`p-3 rounded-xl bg-slate-800 text-center`}><div className={`text-2xl font-bold ${gradeColor}`}>{gradeStr}</div><div className="text-xs text-slate-400">Grade</div></div>
              <div className="p-3 rounded-xl bg-slate-800 text-center"><div className="text-2xl font-bold tabular-nums">{attempted}/{questions.length}</div><div className="text-xs text-slate-400">Attempted</div></div>
            </div>
            <Progress value={pct(score, questions.length)} indicatorClassName={pct(score, questions.length) >= 75 ? "bg-green-500" : "bg-red-500"} className="h-3" />
            <p className="text-slate-300 text-sm">{score < questions.length * 0.7 ? "Below 70%. This needs repetition. Run it again immediately and then again tomorrow." : score < questions.length * 0.85 ? "Solid. Now drill the ones you missed until they bore you." : "Strong performance. Maintain this and push your weakest section."}</p>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {questions.map((item, i) => {
            const user = answers[i];
            const ok = user === item.answer;
            const timeMs = attemptTimesRef.current[i];
            return (
              <Card key={item.id} className={ok ? "border-green-900/50" : "border-red-900/50"}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {ok ? <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 shrink-0" /> : <XCircle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{i + 1}. {item.q}</div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
                        <span>Your answer: <span className={ok ? "text-green-400 font-semibold" : "text-red-400 font-semibold"}>{user === undefined ? "Blank" : `${String.fromCharCode(65 + user)}. ${item.choices[user]}`}</span></span>
                        {!ok && <span>Correct: <span className="text-green-400 font-semibold">{String.fromCharCode(65 + item.answer)}. {item.choices[item.answer]}</span></span>}
                        {timeMs && <span>{(timeMs / 1000).toFixed(1)}s</span>}
                      </div>
                      {!ok && <p className="text-slate-300 text-xs mt-2 bg-slate-800 p-2 rounded-lg">{item.why}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex gap-3">
          <Button onClick={handleReset} className="bg-red-600 hover:bg-red-700 flex-1"><RotateCcw className="w-4 h-4" /> Redo Section</Button>
          <Button asChild variant="outline"><a href="/analytics"><BarChart3 className="w-4 h-4" /> View Analytics</a></Button>
        </div>
      </div>
    );
  }

  const Icon = ICONS[sectionId] ?? Target;
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-800"><Icon className="w-5 h-5 text-blue-300" /></div>
          <div><h2 className="font-bold text-lg">{section.title}</h2><p className="text-xs text-slate-400">{mode === "practice" ? "Practice Mode" : "Test Mode"}</p></div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <TimerDisplay timeLeft={timeLeft} totalTime={section.timeSeconds} running={running} />
          <Button onClick={running ? handlePause : handleStart} variant={running ? "amber" : "success"} size="sm">{running ? "Pause" : "Resume"}</Button>
          <Button onClick={handleReset} variant="outline" size="icon"><RotateCcw className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Progress value={(index / questions.length) * 100} className="flex-1" />
        <span className="text-sm text-slate-400 tabular-nums shrink-0">{attempted}/{questions.length}</span>
      </div>

      <Card>
        <CardContent className="p-6">
          <AnimatePresence mode="wait">
            <QuestionCard
              key={q.id}
              question={q}
              index={index}
              total={questions.length}
              selected={answers[index]}
              showFeedback={mode === "practice"}
              onChoose={handleChoose}
            />
          </AnimatePresence>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button disabled={index === 0} onClick={() => { setIndex(v => v - 1); questionStartRef.current = Date.now(); }} variant="outline"><ChevronLeft className="w-4 h-4" /> Back</Button>
        {index < questions.length - 1 ? (
          <Button onClick={() => { setIndex(v => v + 1); questionStartRef.current = Date.now(); }}>Next <ChevronRight className="w-4 h-4" /></Button>
        ) : (
          <Button onClick={handleFinish} className="bg-purple-600 hover:bg-purple-700">Finish & Review</Button>
        )}
      </div>
    </div>
  );
}

export default function DrillPage() {
  return <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-slate-400">Loading...</div>}><DrillContent /></Suspense>;
}
