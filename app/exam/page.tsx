"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { GraduationCap, ChevronRight, ChevronLeft, RotateCcw, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
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

type ExamPhase = "intro" | "active" | "review";

interface SectionResult {
  sectionId: SectionId;
  answers: Record<number, number>;
  timeUsed: number;
}

export default function ExamPage() {
  const [phase, setPhase] = useState<ExamPhase>("intro");
  const [sectionIdx, setSectionIdx] = useState(0);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [sectionResults, setSectionResults] = useState<SectionResult[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const attemptTimesRef = useRef<number[]>([]);
  const questionStartRef = useRef(0);
  const sessionStartRef = useRef(0);

  const currentSection = SECTION_META[sectionIdx];
  const questions = getSectionQuestions(currentSection.id);

  useEffect(() => {
    if (phase === "active") {
      setTimeLeft(currentSection.timeSeconds);
      setAnswers({});
      setQuestionIdx(0);
      attemptTimesRef.current = [];
      questionStartRef.current = Date.now();
    }
  }, [sectionIdx, phase, currentSection.timeSeconds]);

  useEffect(() => {
    if (phase !== "active" || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(v => { if (v <= 1) { advanceSection(); return 0; } return v - 1; }), 1000);
    return () => clearInterval(t);
  }, [phase, timeLeft]);

  const startExam = () => { sessionStartRef.current = Date.now(); setSectionIdx(0); setPhase("active"); };

  const advanceSection = useCallback(() => {
    const result: SectionResult = { sectionId: currentSection.id as SectionId, answers, timeUsed: currentSection.timeSeconds - timeLeft };
    setSectionResults(prev => [...prev, result]);
    if (sectionIdx < SECTION_META.length - 1) {
      setSectionIdx(i => i + 1);
    } else {
      finishExam([...sectionResults, result]);
    }
  }, [currentSection, answers, timeLeft, sectionIdx, sectionResults]);

  const finishExam = (allResults: SectionResult[]) => {
    setPhase("review");
    const appState = loadState();
    let newState = { ...appState };
    const allAttempts: QuestionAttempt[] = [];

    for (const result of allResults) {
      const qs = getSectionQuestions(result.sectionId);
      const sec = SECTION_META.find(s => s.id === result.sectionId)!;
      const timeLimit = (sec.timeSeconds / qs.length) * 1000;
      qs.forEach((q, i) => {
        const attempt: QuestionAttempt = { questionId: q.id, correct: result.answers[i] === q.answer, timeMs: 0, timestamp: Date.now(), mode: "exam" };
        allAttempts.push(attempt);
        const cs = newState.cardStates[q.id] ?? { questionId: q.id, repetitions: 0, easeFactor: 2.5, interval: 0, nextReview: 0, lastQuality: -1 };
        const quality = qualityFromResult(attempt.correct, attempt.timeMs, timeLimit);
        newState.cardStates = { ...newState.cardStates, [q.id]: sm2Update(cs, quality) };
      });
    }

    const totalScore = allAttempts.filter(a => a.correct).length;
    const timeUsed = Math.round((Date.now() - sessionStartRef.current) / 1000);
    const session: Session = { id: uid(), date: Date.now(), mode: "exam", section: "full", score: totalScore, total: allAttempts.length, timeUsedSeconds: timeUsed, attempts: allAttempts };
    newState = saveSession(newState, session);
    saveState(newState);
    setSectionResults(allResults);
  };

  const handleChoose = (choiceIdx: number) => {
    const elapsed = Date.now() - questionStartRef.current;
    attemptTimesRef.current[questionIdx] = elapsed;
    setAnswers(prev => ({ ...prev, [questionIdx]: choiceIdx }));
  };

  const handleNext = () => {
    if (questionIdx < questions.length - 1) { setQuestionIdx(i => i + 1); questionStartRef.current = Date.now(); }
    else advanceSection();
  };

  const handleBack = () => { if (questionIdx > 0) { setQuestionIdx(i => i - 1); questionStartRef.current = Date.now(); } };

  if (phase === "intro") return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Card>
        <CardContent className="p-8 space-y-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-2xl bg-red-900/30"><GraduationCap className="w-8 h-8 text-red-400" /></div>
            <div>
              <h1 className="text-3xl font-bold">Full Exam Simulation</h1>
              <p className="text-slate-400">11 drillable subtests in sequence — official timing, zero feedback. Mirrors the real ~5-hour, 12-subtest AFOQT.</p>
            </div>
          </div>

          {/* SDI Notice */}
          <div className="p-4 rounded-xl border border-blue-800/40 bg-blue-950/20">
            <p className="text-blue-300 text-sm font-semibold">About the Self-Description Inventory (SDI)</p>
            <p className="text-slate-400 text-sm mt-1">The official AFOQT includes Subtest 7: the SDI — 220 personality/temperament items, 40 minutes. It has no correct answers and cannot be drilled. On exam day: answer honestly and consistently. This sim skips it; the real exam does not.</p>
          </div>

          <div className="p-4 rounded-xl border border-red-800/50 bg-red-950/20">
            <div className="flex items-center gap-2 mb-2"><AlertTriangle className="w-4 h-4 text-red-400" /><span className="font-semibold text-red-300">Exam Rules — No Guessing Penalty</span></div>
            <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
              <li>No feedback during exam — explanations only in post-exam review</li>
              <li>Each section auto-advances when time expires</li>
              <li>Blanks count as wrong — always guess before time runs out</li>
              <li>Table Reading, Block Counting, Instrument Comprehension: most candidates do not finish — pace aggressively</li>
              <li>All attempts update your SM-2 adaptive engine</li>
            </ul>
          </div>

          <div className="space-y-2">
            {SECTION_META.map((s, i) => {
              const isHard = (s as any).hardToFinish;
              return (
                <div key={s.id} className={`flex items-center justify-between p-3 rounded-xl text-sm ${isHard ? "bg-red-950/30 border border-red-900/40" : "bg-slate-800"}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-xs w-4">{i + 1}</span>
                    <span className={isHard ? "text-red-200" : "text-slate-200"}>{s.title}</span>
                    {isHard && <Badge variant="destructive" className="text-[10px] px-1.5">Hard to finish</Badge>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">{s.officialCount} official</span>
                    <span className="text-slate-500 text-xs">{(s as any).secPerQ}s/q</span>
                    <Badge variant="secondary">{formatTime(s.timeSeconds)}</Badge>
                  </div>
                </div>
              );
            })}
            {/* SDI placeholder */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-sm opacity-60">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-xs w-4">7</span>
                <span className="text-slate-400">Self-Description Inventory</span>
                <Badge variant="secondary" className="text-[10px]">Skipped</Badge>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-500">220 personality items</span>
                <Badge variant="secondary">40 min</Badge>
              </div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-800 text-sm text-slate-300">
            <span className="text-slate-400">Total time: </span>
            <span className="font-bold">{formatTime(SECTION_META.reduce((s, x) => s + x.timeSeconds, 0))}</span>
            <span className="text-slate-400 ml-4">Total questions: </span>
            <span className="font-bold">{SECTION_META.reduce((s, x) => s + getSectionQuestions(x.id).length, 0)}</span>
          </div>
          <Button onClick={startExam} size="lg" className="w-full bg-red-600 hover:bg-red-700">Begin Full Exam</Button>
        </CardContent>
      </Card>
    </div>
  );

  if (phase === "review") {
    const totalQ = sectionResults.reduce((s, r) => s + getSectionQuestions(r.sectionId).length, 0);
    const totalCorrect = sectionResults.reduce((s, r) => {
      const qs = getSectionQuestions(r.sectionId);
      return s + qs.filter((q, i) => r.answers[i] === q.answer).length;
    }, 0);
    const overallPct = pct(totalCorrect, totalQ);
    const { label, color } = gradeLabel(overallPct);

    return (
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <GraduationCap className="w-8 h-8 text-red-400" />
              <div><h2 className="text-2xl font-bold">Exam Complete</h2><p className="text-slate-400 text-sm">Full simulation review — all sections</p></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-800 text-center"><div className="text-3xl font-bold tabular-nums">{overallPct}%</div><div className="text-xs text-slate-400">Overall</div></div>
              <div className="p-3 rounded-xl bg-slate-800 text-center"><div className={`text-3xl font-bold ${color}`}>{label}</div><div className="text-xs text-slate-400">Grade</div></div>
              <div className="p-3 rounded-xl bg-slate-800 text-center"><div className="text-3xl font-bold">{totalCorrect}/{totalQ}</div><div className="text-xs text-slate-400">Correct</div></div>
            </div>
            <Progress value={overallPct} indicatorClassName={overallPct >= 75 ? "bg-green-500" : "bg-red-500"} className="h-3" />
          </CardContent>
        </Card>

        {sectionResults.map(result => {
          const qs = getSectionQuestions(result.sectionId);
          const sec = SECTION_META.find(s => s.id === result.sectionId)!;
          const sCorrect = qs.filter((q, i) => result.answers[i] === q.answer).length;
          const sPct = pct(sCorrect, qs.length);
          const { label: sl, color: sc } = gradeLabel(sPct);
          return (
            <Card key={result.sectionId}>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">{sec.title}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant={sPct >= 75 ? "success" : sPct >= 60 ? "warning" : "destructive"}>{sPct}%</Badge>
                    <span className={`text-sm font-medium ${sc}`}>{sl}</span>
                  </div>
                </div>
                <Progress value={sPct} indicatorClassName={sPct >= 75 ? "bg-green-500" : sPct >= 60 ? "bg-amber-500" : "bg-red-500"} />
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {qs.map((q, i) => {
                    const ok = result.answers[i] === q.answer;
                    return (
                      <div key={q.id} className="flex items-start gap-2 text-xs">
                        {ok ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" /> : <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />}
                        <div>
                          <span className="text-slate-300">{q.q.slice(0, 80)}{q.q.length > 80 ? "…" : ""}</span>
                          {!ok && <div className="text-slate-400 mt-0.5">Correct: {q.choices[q.answer]} — {q.why}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}

        <div className="flex gap-3">
          <Button onClick={() => { setSectionIdx(0); setSectionResults([]); setPhase("intro"); }} className="flex-1 bg-red-600 hover:bg-red-700"><RotateCcw className="w-4 h-4" /> Retake Exam</Button>
          <Button asChild variant="outline"><a href="/adaptive">Adaptive Drill</a></Button>
        </div>
      </div>
    );
  }

  // Active exam
  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-5">
      {/* Section progress */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {SECTION_META.map((s, i) => (
          <div key={s.id} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 ${i === sectionIdx ? "bg-red-600 text-white" : i < sectionIdx ? "bg-green-800 text-green-100" : "bg-slate-800 text-slate-400"}`}>
            {i < sectionIdx ? <CheckCircle2 className="w-3 h-3" /> : null}
            {s.title}
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="font-bold text-lg">{currentSection.title}</h2>
          <p className="text-xs text-slate-400">Section {sectionIdx + 1} of {SECTION_META.length} • No feedback</p>
        </div>
        <TimerDisplay timeLeft={timeLeft} totalTime={currentSection.timeSeconds} running={true} />
      </div>

      <div className="flex items-center gap-3">
        <Progress value={(questionIdx / questions.length) * 100} className="flex-1" />
        <span className="text-sm text-slate-400 tabular-nums">{questionIdx + 1}/{questions.length}</span>
      </div>

      <Card>
        <CardContent className="p-6">
          <QuestionCard key={questions[questionIdx].id} question={questions[questionIdx]} index={questionIdx} total={questions.length} selected={answers[questionIdx]} showFeedback={false} onChoose={handleChoose} />
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button disabled={questionIdx === 0} onClick={handleBack} variant="outline"><ChevronLeft className="w-4 h-4" /> Back</Button>
        <Button onClick={handleNext} className="bg-red-600 hover:bg-red-700">
          {questionIdx < questions.length - 1 ? <><ChevronRight className="w-4 h-4" /> Next</> : sectionIdx < SECTION_META.length - 1 ? "Next Section" : "Finish Exam"}
        </Button>
      </div>
    </div>
  );
}
