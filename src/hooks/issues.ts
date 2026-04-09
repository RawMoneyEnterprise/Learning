"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { IssueStatus, Priority } from "@/types";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface IssueListItem {
  id: string;
  identifier: string;
  title: string;
  status: IssueStatus;
  priority: Priority;
  assigneeAgent: { id: string; name: string } | null;
  assigneeUser: { id: string; name: string | null } | null;
  project: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  issueId: string;
  body: string;
  authorUserId: string | null;
  authorUser: { id: string; name: string | null; image: string | null } | null;
  authorAgentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IssueDetail extends IssueListItem {
  description: string | null;
  assigneeAgent: { id: string; name: string; role: string } | null;
  assigneeUser: { id: string; name: string | null; email: string } | null;
  createdBy: { id: string; name: string | null; email: string } | null;
  goal: { id: string; title: string } | null;
  parent: { id: string; identifier: string; title: string } | null;
  children: { id: string; identifier: string; title: string; status: IssueStatus; priority: Priority }[];
  comments: Comment[];
  labels: { id: string; name: string; color: string }[];
}

export interface Project {
  id: string;
  name: string;
  status: string;
  _count?: { issues: number };
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ─── Query keys ──────────────────────────────────────────────────────────────

export const issueKeys = {
  all: ["issues"] as const,
  list: (status?: string) => ["issues", "list", status ?? "all"] as const,
  detail: (id: string) => ["issues", "detail", id] as const,
  comments: (id: string) => ["issues", "comments", id] as const,
};

export const projectKeys = {
  all: ["projects"] as const,
  list: () => ["projects", "list"] as const,
};

// ─── Issue hooks ─────────────────────────────────────────────────────────────

export function useIssues(status?: string) {
  const url = status ? `/api/issues?status=${status}` : "/api/issues";
  return useQuery({
    queryKey: issueKeys.list(status),
    queryFn: () => fetchJson<IssueListItem[]>(url),
  });
}

export function useIssue(id: string) {
  return useQuery({
    queryKey: issueKeys.detail(id),
    queryFn: () => fetchJson<IssueDetail>(`/api/issues/${id}`),
    enabled: !!id,
  });
}

export function useUpdateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; status?: IssueStatus; priority?: Priority; title?: string; description?: string }) =>
      fetchJson<IssueDetail>(`/api/issues/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onMutate: async ({ id, ...data }) => {
      await qc.cancelQueries({ queryKey: issueKeys.detail(id) });
      const previous = qc.getQueryData<IssueDetail>(issueKeys.detail(id));
      if (previous) {
        qc.setQueryData<IssueDetail>(issueKeys.detail(id), { ...previous, ...data });
      }
      // also update in list caches
      qc.setQueriesData<IssueListItem[]>({ queryKey: issueKeys.all }, (old) =>
        old?.map((issue) => (issue.id === id ? { ...issue, ...data } : issue))
      );
      return { previous };
    },
    onError: (_err, { id }, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(issueKeys.detail(id), ctx.previous);
      }
    },
    onSettled: (_data, _err, { id }) => {
      qc.invalidateQueries({ queryKey: issueKeys.detail(id) });
      qc.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
}

export function useCreateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      description?: string;
      status?: IssueStatus;
      priority?: Priority;
      projectId?: string;
    }) =>
      fetchJson<IssueListItem>("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: issueKeys.all });
    },
  });
}

export function useAddComment(issueId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      fetchJson<Comment>(`/api/issues/${issueId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body }),
      }),
    onMutate: async (body) => {
      await qc.cancelQueries({ queryKey: issueKeys.detail(issueId) });
      const previous = qc.getQueryData<IssueDetail>(issueKeys.detail(issueId));
      if (previous) {
        const optimisticComment: Comment = {
          id: `optimistic-${Date.now()}`,
          issueId,
          body,
          authorUserId: null,
          authorUser: null,
          authorAgentId: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        qc.setQueryData<IssueDetail>(issueKeys.detail(issueId), {
          ...previous,
          comments: [...previous.comments, optimisticComment],
        });
      }
      return { previous };
    },
    onError: (_err, _body, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(issueKeys.detail(issueId), ctx.previous);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: issueKeys.detail(issueId) });
    },
  });
}

// ─── Project hooks ────────────────────────────────────────────────────────────

export function useProjects() {
  return useQuery({
    queryKey: projectKeys.list(),
    queryFn: () => fetchJson<Project[]>("/api/projects"),
  });
}
