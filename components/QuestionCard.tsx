"use client";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Question } from "@/lib/types";
import { TABLE_GRID, X_VALS, Y_VALS } from "@/lib/questions";
import { Badge } from "./ui/badge";

interface Props {
  question: Question;
  index: number;
  total: number;
  selected: number | undefined;
  showFeedback: boolean;
  onChoose: (i: number) => void;
}

const difficultyColors = ["", "text-green-400", "text-amber-400", "text-red-400"];
const difficultyLabels = ["", "Easy", "Medium", "Hard"];

export function QuestionCard({ question: q, index, total, selected, showFeedback, onChoose }: Props) {
  const answered = selected !== undefined;

  return (
    <motion.div
      key={q.id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      {/* Header row */}
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>Question <span className="text-slate-200 font-semibold">{index + 1}</span> of {total}</span>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">{q.topic.replace(/-/g, " ")}</Badge>
          <span className={cn("text-xs font-semibold", difficultyColors[q.difficulty])}>
            {difficultyLabels[q.difficulty]}
          </span>
        </div>
      </div>

      {/* Table (for table reading section) */}
      {q.section === "table" && (
        <div className="overflow-x-auto rounded-xl border border-slate-700 bg-slate-950 p-3">
          <table className="w-full text-center text-xs md:text-sm">
            <thead>
              <tr>
                <th className="p-2 text-slate-500 font-medium">Y \ X</th>
                {X_VALS.map(x => (
                  <th key={x} className={cn("p-2 font-bold", (q as any).x === x ? "text-blue-300 bg-blue-950/40 rounded" : "text-slate-400")}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Y_VALS.map(y => (
                <tr key={y} className="border-t border-slate-800">
                  <th className={cn("p-2 font-bold", (q as any).y === y ? "text-blue-300 bg-blue-950/40" : "text-slate-400")}>{y}</th>
                  {X_VALS.map(x => {
                    const isTarget = (q as any).x === x && (q as any).y === y;
                    return (
                      <td key={x} className={cn("p-2 tabular-nums", isTarget ? "text-yellow-300 font-bold ring-1 ring-yellow-500 rounded" : "text-slate-300")}>
                        {TABLE_GRID[y][x]}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Question text */}
      <div className="text-xl md:text-2xl font-semibold text-slate-100 leading-snug">{q.q}</div>

      {/* Choices */}
      <div className="grid gap-3">
        {q.choices.map((choice, i) => {
          const isSelected = selected === i;
          const isCorrect = q.answer === i;
          const reveal = showFeedback && answered;

          let ringClass = "";
          if (reveal && isCorrect) ringClass = "ring-2 ring-green-500 bg-green-950/30";
          else if (reveal && isSelected && !isCorrect) ringClass = "ring-2 ring-red-500 bg-red-950/30";
          else if (isSelected) ringClass = "ring-2 ring-blue-500 bg-blue-950/30";

          return (
            <button
              key={i}
              onClick={() => !answered && onChoose(i)}
              disabled={answered && !showFeedback}
              className={cn(
                "text-left p-4 rounded-xl border border-slate-700 transition-all duration-150",
                "min-h-[52px] flex items-center gap-3",
                !answered ? "hover:bg-slate-800 hover:border-slate-600 cursor-pointer active:scale-[0.99]" : "cursor-default",
                isSelected && !reveal ? "border-blue-500 bg-blue-950/20" : "",
                ringClass
              )}
            >
              <span className="w-7 h-7 rounded-full border border-slate-600 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="text-slate-200">{choice}</span>
              {reveal && isCorrect && <CheckCircle2 className="w-5 h-5 text-green-400 ml-auto shrink-0" />}
              {reveal && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-400 ml-auto shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      <AnimatePresence>
        {showFeedback && answered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-xl border border-slate-700 bg-slate-950 p-4"
          >
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-semibold text-slate-400 mb-1">Explanation</div>
                <p className="text-slate-300 text-sm">{q.why}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
