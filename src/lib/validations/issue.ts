import { z } from "zod";

export const IssueStatusEnum = z.enum([
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
  "blocked",
  "cancelled",
]);

export const PriorityEnum = z.enum(["critical", "high", "medium", "low"]);

export const createIssueSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  status: IssueStatusEnum.optional().default("backlog"),
  priority: PriorityEnum.optional().default("medium"),
  projectId: z.string().cuid().optional(),
  goalId: z.string().cuid().optional(),
  parentId: z.string().cuid().optional(),
  assigneeAgentId: z.string().cuid().optional(),
  assigneeUserId: z.string().cuid().optional(),
});

export const updateIssueSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  status: IssueStatusEnum.optional(),
  priority: PriorityEnum.optional(),
  projectId: z.string().cuid().nullable().optional(),
  goalId: z.string().cuid().nullable().optional(),
  assigneeAgentId: z.string().cuid().nullable().optional(),
  assigneeUserId: z.string().cuid().nullable().optional(),
  comment: z.string().optional(), // optional comment alongside status update
});

export type CreateIssueInput = z.infer<typeof createIssueSchema>;
export type UpdateIssueInput = z.infer<typeof updateIssueSchema>;
