"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CheckSquare,
  FolderOpen,
  Bot,
  Settings,
  Zap,
  Store,
  ShieldCheck,
} from "lucide-react";

const navItems = [
  { href: "/dashboard",                      label: "Dashboard",       icon: LayoutDashboard },
  { href: "/dashboard/issues",               label: "Issues",          icon: CheckSquare },
  { href: "/dashboard/projects",             label: "Projects",        icon: FolderOpen },
  { href: "/dashboard/agents",               label: "Agents",          icon: Bot },
  { href: "/dashboard/customer-agents",      label: "Customer Agents", icon: Store },
];

const adminItems = [
  { href: "/dashboard/admin/agents", label: "Agent Admin", icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <Zap className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm tracking-tight">Paperclip</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Admin section */}
      <div className="border-t px-2 py-3">
        <p className="px-3 mb-1 text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
          Admin
        </p>
        <ul className="space-y-0.5">
          {adminItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Bottom */}
      <div className="border-t px-2 py-3">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
        >
          <Settings className="h-4 w-4 shrink-0" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
