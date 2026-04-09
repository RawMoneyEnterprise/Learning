import { describe, it, expect } from "vitest";
import { createIssueSchema, updateIssueSchema } from "@/lib/validations/issue";

describe("createIssueSchema", () => {
  it("validates a minimal issue", () => {
    const result = createIssueSchema.safeParse({ title: "Test issue" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("backlog");
      expect(result.data.priority).toBe("medium");
    }
  });

  it("rejects empty title", () => {
    const result = createIssueSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid statuses", () => {
    const statuses = [
      "backlog",
      "todo",
      "in_progress",
      "in_review",
      "done",
      "blocked",
      "cancelled",
    ];
    for (const status of statuses) {
      const result = createIssueSchema.safeParse({
        title: "Test",
        status,
      });
      expect(result.success).toBe(true);
    }
  });
});

describe("updateIssueSchema", () => {
  it("allows partial updates", () => {
    const result = updateIssueSchema.safeParse({ status: "done" });
    expect(result.success).toBe(true);
  });

  it("allows comment with status update", () => {
    const result = updateIssueSchema.safeParse({
      status: "blocked",
      comment: "Waiting on backend API",
    });
    expect(result.success).toBe(true);
  });
});
