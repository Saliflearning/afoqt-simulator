"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Brain, Dumbbell, GraduationCap, House, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/",          label: "Dashboard",  Icon: House },
  { href: "/drill",     label: "Drill",      Icon: Dumbbell },
  { href: "/adaptive",  label: "Adaptive",   Icon: Brain },
  { href: "/exam",      label: "Full Exam",  Icon: GraduationCap },
  { href: "/analytics", label: "Analytics",  Icon: BarChart3 },
  { href: "/review",    label: "Review",     Icon: Search },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 h-14">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-100 text-lg tracking-tight">
          <span className="text-blue-400">✈</span>
          <span>AFOQT<span className="text-blue-400">Pro</span></span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ href, label, Icon }) => {
            const active = path === href;
            return (
              <Link key={href} href={href}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  active ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800")}>
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            );
          })}
        </div>
        {/* Mobile bottom nav */}
        <div className="md:hidden flex items-center gap-1">
          {links.slice(0, 4).map(({ href, label, Icon }) => {
            const active = path === href;
            return (
              <Link key={href} href={href}
                className={cn("flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-xs font-medium transition-all",
                  active ? "text-blue-400" : "text-slate-500 hover:text-slate-300")}>
                <Icon className="w-4 h-4" />
                <span className="text-[10px]">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
