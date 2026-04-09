import { Suspense } from "react";
import { IssueListClient } from "@/components/issues/IssueListClient";

export default function IssuesPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>}>
      <IssueListClient />
    </Suspense>
  );
}
