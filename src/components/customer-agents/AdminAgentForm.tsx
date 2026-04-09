"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function AdminAgentForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name"),
      role: fd.get("role"),
      title: fd.get("title") || undefined,
      description: fd.get("description") || undefined,
      scope: fd.get("scope") as string,
    };

    try {
      const res = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 201) {
        router.push("/dashboard/admin/agents");
        router.refresh();
        return;
      }

      const data = await res.json();
      setError(data.error ? JSON.stringify(data.error) : "Failed to create agent.");
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Name *</Label>
        <Input id="name" name="name" required maxLength={100} placeholder="e.g. CxMO Triage Bot" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="role">Role *</Label>
        <Input id="role" name="role" required maxLength={100} placeholder="e.g. triage" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" maxLength={200} placeholder="e.g. Customer Support Specialist" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="scope">Scope *</Label>
        <select
          id="scope"
          name="scope"
          defaultValue="global"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="global">Global (available to all clients)</option>
          <option value="marketplace">Marketplace (clients opt-in)</option>
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          maxLength={2000}
          placeholder="Describe what this agent does…"
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Creating…" : "Create Agent"}
      </Button>
    </form>
  );
}
