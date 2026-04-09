"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { key: "roster",      label: "Roster" },
  { key: "marketplace", label: "Marketplace" },
  { key: "private",     label: "Private Agents" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function TabSwitcher({ activeTab }: { activeTab: TabKey }) {
  return (
    <div className="flex gap-1 border-b mb-6">
      {TABS.map(({ key, label }) => (
        <Link
          key={key}
          href={`?tab=${key}`}
          replace
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === key
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

export type { TabKey };
