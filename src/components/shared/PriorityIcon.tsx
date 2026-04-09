import { cn } from "@/lib/utils";
import type { Priority } from "@/types";

const priorityConfig: Record<Priority, { label: string; className: string; bars: number }> = {
  critical: { label: "Critical", className: "text-red-500",    bars: 4 },
  high:     { label: "High",     className: "text-orange-500", bars: 3 },
  medium:   { label: "Medium",   className: "text-yellow-500", bars: 2 },
  low:      { label: "Low",      className: "text-gray-400",   bars: 1 },
};

export function PriorityIcon({ priority, showLabel = false }: { priority: Priority; showLabel?: boolean }) {
  const { label, className, bars } = priorityConfig[priority] ?? priorityConfig.medium;

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium", className)} title={label}>
      <span className="flex items-end gap-px">
        {[1, 2, 3, 4].map((b) => (
          <span
            key={b}
            className={cn(
              "inline-block w-1 rounded-sm",
              b <= bars ? "opacity-100" : "opacity-25",
              b === 1 ? "h-1.5" : b === 2 ? "h-2.5" : b === 3 ? "h-3.5" : "h-4"
            )}
            style={{ backgroundColor: "currentColor" }}
          />
        ))}
      </span>
      {showLabel && <span>{label}</span>}
    </span>
  );
}
