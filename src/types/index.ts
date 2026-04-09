export type IssueStatus =
  | "backlog"
  | "todo"
  | "in_progress"
  | "in_review"
  | "done"
  | "blocked"
  | "cancelled";

export type Priority = "critical" | "high" | "medium" | "low";

export type AgentStatus = "idle" | "running" | "paused" | "error";

export type RunStatus = "running" | "completed" | "failed" | "cancelled";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type AgentScope = "global" | "marketplace" | "private";

export interface IssueListItem {
  id: string;
  identifier: string;
  title: string;
  status: IssueStatus;
  priority: Priority;
  assigneeAgent?: { id: string; name: string } | null;
  assigneeUser?: { id: string; name: string | null } | null;
  project?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentListItem {
  id: string;
  name: string;
  role: string;
  title?: string | null;
  status: AgentStatus;
  budgetCents: number;
  spentCents: number;
}

export interface SSEEvent {
  type: "issue_updated" | "comment_added" | "run_updated" | "agent_status";
  payload: Record<string, unknown>;
}
