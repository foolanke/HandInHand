import * as React from "react";
import { cn } from "./utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

export function Progress({ value = 0, className, ...props }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-slate-700/50", className)}
      {...props}
    >
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-[width]"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
