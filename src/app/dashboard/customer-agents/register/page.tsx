import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { RegisterPrivateAgentForm } from "@/components/customer-agents/RegisterPrivateAgentForm";

export default async function RegisterPrivateAgentPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/dashboard/customer-agents?tab=private"
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Private Agents
        </Link>
      </div>

      <h1 className="text-xl font-semibold mb-1">Register Private Agent</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Bring your own agent into the CxMO platform. Private agents are only visible to your organisation.
      </p>

      <RegisterPrivateAgentForm />
    </div>
  );
}
