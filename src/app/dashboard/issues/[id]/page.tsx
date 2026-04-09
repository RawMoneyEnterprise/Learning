import { IssueDetailClient } from "@/components/issues/IssueDetailClient";

export default function IssueDetailPage({ params }: { params: { id: string } }) {
  return <IssueDetailClient id={params.id} />;
}
