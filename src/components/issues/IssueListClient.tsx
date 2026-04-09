"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PriorityIcon } from "@/components/shared/PriorityIcon";
import { CreateIssueModal } from "./CreateIssueModal";
import { useIssues } from "@/hooks/issues";
import { formatDistanceToNow } from "date-fns";
import type { IssueStatus, Priority } from "@/types";
import { cn } from "@/lib/utils";

const STATUS_TABS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
  { value: "blocked", label: "Blocked" },
  { value: "backlog", label: "Backlog" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

export function IssueListClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const statusFilter = searchParams.get("status") ?? "";

  const { data: issues, isLoading, isError } = useIssues(statusFilter || undefined);

  function setStatus(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("status", value);
    } else {
      params.delete("status");
    }
    router.push(`/dashboard/issues?${params.toString()}`);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Issues</h1>
        <div className="flex items-center gap-3">
          {!isLoading && (
            <span className="text-sm text-muted-foreground">{issues?.length ?? 0} issues</span>
          )}
          <CreateIssueModal />
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="mb-4 flex gap-1 flex-wrap">
        {STATUS_TABS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setStatus(value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              statusFilter === value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Issues table */}
      <div className="rounded-lg border bg-card">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Loading issues…</div>
        ) : isError ? (
          <div className="py-16 text-center text-sm text-destructive">Failed to load issues.</div>
        ) : !issues || issues.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">No issues found.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-24">ID</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-32">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-20">Priority</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-36">Assignee</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground w-28">Updated</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr
                  key={issue.id}
                  className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/issues/${issue.id}`)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{issue.identifier}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/issues/${issue.id}`}
                      className="font-medium hover:text-primary transition-colors line-clamp-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {issue.title}
                    </Link>
                    {issue.project && (
                      <span className="text-xs text-muted-foreground mt-0.5 block">{issue.project.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={issue.status as IssueStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityIcon priority={issue.priority as Priority} />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {issue.assigneeAgent?.name ?? issue.assigneeUser?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(issue.updatedAt), { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
