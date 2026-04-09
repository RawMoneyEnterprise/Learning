"use client";

import { useState } from "react";
import Link from "next/link";
import { ScopeBadge } from "./ScopeBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PrivateAgent {
  id: string;
  name: string;
  role: string;
  title: string | null;
  description: string | null;
  createdAt: string;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function PrivateAgentsTab({ initialAgents }: { initialAgents: PrivateAgent[] }) {
  const [agents, setAgents] = useState<PrivateAgent[]>(initialAgents);
  const [deleting, setDeleting] = useState<Set<string>>(new Set());

  async function handleDelete(agentId: string) {
    if (!confirm("Remove this private agent? This cannot be undone.")) return;

    setDeleting((s) => new Set(s).add(agentId));

    try {
      const res = await fetch(`/api/customer-agents/private/${agentId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setAgents((prev) => prev.filter((a) => a.id !== agentId));
      }
    } finally {
      setDeleting((s) => {
        const next = new Set(s);
        next.delete(agentId);
        return next;
      });
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Private agents are only visible to your organisation.
        </p>
        <Link href="/dashboard/customer-agents/register">
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Register Agent
          </Button>
        </Link>
      </div>

      {agents.length === 0 ? (
        <div className="py-16 text-center text-sm text-muted-foreground rounded-lg border border-dashed">
          No private agents yet.{" "}
          <Link href="/dashboard/customer-agents/register" className="text-foreground font-medium hover:underline">
            Register your first agent
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">Agent</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs w-24">Scope</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground text-xs w-32">Registered</th>
                <th className="px-4 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="bg-amber-100 text-amber-700 text-xs font-semibold">
                          {initials(agent.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{agent.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{agent.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ScopeBadge scope="private" />
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(agent.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                      disabled={deleting.has(agent.id)}
                      onClick={() => handleDelete(agent.id)}
                      title="Remove agent"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
