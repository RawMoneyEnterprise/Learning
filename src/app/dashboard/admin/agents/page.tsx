import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserCompanyId } from "@/lib/db-helpers";
import Link from "next/link";
import { ScopeBadge } from "@/components/customer-agents/ScopeBadge";
import { AdminAgentForm } from "@/components/customer-agents/AdminAgentForm";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgentScope } from "@/types";
import { Plus, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

interface AgentRow {
  id: string;
  name: string;
  role: string;
  title: string | null;
  description: string | null;
  status: string;
  scope: string;
  updated_at: string;
}

export default async function AdminAgentsPage({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const companyId = await getUserCompanyId(session.user.id);
  if (!companyId) {
    return <div className="py-20 text-center text-sm text-muted-foreground">No company found.</div>;
  }

  const showForm = searchParams.view === "new";

  const { data: agents } = await db.from("agents")
    .select("id, name, role, title, description, status, scope, updated_at")
    .eq("company_id", companyId)
    .in("scope", ["global", "marketplace"])
    .order("scope", { ascending: true })
    .order("name", { ascending: true }) as { data: AgentRow[] | null };

  const list = agents ?? [];
  const globalCount = list.filter((a) => a.scope === "global").length;
  const marketplaceCount = list.filter((a) => a.scope === "marketplace").length;

  // Fetch activation counts for marketplace agents
  const marketplaceIds = list.filter((a) => a.scope === "marketplace").map((a) => a.id);
  const activationCountMap = new Map<string, number>();
  if (marketplaceIds.length > 0) {
    const { data: activations } = await db.from("client_agent_activations")
      .select("agent_id")
      .in("agent_id", marketplaceIds) as { data: { agent_id: string }[] | null };
    for (const row of activations ?? []) {
      activationCountMap.set(row.agent_id, (activationCountMap.get(row.agent_id) ?? 0) + 1);
    }
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Admin: Agent Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage global and marketplace agents available on the platform.
          </p>
        </div>
        {!showForm && (
          <Link
            href="/dashboard/admin/agents?view=new"
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Agent
          </Link>
        )}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 max-w-sm">
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{globalCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Global</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 text-center">
            <p className="text-2xl font-bold">{marketplaceCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Marketplace</p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Add New Agent</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminAgentForm />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            Platform Agents ({list.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {list.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No agents yet.{" "}
              <Link href="?view=new" className="font-medium text-foreground hover:underline">Add one</Link>
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 text-left font-medium text-muted-foreground text-xs">Agent</th>
                  <th className="pb-2 text-left font-medium text-muted-foreground text-xs w-28">Scope</th>
                  <th className="pb-2 text-left font-medium text-muted-foreground text-xs w-24">Activations</th>
                  <th className="pb-2 text-left font-medium text-muted-foreground text-xs w-28">Updated</th>
                </tr>
              </thead>
              <tbody>
                {list.map((agent) => (
                  <tr key={agent.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-7 w-7 shrink-0">
                          <AvatarFallback
                            className={`text-xs font-semibold ${
                              agent.scope === "global"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-purple-100 text-purple-700"
                            }`}
                          >
                            {initials(agent.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{agent.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{agent.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <ScopeBadge scope={agent.scope as AgentScope} />
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">
                      {agent.scope === "marketplace" ? (
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {activationCountMap.get(agent.id) ?? 0}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(agent.updated_at), { addSuffix: true })}
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
