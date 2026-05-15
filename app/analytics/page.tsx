"use client";
import { useEffect, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, Cell, Legend } from "recharts";
import { BarChart3, TrendingUp, Brain, Clock, Target, Flame, ShieldCheck, AlertTriangle, Minus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { loadState } from "@/lib/storage";
import { computeSectionPerf, computeWeakTopics, rollingScores, pct, gradeLabel } from "@/lib/utils";
import { SECTION_META } from "@/lib/questions";
import type { AppState } from "@/lib/types";
import { COMPOSITE_DEFS } from "@/lib/types";

const SECTION_COLORS: Record<string, string> = {
  verbal: "#60a5fa", arithmetic: "#34d399", word: "#a78bfa",
  math: "#fbbf24", science: "#f87171", table: "#38bdf8", aviation: "#fb923c",
};

export default function AnalyticsPage() {
  const [state, setState] = useState<AppState | null>(null);
  useEffect(() => { setState(loadState()); }, []);
  if (!state) return <div className="flex items-center justify-center min-h-screen text-slate-400">Loading analytics...</div>;

  const perf = computeSectionPerf(state.sessions);
  const weakTopics = computeWeakTopics(state.sessions).slice(0, 8);
  const growth = rollingScores(state.sessions);
  const totalQ = state.sessions.reduce((s, x) => s + x.total, 0);
  const totalCorrect = state.sessions.reduce((s, x) => s + x.score, 0);
  const overallPct = pct(totalCorrect, totalQ);
  const { label, color } = gradeLabel(overallPct);

  const radarData = SECTION_META.map(s => {
    const p = perf.find(x => x.section === s.id);
    return { section: s.title.split(" ")[0], score: p ? p.pct : 0 };
  });

  const barData = perf.map(p => ({ section: SECTION_META.find(s => s.id === p.section)?.title.split(" ")[0] ?? p.section, score: p.pct, color: SECTION_COLORS[p.section] ?? "#60a5fa" }));

  // Composite scores — weighted average of contributing section scores
  const compositeScores = COMPOSITE_DEFS.map(def => {
    const sectionScores = def.sections.map(sid => perf.find(p => p.section === sid)?.pct ?? null);
    const valid = sectionScores.filter((s): s is number => s !== null);
    const score = valid.length > 0 ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null;
    const coverage = valid.length; // how many contributing sections have data
    return { ...def, score, coverage, total: def.sections.length };
  });

  const sessionHistory = state.sessions.slice(-20).map((s, i) => ({
    session: i + 1,
    score: pct(s.score, s.total),
    mode: s.mode,
    section: s.section,
    date: new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  const avgTimePerQ = state.sessions.length > 0
    ? Math.round(state.sessions.reduce((s, x) => s + (x.total > 0 ? x.timeUsedSeconds / x.total : 0), 0) / state.sessions.length)
    : 0;

  if (state.sessions.length === 0) return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card><CardContent className="p-8 text-center space-y-4">
        <BarChart3 className="w-12 h-12 text-blue-400 mx-auto" />
        <h2 className="text-2xl font-bold">No Data Yet</h2>
        <p className="text-slate-400">Complete at least one drill or exam session to see your analytics.</p>
        <div className="flex gap-3 justify-center">
          <a href="/drill" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">Start Drill</a>
          <a href="/exam" className="px-4 py-2 bg-slate-700 text-slate-200 rounded-xl text-sm font-medium hover:bg-slate-600 transition-colors">Full Exam</a>
        </div>
      </CardContent></Card>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-5 h-5 text-blue-400" />
          <h1 className="text-2xl font-bold">Growth Analytics</h1>
        </div>
        <p className="text-slate-400 text-sm">Track your improvement trajectory across all AFOQT sections.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Overall", value: `${overallPct}%`, sub: label, subColor: color, icon: TrendingUp },
          { label: "Sessions", value: state.sessions.length.toString(), sub: "completed", subColor: "text-slate-400", icon: Target },
          { label: "Questions", value: totalQ.toLocaleString(), sub: `${totalCorrect} correct`, subColor: "text-green-400", icon: Brain },
          { label: "Avg Sec/Q", value: `${avgTimePerQ}s`, sub: "per question", subColor: "text-slate-400", icon: Clock },
          { label: "Streak", value: `${state.streak}d`, sub: "consecutive days", subColor: "text-amber-400", icon: Flame },
        ].map(({ label, value, sub, subColor, icon: Icon }) => (
          <Card key={label}><CardContent className="p-4">
            <div className="flex items-center justify-between mb-1"><span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span><Icon className="w-3.5 h-3.5 text-slate-600" /></div>
            <div className="text-2xl font-bold tabular-nums">{value}</div>
            <div className={`text-xs mt-0.5 ${subColor}`}>{sub}</div>
          </CardContent></Card>
        ))}
      </div>

      {/* AFOQT Composite Scores */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold">AFOQT Composite Scores</h3>
            <span className="text-xs text-slate-500 ml-auto">Based on your drill & exam history</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {compositeScores.map(def => {
              const hasData = def.score !== null;
              const score = def.score ?? 0;
              const { label: gl, color: gc } = gradeLabel(score);
              const minScore = (def as any).minScore;
              const qualified = minScore ? score >= minScore : null;
              return (
                <div key={def.key} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm">{def.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug max-w-[220px]">{def.description}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      {hasData ? (
                        <>
                          <div className={`text-2xl font-bold tabular-nums ${gc}`}>{score}%</div>
                          <div className="text-[10px] text-slate-400">{gl}</div>
                        </>
                      ) : (
                        <div className="text-slate-600 text-sm">No data</div>
                      )}
                    </div>
                  </div>
                  {hasData && <Progress value={score} indicatorClassName={score >= 75 ? "bg-green-500" : score >= 60 ? "bg-amber-500" : "bg-red-500"} className="h-1.5" />}
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>{def.coverage}/{def.total} sections tracked</span>
                    {minScore && hasData && (
                      <span className={`flex items-center gap-1 font-medium ${qualified ? "text-green-400" : "text-red-400"}`}>
                        {qualified
                          ? <><ShieldCheck className="w-3 h-3" /> Meets min ({minScore}%)</>
                          : <><AlertTriangle className="w-3 h-3" /> Below min ({minScore}%)</>
                        }
                      </span>
                    )}
                    {!minScore && <span className="flex items-center gap-0.5"><Minus className="w-3 h-3" /> No min score</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Composites are approximations derived from your practice data. Official AFOQT composites use scaled scores from a standardized norming population — these percentages show your relative standing across the sections that feed each composite.
          </p>
        </CardContent>
      </Card>

      {/* Growth line chart */}
      {growth.length > 1 && (
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-400" /> Score Trend (daily average)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={growth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f1f5f9" }} formatter={(v) => [`${v}%`, "Score"]} />
                <Line type="monotone" dataKey="score" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3, fill: "#60a5fa" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Radar + Bar side by side */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold">Section Performance Radar</h3>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1e293b" />
                <PolarAngleAxis dataKey="section" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#475569", fontSize: 9 }} />
                <Radar name="Score" dataKey="score" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.25} strokeWidth={2} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f1f5f9" }} formatter={(v) => [`${v}%`, "Score"]} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold">Section Scores</h3>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} />
                  <YAxis type="category" dataKey="section" tick={{ fill: "#94a3b8", fontSize: 11 }} width={60} />
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", color: "#f1f5f9" }} formatter={(v) => [`${v}%`, "Score"]} />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                    {barData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-slate-500 text-sm text-center py-10">No section data yet</p>}
          </CardContent>
        </Card>
      </div>

      {/* Weak topics */}
      {weakTopics.length > 0 && (
        <Card>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Brain className="w-4 h-4 text-red-400" /> Weak Topic Breakdown</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {weakTopics.map(t => (
                <div key={`${t.section}-${t.topic}`} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-300 capitalize">{t.topic.replace(/-/g, " ")}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">{t.section}</Badge>
                      <span className={`font-semibold tabular-nums text-sm ${t.pct >= 60 ? "text-amber-400" : "text-red-400"}`}>{t.pct}%</span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full rounded-full ${t.pct >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${t.pct}%` }} />
                  </div>
                  <div className="text-xs text-slate-500">{t.correct}/{t.total} correct</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session history */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="font-semibold">Recent Sessions</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {sessionHistory.slice().reverse().map((s, i) => {
              const { label, color } = gradeLabel(s.score);
              return (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-800 text-sm">
                  <div className="flex items-center gap-3">
                    <Badge variant={s.mode === "exam" ? "destructive" : s.mode === "adaptive" ? "purple" : "secondary"} className="text-xs capitalize">{s.mode}</Badge>
                    <span className="text-slate-300 capitalize">{s.section}</span>
                    <span className="text-slate-500 text-xs">{s.date}</span>
                  </div>
                  <span className={`font-semibold tabular-nums ${color}`}>{s.score}%</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
