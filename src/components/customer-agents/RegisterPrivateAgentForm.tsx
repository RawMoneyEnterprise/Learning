"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function RegisterPrivateAgentForm() {
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
    };

    try {
      const res = await fetch("/api/customer-agents/private", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.status === 201) {
        router.push("/dashboard/customer-agents?tab=private");
        router.refresh();
        return;
      }

      const data = await res.json();
      setError(data.error ? JSON.stringify(data.error) : "Registration failed.");
    } catch {
      setError("Something went wrong. Please try again.");
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
        <Label htmlFor="name">Agent Name *</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder="e.g. ACME Internal Triage Bot"
          maxLength={100}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="role">Role *</Label>
        <Input
          id="role"
          name="role"
          required
          placeholder="e.g. triage, support, sales"
          maxLength={100}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          placeholder="e.g. Customer Support Specialist"
          maxLength={200}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="What does this agent do? What tools does it have access to?"
          rows={3}
          maxLength={2000}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Registering…" : "Register Agent"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/dashboard/customer-agents?tab=private")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
