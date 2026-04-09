import { cn } from "@/lib/utils";
import type { IssueStatus } from "@/types";

const statusConfig: Record<IssueStatus, { label: string; className: string }> = {
  backlog:     { label: "Backlog",     className: "bg-gray-100 text-gray-600" },
  todo:        { label: "Todo",        className: "bg-slate-100 text-slate-600" },
  in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-700" },
  in_review:   { label: "In Review",   className: "bg-purple-100 text-purple-700" },
  done:        { label: "Done",        className: "bg-green-100 text-green-700" },
  blocked:     { label: "Blocked",     className: "bg-red-100 text-red-700" },
  cancelled:   { label: "Cancelled",   className: "bg-gray-100 text-gray-400 line-through" },
};

export function StatusBadge({ status }: { status: IssueStatus }) {
  const { label, className } = statusConfig[status] ?? statusConfig.backlog;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", className)}>
      {label}
    </span>
  );
}
