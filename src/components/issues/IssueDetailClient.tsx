"use client";

import { useState } from "react";
import Link from "next/link";
import { useIssue, useUpdateIssue, useAddComment } from "@/hooks/issues";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PriorityIcon } from "@/components/shared/PriorityIcon";
import { StatusSelect } from "./StatusSelect";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { IssueStatus, Priority } from "@/types";

interface IssueDetailClientProps {
  id: string;
}

export function IssueDetailClient({ id }: IssueDetailClientProps) {
  const { data: issue, isLoading, isError } = useIssue(id);
  const updateIssue = useUpdateIssue();
  const addComment = useAddComment(id);
  const [commentBody, setCommentBody] = useState("");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (isError || !issue) {
    return (
      <div className="py-20 text-center text-sm text-destructive">
        Issue not found.
      </div>
    );
  }

  function handleStatusChange(status: IssueStatus) {
    updateIssue.mutate({ id, status });
  }

  function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    const body = commentBody.trim();
    if (!body) return;
    addComment.mutate(body, {
      onSuccess: () => setCommentBody(""),
    });
  }

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/dashboard/issues"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Issues
        </Link>
        <span>/</span>
        <span className="font-mono text-xs">{issue.identifier}</span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Main content */}
        <div className="col-span-2 space-y-6">
          <div>
            <h1 className="text-2xl font-semibold leading-tight">{issue.title}</h1>
            <div className="mt-2 flex items-center gap-3">
              <StatusBadge status={issue.status as IssueStatus} />
              <PriorityIcon priority={issue.priority as Priority} showLabel />
              <span className="text-xs text-muted-foreground">
                Updated {formatDistanceToNow(new Date(issue.updatedAt), { addSuffix: true })}
              </span>
            </div>
          </div>

          {issue.description && (
            <Card>
              <CardContent className="pt-6">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {issue.description}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Sub-issues */}
          {issue.children.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Sub-issues ({issue.children.length})</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2">
                  {issue.children.map((child) => (
                    <li key={child.id} className="flex items-center gap-3">
                      <StatusBadge status={child.status as IssueStatus} />
                      <Link
                        href={`/dashboard/issues/${child.id}`}
                        className="text-sm hover:text-primary transition-colors"
                      >
                        <span className="font-mono text-xs text-muted-foreground mr-2">
                          {child.identifier}
                        </span>
                        {child.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Comments */}
          <div>
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              Activity ({issue.comments.length})
            </h2>
            {issue.comments.length > 0 && (
              <div className="space-y-3 mb-4">
                {issue.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`rounded-lg border bg-card p-4 ${
                      comment.id.startsWith("optimistic-") ? "opacity-60" : ""
                    }`}
                  >
                    <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {comment.authorUser?.name ?? "Agent"}
                      </span>
                      <span>·</span>
                      <span>
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {comment.body}
                    </pre>
                  </div>
                ))}
              </div>
            )}

            {/* Add comment form */}
            <form onSubmit={handleSubmitComment} className="space-y-2">
              <Textarea
                placeholder="Leave a comment…"
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                rows={3}
                className="text-sm"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!commentBody.trim() || addComment.isPending}
                >
                  {addComment.isPending ? "Posting…" : "Comment"}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar metadata */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4 text-sm">
              <MetaRow label="Status">
                <StatusSelect
                  value={issue.status as IssueStatus}
                  onChange={handleStatusChange}
                  disabled={updateIssue.isPending}
                />
              </MetaRow>
              <MetaRow label="Priority">
                <PriorityIcon priority={issue.priority as Priority} showLabel />
              </MetaRow>
              <MetaRow label="Assignee">
                {issue.assigneeAgent?.name ?? issue.assigneeUser?.name ?? "Unassigned"}
              </MetaRow>
              {issue.project && (
                <MetaRow label="Project">{issue.project.name}</MetaRow>
              )}
              {issue.goal && (
                <MetaRow label="Goal">
                  <span className="line-clamp-2">{issue.goal.title}</span>
                </MetaRow>
              )}
              {issue.parent && (
                <MetaRow label="Parent">
                  <Link
                    href={`/dashboard/issues/${issue.parent.id}`}
                    className="hover:text-primary transition-colors font-mono text-xs"
                  >
                    {issue.parent.identifier}
                  </Link>
                </MetaRow>
              )}
              <MetaRow label="Created">
                {formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}
              </MetaRow>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <div className="text-sm">{children}</div>
    </div>
  );
}
