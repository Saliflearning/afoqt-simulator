"use client";
import { useEffect, useState, useMemo } from "react";
import { Search, Filter, CheckCircle2, XCircle, Clock, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { loadState } from "@/lib/storage";
import { QUESTIONS, SECTION_META } from "@/lib/questions";
import { pct } from "@/lib/utils";
import type { AppState, SectionId } from "@/lib/types";

type FilterSection = SectionId | "all";
type FilterStatus = "all" | "correct" | "wrong" | "unseen";

export default function ReviewPage() {
  const [state, setState] = useState<AppState | null>(null);
  const [search, setSearch] = useState("");
  const [filterSection, setFilterSection] = useState<FilterSection>("all");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { setState(loadState()); }, []);

  const questionStats = useMemo(() => {
    if (!state) return {};
    const stats: Record<string, { correct: number; total: number; lastCorrect: boolean | null }> = {};
    for (const session of state.sessions) {
      for (const attempt of session.attempts) {
        if (!stats[attempt.questionId]) stats[attempt.questionId] = { correct: 0, total: 0, lastCorrect: null };
        stats[attempt.questionId].total += 1;
        if (attempt.correct) stats[attempt.questionId].correct += 1;
        stats[attempt.questionId].lastCorrect = attempt.correct;
      }
    }
    return stats;
  }, [state]);

  const filtered = useMemo(() => {
    if (!state) return [];
    return QUESTIONS.filter(q => {
      if (filterSection !== "all" && q.section !== filterSection) return false;
      const s = questionStats[q.id];
      if (filterStatus === "unseen" && s) return false;
      if (filterStatus === "correct" && (!s || s.lastCorrect !== true)) return false;
      if (filterStatus === "wrong" && (!s || s.lastCorrect !== false)) return false;
      if (search && !q.q.toLowerCase().includes(search.toLowerCase()) && !q.choices.some(c => c.toLowerCase().includes(search.toLowerCase()))) return false;
      return true;
    });
  }, [state, filterSection, filterStatus, search, questionStats]);

  if (!state) return <div className="flex items-center justify-center min-h-screen text-slate-400">Loading...</div>;

  const totalSeen = QUESTIONS.filter(q => questionStats[q.id]).length;
  const totalCorrect = QUESTIONS.filter(q => questionStats[q.id]?.lastCorrect === true).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Search className="w-5 h-5 text-blue-400" /> Question Review</h1>
        <p className="text-slate-400 text-sm mt-1">Browse all questions, see your history, identify patterns.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4">
          <div className="text-2xl font-bold tabular-nums">{totalSeen}/{QUESTIONS.length}</div>
          <div className="text-xs text-slate-400 mt-1">Questions seen</div>
          <Progress value={pct(totalSeen, QUESTIONS.length)} className="mt-2 h-1.5" />
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-2xl font-bold text-green-400 tabular-nums">{totalCorrect}</div>
          <div className="text-xs text-slate-400 mt-1">Last attempt correct</div>
          <Progress value={pct(totalCorrect, totalSeen)} indicatorClassName="bg-green-500" className="mt-2 h-1.5" />
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-2xl font-bold text-red-400 tabular-nums">{totalSeen - totalCorrect}</div>
          <div className="text-xs text-slate-400 mt-1">Need more work</div>
          <Progress value={pct(totalSeen - totalCorrect, totalSeen)} indicatorClassName="bg-red-500" className="mt-2 h-1.5" />
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Search questions…" value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant={filterSection === "all" ? "default" : "outline"} onClick={() => setFilterSection("all")}>All Sections</Button>
          {SECTION_META.map(s => (
            <Button key={s.id} size="sm" variant={filterSection === s.id ? "default" : "outline"} onClick={() => setFilterSection(s.id as SectionId)}>{s.title.split(" ")[0]}</Button>
          ))}
        </div>
        <div className="flex gap-2">
          {(["all", "correct", "wrong", "unseen"] as FilterStatus[]).map(f => (
            <Button key={f} size="sm" variant={filterStatus === f ? "default" : "outline"} onClick={() => setFilterStatus(f)} className="capitalize">{f}</Button>
          ))}
        </div>
      </div>

      <p className="text-sm text-slate-400">{filtered.length} questions matching filters</p>

      <div className="space-y-3">
        {filtered.map(q => {
          const s = questionStats[q.id];
          const isExpanded = expanded === q.id;
          const accuracyPct = s ? pct(s.correct, s.total) : null;

          return (
            <Card key={q.id} className={`cursor-pointer hover:border-slate-600 transition-all ${s?.lastCorrect === false ? "border-red-900/50" : s?.lastCorrect === true ? "border-green-900/30" : ""}`}>
              <CardContent className="p-4" onClick={() => setExpanded(isExpanded ? null : q.id)}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {s ? (
                      s.lastCorrect ? <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" /> : <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    ) : <Clock className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-sm text-slate-200 font-medium">{q.q}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px]">{q.section}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{q.topic.replace(/-/g, " ")}</Badge>
                        <span className={`text-[10px] font-semibold ${q.difficulty === 1 ? "text-green-400" : q.difficulty === 2 ? "text-amber-400" : "text-red-400"}`}>
                          {["", "Easy", "Medium", "Hard"][q.difficulty]}
                        </span>
                        {s && <span className="text-[10px] text-slate-400">{s.correct}/{s.total} correct ({accuracyPct}%)</span>}
                        {!s && <span className="text-[10px] text-slate-500">Not seen</span>}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 shrink-0">{isExpanded ? "▲" : "▼"}</span>
                </div>

                {isExpanded && (
                  <div className="mt-4 space-y-3 border-t border-slate-800 pt-4">
                    <div className="grid grid-cols-1 gap-2">
                      {q.choices.map((c, i) => (
                        <div key={i} className={`flex items-center gap-2 p-2.5 rounded-lg text-sm ${i === q.answer ? "bg-green-950/40 text-green-300 border border-green-800/50" : "bg-slate-800 text-slate-300"}`}>
                          <span className="font-bold w-5 shrink-0">{String.fromCharCode(65 + i)}.</span>
                          <span>{c}</span>
                          {i === q.answer && <CheckCircle2 className="w-4 h-4 text-green-400 ml-auto shrink-0" />}
                        </div>
                      ))}
                    </div>
                    <div className="p-3 rounded-xl bg-slate-800 text-sm text-slate-300">
                      <span className="font-semibold text-slate-200">Explanation: </span>{q.why}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
            <p>No questions match your filters.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => { setSearch(""); setFilterSection("all"); setFilterStatus("all"); }}>
              <RotateCcw className="w-3.5 h-3.5" /> Clear filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
