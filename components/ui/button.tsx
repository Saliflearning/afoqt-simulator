import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none active:scale-95",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20",
        destructive: "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/20",
        outline: "border border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800 hover:border-slate-600",
        ghost: "text-slate-300 hover:bg-slate-800 hover:text-slate-100",
        success: "bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-600/20",
        amber: "bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-600/20",
        purple: "bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-600/20",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref as any} className={cn(buttonVariants({ variant, size, className }))} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
