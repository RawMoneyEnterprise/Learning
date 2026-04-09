import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserCompanyId } from "@/lib/db-helpers";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { AgentStatus } from "@/types";

const statusConfig: Record<AgentStatus, { label: string; dot: string }> = {
  idle:    { label: "Idle",    dot: "bg-gray-400" },
  running: { label: "Running", dot: "bg-green-500 animate-pulse" },
  paused:  { label: "Paused",  dot: "bg-yellow-500" },
  error:   { label: "Error",   dot: "bg-red-500" },
};

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function formatBudget(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

interface AgentRow {
  id: string;
  name: string;
  role: string;
  title: string | null;
  status: string;
  budget_cents: number;
  spent_cents: number;
}

export default async function AgentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const companyId = await getUserCompanyId(session.user.id);
  if (!companyId) {
    return <div className="py-20 text-center text-sm text-muted-foreground">No company found.</div>;
  }

  const { data: agents } = await db.from("agents")
    .select("id, name, role, title, status, budget_cents, spent_cents")
    .eq("company_id", companyId)
    .order("name", { ascending: true }) as { data: AgentRow[] | null };

  const list = agents ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Agents</h1>
        <span className="text-sm text-muted-foreground">{list.length} agents</span>
      </div>

      {list.length === 0 ? (
        <div className="py-20 text-center text-sm text-muted-foreground">No agents yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((agent) => {
            const status = statusConfig[agent.status as AgentStatus] ?? statusConfig.idle;
            const budgetUsedPct = agent.budget_cents > 0
              ? Math.min(100, Math.round((agent.spent_cents / agent.budget_cents) * 100))
              : 0;

            return (
              <Card key={agent.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {initials(agent.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm truncate">{agent.name}</h3>
                        <span className={cn("h-2 w-2 rounded-full shrink-0", status.dot)} title={status.label} />
                      </div>
                      <p className="text-xs text-muted-foreground capitalize mt-0.5">{agent.role}</p>
                      {agent.title && (
                        <p className="text-xs text-muted-foreground truncate">{agent.title}</p>
                      )}
                    </div>
                  </div>

                  {agent.budget_cents > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Budget</span>
                        <span>{formatBudget(agent.spent_cents)} / {formatBudget(agent.budget_cents)}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            budgetUsedPct >= 80 ? "bg-red-500" : budgetUsedPct >= 60 ? "bg-yellow-500" : "bg-green-500"
                          )}
                          style={{ width: `${budgetUsedPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
