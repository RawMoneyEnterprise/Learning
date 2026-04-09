"use client";

import { useState, useCallback } from "react";
import { ScopeBadge } from "./ScopeBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MarketplaceAgent {
  id: string;
  name: string;
  role: string;
  title: string | null;
  description: string | null;
  activated: boolean;
  activatedAt: string | null;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function MarketplaceTab({ initialAgents }: { initialAgents: MarketplaceAgent[] }) {
  const [agents, setAgents] = useState<MarketplaceAgent[]>(initialAgents);
  const [pending, setPending] = useState<Set<string>>(new Set());

  const toggle = useCallback(async (agentId: string, currentlyActivated: boolean) => {
    setPending((s) => new Set(s).add(agentId));

    try {
      const res = await fetch(`/api/customer-agents/marketplace/${agentId}/activate`, {
        method: currentlyActivated ? "DELETE" : "POST",
      });

      if (res.ok) {
        setAgents((prev) =>
          prev.map((a) =>
            a.id === agentId
              ? { ...a, activated: !currentlyActivated, activatedAt: currentlyActivated ? null : new Date().toISOString() }
              : a
          )
        );
      }
    } finally {
      setPending((s) => {
        const next = new Set(s);
        next.delete(agentId);
        return next;
      });
    }
  }, []);

  if (agents.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        No marketplace agents available yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => {
        const isBusy = pending.has(agent.id);
        return (
          <div
            key={agent.id}
            className={cn(
              "flex flex-col rounded-lg border bg-card p-4 gap-3 transition-shadow",
              agent.activated ? "border-purple-200 shadow-sm" : ""
            )}
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-purple-100 text-purple-700 text-xs font-semibold">
                  {initials(agent.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm truncate">{agent.name}</h3>
                  <ScopeBadge scope="marketplace" />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 capitalize">{agent.role}</p>
                {agent.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{agent.description}</p>
                )}
              </div>
            </div>
            <Button
              size="sm"
              variant={agent.activated ? "outline" : "default"}
              disabled={isBusy}
              className="w-full"
              onClick={() => toggle(agent.id, agent.activated)}
            >
              {isBusy
                ? agent.activated ? "Deactivating…" : "Activating…"
                : agent.activated ? "Deactivate" : "Activate"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
