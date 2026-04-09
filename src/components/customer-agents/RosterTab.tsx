"use client";

import { ScopeBadge } from "./ScopeBadge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { AgentScope } from "@/types";

interface RosterAgent {
  id: string;
  name: string;
  role: string;
  title: string | null;
  description: string | null;
  scope: AgentScope;
  status: string;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const statusDot: Record<string, string> = {
  idle:    "bg-gray-400",
  running: "bg-green-500 animate-pulse",
  paused:  "bg-yellow-500",
  error:   "bg-red-500",
};

const avatarBg: Record<AgentScope, string> = {
  global:      "bg-blue-100 text-blue-700",
  marketplace: "bg-purple-100 text-purple-700",
  private:     "bg-amber-100 text-amber-700",
};

export function RosterTab({ agents }: { agents: RosterAgent[] }) {
  if (agents.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        No agents in your roster yet.
      </div>
    );
  }

  const grouped: Record<AgentScope, RosterAgent[]> = {
    global: [],
    marketplace: [],
    private: [],
  };

  for (const a of agents) {
    grouped[a.scope]?.push(a);
  }

  const sections: { scope: AgentScope; label: string }[] = [
    { scope: "global",      label: "Global Agents" },
    { scope: "marketplace", label: "Activated Marketplace Agents" },
    { scope: "private",     label: "Your Private Agents" },
  ];

  return (
    <div className="space-y-6">
      {sections.map(({ scope, label }) => {
        const list = grouped[scope];
        if (list.length === 0) return null;

        return (
          <div key={scope}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {label}
            </h3>
            <div className="rounded-lg border bg-card">
              {list.map((agent, i) => (
                <div
                  key={agent.id}
                  className={`flex items-center gap-3 px-4 py-3 ${i < list.length - 1 ? "border-b" : ""}`}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className={`text-xs font-semibold ${avatarBg[scope]}`}>
                      {initials(agent.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{agent.name}</span>
                      <span
                        className={`h-1.5 w-1.5 rounded-full shrink-0 ${statusDot[agent.status] ?? statusDot.idle}`}
                        title={agent.status}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">{agent.role}</p>
                  </div>

                  <ScopeBadge scope={scope} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
