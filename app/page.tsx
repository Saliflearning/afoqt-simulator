"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Brain, Calculator, BookOpen, Target, Zap, Table2, Plane, BarChart3, Flame, Clock, TrendingUp, ChevronRight, Dumbbell, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { loadState } from "@/lib/storage";
import { computeSectionPerf, computeWeakTopics, pct, gradeLabel } from "@/lib/utils";
import { SECTION_META, QUESTIONS } from "@/lib/questions";
import type { AppState, SectionPerf } from "@/lib/types";

const SECTION_ICONS: Record<string, React.ElementType> = {
  verbal: Brain, arithmetic: Calculator, word: BookOpen,
  math: Target, science: Zap, table: Table2, aviation: Plane,
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07 } }),
};

export default function Dashboard() {
  const [state, setState] = useState<AppState | null>(null);
  useEffect(() => { setState(loadState()); }, []);
  if (!state) return <div className="flex items-center justify-center min-h-screen text-slate-400">Loading...</div>;

  const perf = computeSectionPerf(state.sessions);
  const weakTopics = computeWeakTopics(state.sessions).slice(0, 3);
  const totalQuestioned = state.sessions.reduce((s, x) => s + x.total, 0);
  const totalCorrect = state.sessions.reduce((s, x) => s + x.score, 0);
  const overallPct = pct(totalCorrect, totalQuestioned);
  const { label: gradeStr, color: gradeColor } = gradeLabel(overallPct);

  const perfMap: Record<string, SectionPerf> = {};
  perf.forEach(p => { perfMap[p.section] = p; });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="destructive">AFOQT Stress Mode</Badge>
              <Badge variant="secondary">SM-2 Adaptive Engine</Badge>
              {state.streak > 0 && <Badge variant="warning" className="flex items-center gap-1"><Flame className="w-3 h-3" /> {state.streak} day streak</Badge>}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">AFOQT<span className="text-blue-400">Pro</span></h1>
            <p className="text-slate-400 mt-2 max-w-2xl text-sm md:text-base">Adaptive drilling powered by spaced repetition. The system learns what you struggle with and forces you to face it. No comfort. Just performance.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Button asChild size="lg"><Link href="/drill"><Dumbbell className="w-4 h-4" /> Start Drill</Link></Button>
            <Button asChild variant="outline" size="lg"><Link href="/adaptive"><Brain className="w-4 h-4" /> Adaptive</Link></Button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Overall Score", value: totalQuestioned ? `${overallPct}%` : "—", sub: gradeStr, subColor: gradeColor, icon: TrendingUp },
          { label: "Sessions", value: state.sessions.length.toString(), sub: "total practice sessions", subColor: "text-slate-400", icon: BarChart3 },
          { label: "Questions Done", value: totalQuestioned.toLocaleString(), sub: `${totalCorrect} correct`, subColor: "text-green-400", icon: Target },
          { label: "Minutes Practiced", value: state.totalMinutesPracticed.toString(), sub: "total time invested", subColor: "text-slate-400", icon: Clock },
        ].map(({ label, value, sub, subColor, icon: Icon }, i) => (
          <motion.div key={label} custom={i} initial="hidden" animate="visible" variants={cardVariants}>
            <Card><CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</span>
                <Icon className="w-4 h-4 text-slate-600" />
              </div>
              <div className="text-3xl font-bold tabular-nums">{value}</div>
              <div className={`text-xs mt-1 ${subColor}`}>{sub}</div>
            </CardContent></Card>
          </motion.div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-400" /> Section Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {SECTION_META.map((s, i) => {
            const Icon = SECTION_ICONS[s.id] ?? Target;
            const p = perfMap[s.id];
            const score = p ? p.pct : null;
            const { label, color } = score !== null ? gradeLabel(score) : { label: "Not started", color: "text-slate-500" };
            const qCount = QUESTIONS.filter(q => q.section === s.id).length;
            return (
              <motion.div key={s.id} custom={i} initial="hidden" animate="visible" variants={cardVariants}>
                <Link href={`/drill?section=${s.id}`}>
                  <Card className="hover:border-slate-600 transition-all cursor-pointer group hover:bg-slate-800/30">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="p-2 rounded-xl bg-slate-800 group-hover:bg-slate-700 transition-colors"><Icon className="w-5 h-5 text-blue-300" /></div>
                        <Badge variant={score === null ? "secondary" : score >= 75 ? "success" : score >= 60 ? "warning" : "destructive"} className="text-xs">
                          {score !== null ? `${score}%` : "New"}
                        </Badge>
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{s.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{Math.round(s.timeSeconds / 60)} min • {qCount} questions</div>
                      </div>
                      {score !== null && <Progress value={score} indicatorClassName={score >= 75 ? "bg-green-500" : score >= 60 ? "bg-amber-500" : "bg-red-500"} />}
                      <div className={`text-xs font-medium ${color}`}>{label}</div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Brain className="w-4 h-4 text-red-400" /> Weak Areas (SM-2 Priority)</h3>
            {weakTopics.length === 0 ? (
              <p className="text-slate-500 text-sm">Complete sessions to surface weak areas. The adaptive engine will then target them.</p>
            ) : (
              <div className="space-y-3">
                {weakTopics.map(t => (
                  <div key={`${t.section}-${t.topic}`} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300 capitalize">{t.topic.replace(/-/g, " ")}</span>
                      <span className="text-red-400 font-semibold tabular-nums">{t.pct}%</span>
                    </div>
                    <Progress value={t.pct} indicatorClassName="bg-red-500" />
                    <div className="text-xs text-slate-500">{t.correct}/{t.total} correct — {t.section}</div>
                  </div>
                ))}
                <Button asChild variant="outline" size="sm" className="w-full"><Link href="/adaptive"><Brain className="w-4 h-4" /> Drill Weak Areas<ChevronRight className="w-4 h-4 ml-auto" /></Link></Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold">Practice Modes</h3>
            {[
              { href: "/drill", label: "Section Drill", desc: "One section, full timer, practice or test mode", Icon: Dumbbell, cls: "bg-blue-600 hover:bg-blue-700" },
              { href: "/adaptive", label: "Adaptive Mode", desc: "SM-2 targets your weakest questions across sections", Icon: Brain, cls: "bg-purple-600 hover:bg-purple-700" },
              { href: "/exam", label: "Full Exam Simulation", desc: "All 7 sections, official timing, zero feedback", Icon: GraduationCap, cls: "bg-red-700 hover:bg-red-800" },
              { href: "/analytics", label: "Growth Analytics", desc: "Charts, radar, session history, improvement trends", Icon: BarChart3, cls: "bg-slate-700 hover:bg-slate-600" },
            ].map(({ href, label, desc, Icon, cls }) => (
              <Link key={href} href={href}>
                <div className={`flex items-center gap-3 p-3 rounded-xl ${cls} text-white transition-all cursor-pointer group`}>
                  <Icon className="w-5 h-5 shrink-0" />
                  <div className="flex-1 min-w-0"><div className="font-semibold text-sm">{label}</div><div className="text-xs text-white/70">{desc}</div></div>
                  <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-blue-900/40">
        <CardContent className="p-5">
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            {[
              { title: "SM-2 Spaced Repetition", color: "text-blue-300", body: "Based on Ebbinghaus forgetting curve research. Wrong answers resurface at optimally timed intervals — just before you would forget them." },
              { title: "Stress Inoculation Training", color: "text-amber-300", body: "Drills under time pressure build the calm-under-pressure performance that exam day demands. Train stressed. Perform relaxed." },
              { title: "Deliberate Practice Metrics", color: "text-green-300", body: "Every session tracked. Improvement curves, section radar, and topic-level weakness data give you actionable insight, not just a score." },
            ].map(({ title, color, body }) => (
              <div key={title}><div className={`font-semibold mb-2 ${color}`}>{title}</div><p className="text-slate-400">{body}</p></div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
