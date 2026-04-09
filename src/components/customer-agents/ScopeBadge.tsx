"use client";

import { cn } from "@/lib/utils";
import type { AgentScope } from "@/types";

const scopeConfig: Record<AgentScope, { label: string; className: string }> = {
  global:      { label: "Global",      className: "bg-blue-100 text-blue-700 border-blue-200" },
  marketplace: { label: "Marketplace", className: "bg-purple-100 text-purple-700 border-purple-200" },
  private:     { label: "Private",     className: "bg-amber-100 text-amber-700 border-amber-200" },
};

export function ScopeBadge({ scope }: { scope: AgentScope }) {
  const config = scopeConfig[scope] ?? scopeConfig.global;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
