import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserCompanyId } from "@/lib/db-helpers";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  active:    "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  archived:  "bg-gray-100 text-gray-500",
};

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  status: string;
  updated_at: string;
}

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const companyId = await getUserCompanyId(session.user.id);
  if (!companyId) {
    return <div className="py-20 text-center text-sm text-muted-foreground">No company found.</div>;
  }

  const { data: projects } = await db.from("projects")
    .select("id, name, description, status, updated_at")
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false }) as { data: ProjectRow[] | null };

  const list = projects ?? [];

  // Fetch issue counts per project
  const { data: issueCounts } = await db.from("issues")
    .select("project_id")
    .eq("company_id", companyId)
    .not("project_id", "is", null) as { data: { project_id: string }[] | null };

  const countMap = new Map<string, number>();
  for (const row of issueCounts ?? []) {
    countMap.set(row.project_id, (countMap.get(row.project_id) ?? 0) + 1);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Projects</h1>
        <span className="text-sm text-muted-foreground">{list.length} projects</span>
      </div>

      {list.length === 0 ? (
        <div className="py-20 text-center text-sm text-muted-foreground">No projects yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((project) => (
            <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <FolderOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                        statusColors[project.status] ?? statusColors.active
                      )}
                    >
                      {project.status}
                    </span>
                  </div>
                  <CardTitle className="text-base mt-2">{project.name}</CardTitle>
                  {project.description && (
                    <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{countMap.get(project.id) ?? 0} issues</span>
                    <span>{formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
