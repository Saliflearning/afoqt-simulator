"use client";
import { cn, formatTime, timerColor, timerBg } from "@/lib/utils";
import { Timer } from "lucide-react";

interface Props {
  timeLeft: number;
  totalTime: number;
  running: boolean;
}

export function TimerDisplay({ timeLeft, totalTime, running }: Props) {
  const ratio = totalTime > 0 ? timeLeft / totalTime : 1;
  const pct = Math.max(0, Math.min(100, ratio * 100));
  const urgent = ratio <= 0.15;

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2 rounded-xl border transition-all",
      urgent ? "border-red-800 bg-red-950/30 animate-pulse" : "border-slate-700 bg-slate-900"
    )}>
      <Timer className={cn("w-4 h-4", timerColor(ratio))} />
      <span className={cn("font-mono text-xl font-bold tabular-nums", timerColor(ratio))}>
        {formatTime(timeLeft)}
      </span>
      <div className="w-24 h-2 rounded-full bg-slate-800 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-1000", timerBg(ratio))}
          style={{ width: `${pct}%` }}
        />
      </div>
      {!running && timeLeft > 0 && (
        <span className="text-xs text-slate-500">paused</span>
      )}
    </div>
  );
}
