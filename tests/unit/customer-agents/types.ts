/**
 * Shared types for Customer Agent Scoping tests.
 * Mirrors the architecture defined in CXM-19.
 */

export enum AgentScope {
  global = "global",
  marketplace = "marketplace",
  private = "private",
}

export interface Agent {
  id: string;
  name: string;
  scope: AgentScope;
  /** Set iff scope === 'private'. Format: "clients/{clientId}" */
  client_namespace: string | null;
  description?: string;
}

export interface ScopedAgent {
  agentId: string;
  name: string;
  scope: AgentScope;
  description: string;
}

export interface BrandContext {
  clientId: string;
  voice?: string;
  tone?: string;
  [key: string]: unknown;
}

export interface AgentRosterResponse {
  clientId: string;
  agents: ScopedAgent[];
}

/** Minimal interface the PrivateAgentGuard depends on. */
export interface AgentRepository {
  findById(agentId: string): Promise<Agent | null>;
}

/** Minimal interface RosterService depends on. */
export interface RosterRepository {
  findByScope(scope: AgentScope): Promise<Agent[]>;
  findMarketplaceActivatedByClient(clientId: string): Promise<Agent[]>;
  findPrivateByClientNamespace(namespace: string): Promise<Agent[]>;
}

/** Minimal interface BrandContextService depends on. */
export interface BrandStore {
  get(key: string): Promise<BrandContext | null>;
}

export interface AuditLogger {
  warn(event: string, meta: Record<string, unknown>): void;
}

export class NotFoundError extends Error {
  constructor() {
    super("Not found");
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}
