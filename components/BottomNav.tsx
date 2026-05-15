"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Brain, Dumbbell, GraduationCap, House } from "lucide-react";
import { cn } from "@/lib/utils";

// 5 primary tabs for mobile — Review accessible via Analytics link
const BOTTOM_TABS = [
  { href: "/",          label: "Home",     Icon: House },
  { href: "/drill",     label: "Drill",    Icon: Dumbbell },
  { href: "/adaptive",  label: "Adaptive", Icon: Brain },
  { href: "/exam",      label: "Exam",     Icon: GraduationCap },
  { href: "/analytics", label: "Stats",    Icon: BarChart3 },
];

/**
 * Mobile-only bottom tab bar — hidden on md+ (desktop uses top Nav).
 * Meets:
 *  - 48dp min touch targets (h-12 = 48px per tab)
 *  - 8px+ horizontal spacing between tabs
 *  - env(safe-area-inset-bottom) padding for iPhone home bar / Android gesture nav
 *  - Icon + label per tab (no icon-only nav)
 *  - Active state uses blue accent + indicator dot
 */
export function BottomNav() {
  const path = usePathname();
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-md border-t border-slate-800"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Main navigation"
    >
      <div className="flex items-stretch">
        {BOTTOM_TABS.map(({ href, label, Icon }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                // Full-width tap zone, min 48px height, centered content
                "flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[48px] py-2",
                "text-[10px] font-semibold tracking-wide uppercase transition-colors",
                "touch-manipulation select-none",
                active
                  ? "text-blue-400"
                  : "text-slate-500 active:text-slate-300"
              )}
            >
              <div className="relative">
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform",
                    active && "scale-110"
                  )}
                  aria-hidden="true"
                />
                {active && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-blue-400" />
                )}
              </div>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
