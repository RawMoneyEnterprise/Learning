import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getUserCompanyId } from "@/lib/db-helpers";
import Link from "next/link";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PriorityIcon } from "@/components/shared/PriorityIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { IssueStatus, Priority } from "@/types";
import { formatDistanceToNow } from "date-fns";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const projectStatusColors: Record<string, string> = {
  active:    "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  archived:  "bg-gray-100 text-gray-500",
};

interface IssueRow {
  id: string;
  identifier: string;
  title: string;
  status: string;
  priority: string;
  assignee_agent_id: string | null;
  assignee_user_id: string | null;
  updated_at: string;
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const companyId = await getUserCompanyId(session.user.id);
  if (!companyId) redirect("/auth/login");

  const { data: project } = await db.from("projects")
    .select("id, name, description, status, updated_at")
    .eq("id", params.id)
    .eq("company_id", companyId)
    .single() as { data: Record<string, unknown> | null };

  if (!project) notFound();

  const { data: issues } = await db.from("issues")
    .select("id, identifier, title, status, priority, assignee_agent_id, assignee_user_id, updated_at")
    .eq("project_id", params.id)
    .order("updated_at", { ascending: false }) as { data: IssueRow[] | null };

  const issueList = issues ?? [];

  const statusCounts = issueList.reduce(
    (acc, issue) => { acc[issue.status] = (acc[issue.status] ?? 0) + 1; return acc; },
    {} as Record<string, number>
  );

  const done = statusCounts["done"] ?? 0;
  const total = issueList.length;
  const progressPct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="max-w-5xl">
      <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard/projects" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Projects
        </Link>
      </div>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{project.name as string}</h1>
          {project.description && (
            <p className="mt-1 text-sm text-muted-foreground">{project.description as string}</p>
          )}
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
            projectStatusColors[project.status as string] ?? projectStatusColors.active
          )}
        >
          {project.status as string}
        </span>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total issues</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold">{statusCounts["in_progress"] ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-0.5">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Progress</p>
              <p className="text-xs font-medium">{progressPct}%</p>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{done} / {total} done</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Issues ({total})</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {total === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No issues yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 text-left font-medium text-muted-foreground w-24 text-xs">ID</th>
                  <th className="pb-2 text-left font-medium text-muted-foreground text-xs">Title</th>
                  <th className="pb-2 text-left font-medium text-muted-foreground w-32 text-xs">Status</th>
                  <th className="pb-2 text-left font-medium text-muted-foreground w-20 text-xs">Priority</th>
                  <th className="pb-2 text-left font-medium text-muted-foreground w-28 text-xs">Updated</th>
                </tr>
              </thead>
              <tbody>
                {issueList.map((issue) => (
                  <tr key={issue.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 font-mono text-xs text-muted-foreground">{issue.identifier}</td>
                    <td className="py-2.5">
                      <Link
                        href={`/dashboard/issues/${issue.id}`}
                        className="font-medium hover:text-primary transition-colors line-clamp-1 text-sm"
                      >
                        {issue.title}
                      </Link>
                    </td>
                    <td className="py-2.5">
                      <StatusBadge status={issue.status as IssueStatus} />
                    </td>
                    <td className="py-2.5">
                      <PriorityIcon priority={issue.priority as Priority} />
                    </td>
                    <td className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(issue.updated_at), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
