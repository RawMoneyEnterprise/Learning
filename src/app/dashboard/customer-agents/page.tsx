import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getUserCompanyId } from "@/lib/db-helpers";
import { Suspense } from "react";
import { TabSwitcher } from "@/components/customer-agents/TabSwitcher";
import { RosterTab } from "@/components/customer-agents/RosterTab";
import { MarketplaceTab } from "@/components/customer-agents/MarketplaceTab";
import { PrivateAgentsTab } from "@/components/customer-agents/PrivateAgentsTab";
import type { AgentScope } from "@/types";

type Tab = "roster" | "marketplace" | "private";

interface AgentRow {
  id: string;
  name: string;
  role: string;
  title: string | null;
  description: string | null;
  status: string;
  scope: string;
}

export default async function CustomerAgentsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const clientId = await getUserCompanyId(session.user.id);
  if (!clientId) {
    return (
      <div className="py-20 text-center text-sm text-muted-foreground">
        No company found. Contact your administrator.
      </div>
    );
  }

  const clientNamespace = `clients/${clientId}`;
  const tab = (searchParams.tab ?? "roster") as Tab;

  // ── Roster ──────────────────────────────────────────────────────────────
  let rosterAgents: {
    id: string; name: string; role: string; title: string | null;
    description: string | null; scope: AgentScope; status: string;
  }[] = [];

  if (tab === "roster") {
    // Fetch activation IDs for this client
    const { data: activations } = await db.from("client_agent_activations")
      .select("agent_id")
      .eq("client_id", clientId) as { data: { agent_id: string }[] | null };
    const activatedIds = (activations ?? []).map((a) => a.agent_id);

    const [globalResult, privateResult] = await Promise.all([
      db.from("agents")
        .select("id, name, role, title, description, status, scope")
        .eq("scope", "global")
        .order("name", { ascending: true }) as Promise<{ data: AgentRow[] | null }>,

      db.from("agents")
        .select("id, name, role, title, description, status, scope")
        .eq("scope", "private")
        .eq("client_namespace", clientNamespace)
        .order("name", { ascending: true }) as Promise<{ data: AgentRow[] | null }>,
    ]);

    let marketplaceAgents: AgentRow[] = [];
    if (activatedIds.length > 0) {
      const { data } = await db.from("agents")
        .select("id, name, role, title, description, status, scope")
        .eq("scope", "marketplace")
        .in("id", activatedIds)
        .order("name", { ascending: true }) as { data: AgentRow[] | null };
      marketplaceAgents = data ?? [];
    }

    rosterAgents = [
      ...(globalResult.data ?? []),
      ...marketplaceAgents,
      ...(privateResult.data ?? []),
    ].map((a) => ({ ...a, scope: a.scope as AgentScope }));
  }

  // ── Marketplace ───────────────────────────────────────────────────────────
  let marketplaceAgents: {
    id: string; name: string; role: string; title: string | null;
    description: string | null; activated: boolean; activatedAt: string | null;
  }[] = [];

  if (tab === "marketplace") {
    const { data: allMarketplace } = await db.from("agents")
      .select("id, name, role, title, description")
      .eq("scope", "marketplace")
      .order("name", { ascending: true }) as { data: { id: string; name: string; role: string; title: string | null; description: string | null }[] | null };

    const ids = (allMarketplace ?? []).map((a) => a.id);
    const { data: activations } = ids.length > 0
      ? await db.from("client_agent_activations")
          .select("agent_id, activated_at")
          .eq("client_id", clientId)
          .in("agent_id", ids) as { data: { agent_id: string; activated_at: string }[] | null }
      : { data: [] };

    const activationMap = new Map((activations ?? []).map((a) => [a.agent_id, a.activated_at]));

    marketplaceAgents = (allMarketplace ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      role: a.role,
      title: a.title,
      description: a.description,
      activated: activationMap.has(a.id),
      activatedAt: activationMap.get(a.id) ?? null,
    }));
  }

  // ── Private ───────────────────────────────────────────────────────────────
  let privateAgents: {
    id: string; name: string; role: string; title: string | null;
    description: string | null; createdAt: string;
  }[] = [];

  if (tab === "private") {
    const { data } = await db.from("agents")
      .select("id, name, role, title, description, created_at")
      .eq("scope", "private")
      .eq("client_namespace", clientNamespace)
      .order("created_at", { ascending: false }) as { data: { id: string; name: string; role: string; title: string | null; description: string | null; created_at: string }[] | null };

    privateAgents = (data ?? []).map((a) => ({ ...a, createdAt: a.created_at }));
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Customer Agents</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage the agents available to your organisation.
        </p>
      </div>

      <Suspense>
        <TabSwitcher activeTab={tab} />
      </Suspense>

      {tab === "roster" && <RosterTab agents={rosterAgents} />}
      {tab === "marketplace" && <MarketplaceTab initialAgents={marketplaceAgents} />}
      {tab === "private" && <PrivateAgentsTab initialAgents={privateAgents} />}
    </div>
  );
}
